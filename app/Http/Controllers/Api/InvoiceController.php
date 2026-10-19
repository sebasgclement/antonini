<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Customer;
use App\Models\CurrentAccount;

class InvoiceController extends Controller
{
    // A / B   => factura fiscal (pasa por ARCA)
    // X       => venta interna / no fiscal (no pasa por ARCA ni genera asiento contable)
    // NC/ND/Recibo => comprobantes simples (monto + concepto), fiscales o no según `is_fiscal`
    private const SIMPLE_TYPES = ['NC', 'ND', 'Recibo'];

    // GET /invoices  — listado para reportes (ej: ?is_fiscal=0&from=2026-10-01&to=2026-10-31)
    public function index(Request $request)
    {
        $request->validate([
            'from'             => 'nullable|date',
            'to'               => 'nullable|date',
            'is_fiscal'        => 'nullable|boolean',
            'type'             => 'nullable|string|max:10',
            'business_unit_id' => 'nullable|exists:business_units,id',
            'customer_id'      => 'nullable|exists:customers,id',
        ]);

        // Los comprobantes internos (no fiscales) sólo los ve un admin
        if (!auth()->user()->isAdmin()) {
            $request->merge(['is_fiscal' => 1]);
        }

        $query = Invoice::with([
                'customer:id,first_name,last_name,cuit,doc_number',
                'businessUnit:id,name',
                'user:id,name',
            ])
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->to))
            ->when($request->filled('is_fiscal'), fn ($q) => $q->where('is_fiscal', $request->boolean('is_fiscal')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when($request->filled('business_unit_id'), fn ($q) => $q->where('business_unit_id', $request->business_unit_id))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->customer_id))
            ->orderByDesc('created_at');

        $invoices = $query->get();

        // Ventas (A/B/X/ND suman) menos créditos (NC). Los recibos son cobros, no ventas.
        $sales = $invoices->whereIn('type', ['A', 'B', 'X', 'ND'])->sum('total')
               - $invoices->where('type', 'NC')->sum('total');

        // Cobrado = recibos + ventas de contado (que no generan recibo)
        $collected = $invoices->where('type', 'Recibo')->sum('total')
                   + $invoices->where('contado', true)->sum('total');

        return response()->json([
            'invoices' => $invoices,
            'totals'   => [
                'count'     => $invoices->count(),
                'sales'     => round($sales, 2),
                'collected' => round($collected, 2),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $type     = $request->input('type');
        $isSimple = in_array($type, self::SIMPLE_TYPES);

        // 1. Validación según tipo de comprobante
        if ($isSimple) {
            $request->validate([
                'customer_id'      => 'required|exists:customers,id',
                'business_unit_id' => 'required|exists:business_units,id',
                'type'             => 'required|string|in:NC,ND,Recibo',
                'amount'           => 'required|numeric|min:0.01',
                'concept'          => 'required|string|max:500',
                'is_fiscal'        => 'nullable|boolean',
            ]);
            $isFiscal = $request->boolean('is_fiscal', true);
        } else {
            $request->validate([
                'customer_id'            => 'required|exists:customers,id',
                'business_unit_id'       => 'required|exists:business_units,id',
                'type'                   => 'required|string|in:A,B,X',
                'items'                  => 'required|array|min:1',
                'items.*.quantity'       => 'required|integer|min:1',
                // Ítem del catálogo...
                'items.*.id'             => 'nullable|exists:products,id',
                // ...o ítem libre cargado desde la factura
                'items.*.description'    => 'required_without:items.*.id|nullable|string|max:255',
                'items.*.unit_price'     => 'required_without:items.*.id|nullable|numeric|min:0',
                'items.*.iva_percentage' => 'nullable|numeric|in:0,10.5,21,27',
                'items.*.item_type'      => 'nullable|in:product,service',
                'contado'                => 'nullable|boolean',
                'notes'                  => 'nullable|string|max:1000',
            ]);
            $isFiscal = $type !== 'X';
        }

        // Los comprobantes internos (no fiscales) quedan reservados a administradores
        if (!$isFiscal && !auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Sólo un administrador puede emitir comprobantes internos.'], 403);
        }

        if (!$isSimple) {
            // La letra tiene que coincidir con la condición IVA del cliente
            if ($isFiscal) {
                $customer = Customer::with('taxResponsibility')->find($request->customer_id);
                $error    = $this->checkInvoiceLetter($customer, $type);
                if ($error) {
                    return response()->json([
                        'message' => $error,
                        'errors'  => ['customer_id' => [$error]],
                    ], 422);
                }
            }
        }

        try {
            return DB::transaction(function () use ($request, $type, $isSimple, $isFiscal) {

                // Saldo anterior del cliente
                $lastMovement = CurrentAccount::where('customer_id', $request->customer_id)
                    ->orderBy('id', 'desc')
                    ->lockForUpdate()
                    ->first();
                $previousBalance = $lastMovement ? (float) $lastMovement->balance : 0;

                // ===========================================================
                // RAMA: NC / ND / Recibo  (sin items, monto y concepto directo)
                // ===========================================================
                if ($isSimple) {
                    $amount  = (float) $request->amount;
                    $concept = $request->concept;

                    $prefix = match ($type) {
                        'NC'     => 'NC',
                        'ND'     => 'ND',
                        'Recibo' => 'RB',
                    };
                    if (!$isFiscal) $prefix .= 'X';

                    $invoice = Invoice::create([
                        'customer_id'      => $request->customer_id,
                        'business_unit_id' => $request->business_unit_id,
                        'user_id'          => auth()->id(),
                        'type'             => $type,
                        'is_fiscal'        => $isFiscal,
                        'fiscal_status'    => $this->initialFiscalStatus($type, $isFiscal),
                        'subtotal'         => $amount,
                        'iva_amount'       => 0,
                        'total'            => $amount,
                        'notes'            => $concept,
                    ]);
                    $invoice->update([
                        'number' => "{$prefix}-0001-" . str_pad($invoice->id, 8, '0', STR_PAD_LEFT),
                    ]);

                    // NC y Recibo restan (crédito). ND suma (débito).
                    $isCredit   = in_array($type, ['NC', 'Recibo']);
                    $newBalance = $isCredit ? $previousBalance - $amount : $previousBalance + $amount;

                    CurrentAccount::create([
                        'customer_id'  => $request->customer_id,
                        'invoice_id'   => $invoice->id,
                        'concept'      => "{$type} N° {$invoice->number} — {$concept}",
                        'debit'        => $isCredit ? 0 : $amount,
                        'credit'       => $isCredit ? $amount : 0,
                        'balance'      => $newBalance,
                        'is_fiscal'    => $isFiscal,
                        'status'       => $type === 'Recibo' ? 'pagado' : 'pendiente',
                        'payment_date' => $type === 'Recibo' ? now()->toDateString() : null,
                    ]);

                    return response()->json([
                        'message' => "✅ {$type} registrada con éxito",
                        'invoice' => $invoice,
                    ], 201);
                }

                // ===========================================================
                // RAMA: Factura A / B / Venta no fiscal X  (con items)
                // ===========================================================
                $subtotal  = 0;
                $ivaAmount = 0;
                $itemsData = [];
                // Las ventas fiscales descuentan del stock oficial; las no fiscales, del interno
                $stockField = $isFiscal ? 'stock_official' : 'stock_internal';

                foreach ($request->items as $item) {
                    $quantity = (int) $item['quantity'];

                    if (!empty($item['id'])) {
                        $product = Product::with('iva')->lockForUpdate()->findOrFail($item['id']);

                        if ($product->type === 'product' && $product->{$stockField} < $quantity) {
                            throw new \DomainException(
                                "Stock insuficiente de \"{$product->description}\" (disponible: {$product->{$stockField}})"
                            );
                        }

                        $description = $product->description;
                        $unitPrice   = (float) $product->sale_price;
                        $ivaPct      = (float) ($product->iva->percentage ?? 21);
                        $itemType    = $product->type;

                        if ($product->type === 'product') {
                            $product->decrement($stockField, $quantity);
                        }
                    } else {
                        $product     = null;
                        $description = $item['description'];
                        $unitPrice   = (float) $item['unit_price'];
                        $ivaPct      = (float) ($item['iva_percentage'] ?? 21);
                        $itemType    = $item['item_type'] ?? 'service';
                    }

                    $lineTotal  = $unitPrice * $quantity;
                    $subtotal  += $lineTotal;
                    // Sólo la factura A discrimina IVA
                    if ($type === 'A') {
                        $ivaAmount += $lineTotal * $ivaPct / 100;
                    }

                    $itemsData[] = [
                        'product_id'     => $product?->id,
                        'item_type'      => $itemType,
                        'description'    => $description,
                        'quantity'       => $quantity,
                        'unit_price'     => $unitPrice,
                        'iva_percentage' => $ivaPct,
                        'subtotal'       => $lineTotal,
                    ];
                }

                $ivaAmount = round($ivaAmount, 2);
                $total     = $subtotal + $ivaAmount;
                $label     = $isFiscal ? "Factura {$type}" : 'Venta no fiscal';

                $contado = $request->boolean('contado');

                $invoice = Invoice::create([
                    'customer_id'      => $request->customer_id,
                    'business_unit_id' => $request->business_unit_id,
                    'user_id'          => auth()->id(),
                    'type'             => $type,
                    'is_fiscal'        => $isFiscal,
                    'fiscal_status'    => $this->initialFiscalStatus($type, $isFiscal),
                    'contado'          => $contado,
                    'subtotal'         => $subtotal,
                    'iva_amount'       => $ivaAmount,
                    'total'            => $total,
                    'notes'            => $request->notes,
                ]);
                $invoice->update([
                    'number' => ($isFiscal ? '' : 'X-') . '0001-' . str_pad($invoice->id, 8, '0', STR_PAD_LEFT),
                ]);

                $invoice->items()->createMany($itemsData);

                // Contado: se cobra en el momento, no pasa por cuenta corriente.
                // Cuenta corriente: entrada DEBE por el total.
                if (!$contado) {
                    CurrentAccount::create([
                        'customer_id' => $request->customer_id,
                        'invoice_id'  => $invoice->id,
                        'concept'     => "{$label} N° {$invoice->number}",
                        'debit'       => $total,
                        'credit'      => 0,
                        'balance'     => $previousBalance + $total,
                        'is_fiscal'   => $isFiscal,
                        'status'      => 'pendiente',
                    ]);
                }

                return response()->json([
                    'message' => '✅ Venta registrada con éxito',
                    'invoice' => $invoice->load('items'),
                ], 201);
            });

        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '❌ Error al procesar la venta',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // Devuelve el mensaje de error, o null si la letra corresponde a la condición IVA del cliente
    private function checkInvoiceLetter(?Customer $customer, string $type): ?string
    {
        $condition = $customer?->taxResponsibility;

        if (!$condition) {
            // Sin condición cargada se lo trata como Consumidor Final
            return $type === 'A'
                ? 'El cliente no tiene condición frente al IVA cargada. Completala para emitir Factura A.'
                : null;
        }

        if ($condition->invoice_letter !== $type) {
            return "A un cliente {$condition->description} corresponde emitirle Factura {$condition->invoice_letter}.";
        }

        if ($type === 'A' && empty($customer->cuit)) {
            return 'Factura A requiere CUIT del cliente';
        }

        return null;
    }

    // no_fiscal: nunca va a ARCA | pendiente: falta pedir CAE | no_aplica: recibo (no requiere CAE)
    private function initialFiscalStatus(string $type, bool $isFiscal): string
    {
        if (!$isFiscal) return 'no_fiscal';
        return $type === 'Recibo' ? 'no_aplica' : 'pendiente';
    }
}
