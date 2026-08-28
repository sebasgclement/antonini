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
    public function store(Request $request)
    {
        $type = $request->input('type');
        $isSimple = in_array($type, ['NC', 'ND', 'Recibo']);

        // 1. Validación según tipo de comprobante
        if ($isSimple) {
            $request->validate([
                'customer_id'      => 'required|exists:customers,id',
                'business_unit_id' => 'required|exists:business_units,id',
                'type'             => 'required|string|in:NC,ND,Recibo',
                'amount'           => 'required|numeric|min:0.01',
                'concept'          => 'required|string|max:500',
            ]);
        } else {
            $request->validate([
                'customer_id'      => 'required|exists:customers,id',
                'business_unit_id' => 'required|exists:business_units,id',
                'type'             => 'required|string|in:A,B',
                'items'            => 'required|array|min:1',
                'items.*.id'       => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'contado'          => 'nullable|boolean',
            ]);

            // Factura A requiere CUIT del cliente
            if ($type === 'A') {
                $customer = Customer::find($request->customer_id);
                if (empty($customer?->cuit)) {
                    return response()->json([
                        'message' => 'Factura A requiere CUIT del cliente',
                        'errors'  => ['customer_id' => ['El cliente seleccionado no tiene CUIT registrado']],
                    ], 422);
                }
            }
        }

        try {
            return DB::transaction(function () use ($request, $type, $isSimple) {

                // Saldo anterior del cliente
                $lastMovement = CurrentAccount::where('customer_id', $request->customer_id)
                    ->orderBy('id', 'desc')
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

                    $invoice = Invoice::create([
                        'customer_id'      => $request->customer_id,
                        'business_unit_id' => $request->business_unit_id,
                        'user_id'          => auth()->id(),
                        'type'             => $type,
                        'subtotal'         => $amount,
                        'iva_amount'       => 0,
                        'total'            => $amount,
                        'notes'            => $concept,
                    ]);
                    $invoice->update([
                        'number' => "{$prefix}-0001-" . str_pad($invoice->id, 8, '0', STR_PAD_LEFT),
                    ]);

                    // NC y Recibo restan (crédito). ND suma (débito).
                    $isCredit = in_array($type, ['NC', 'Recibo']);
                    $newBalance = $isCredit ? $previousBalance - $amount : $previousBalance + $amount;

                    CurrentAccount::create([
                        'customer_id' => $request->customer_id,
                        'invoice_id'  => $invoice->id,
                        'concept'     => "{$type} N° {$invoice->number} — {$concept}",
                        'debit'       => $isCredit ? 0 : $amount,
                        'credit'      => $isCredit ? $amount : 0,
                        'balance'     => $newBalance,
                    ]);

                    return response()->json([
                        'message' => "✅ {$type} registrada con éxito",
                        'invoice' => $invoice,
                    ], 201);
                }

                // ===========================================================
                // RAMA: Factura A / B  (con items y carrito)
                // ===========================================================
                $subtotal  = 0;
                $itemsData = [];

                foreach ($request->items as $item) {
                    $product  = Product::findOrFail($item['id']);
                    $quantity = (int) $item['quantity'];
                    $unitPrice = (float) $product->sale_price;
                    $lineTotal = $unitPrice * $quantity;
                    $subtotal += $lineTotal;

                    $itemsData[] = [
                        'product_id'  => $product->id,
                        'description' => $product->description,
                        'quantity'    => $quantity,
                        'unit_price'  => $unitPrice,
                        'subtotal'    => $lineTotal,
                    ];

                    if ($product->type === 'product') {
                        $product->decrement('stock_official', $quantity);
                    }
                }

                $ivaAmount = ($type === 'A') ? $subtotal * 0.21 : 0;
                $total     = $subtotal + $ivaAmount;

                $invoice = Invoice::create([
                    'customer_id'      => $request->customer_id,
                    'business_unit_id' => $request->business_unit_id,
                    'user_id'          => auth()->id(),
                    'type'             => $type,
                    'subtotal'         => $subtotal,
                    'iva_amount'       => $ivaAmount,
                    'total'            => $total,
                    'notes'            => $request->notes,
                ]);
                $invoice->update([
                    'number' => '0001-' . str_pad($invoice->id, 8, '0', STR_PAD_LEFT),
                ]);

                $invoice->items()->createMany($itemsData);

                // Entrada DEBE en cuenta corriente
                $newBalance = $previousBalance + $total;
                CurrentAccount::create([
                    'customer_id' => $request->customer_id,
                    'invoice_id'  => $invoice->id,
                    'concept'     => "Factura {$type} N° {$invoice->number}",
                    'debit'       => $total,
                    'credit'      => 0,
                    'balance'     => $newBalance,
                ]);

                // Modo contado: generar Recibo automático para saldo $0
                if ($request->boolean('contado')) {
                    $recibo = Invoice::create([
                        'customer_id'      => $request->customer_id,
                        'business_unit_id' => $request->business_unit_id,
                        'user_id'          => auth()->id(),
                        'type'             => 'Recibo',
                        'subtotal'         => $total,
                        'iva_amount'       => 0,
                        'total'            => $total,
                        'notes'            => "Recibo de Factura {$type} N° {$invoice->number}",
                    ]);
                    $recibo->update([
                        'number' => 'RB-0001-' . str_pad($recibo->id, 8, '0', STR_PAD_LEFT),
                    ]);

                    CurrentAccount::create([
                        'customer_id' => $request->customer_id,
                        'invoice_id'  => $recibo->id,
                        'concept'     => "Recibo N° {$recibo->number} (Contado)",
                        'debit'       => 0,
                        'credit'      => $total,
                        'balance'     => 0,
                    ]);
                }

                return response()->json([
                    'message' => '✅ Venta registrada con éxito',
                    'invoice' => $invoice->load('items'),
                ], 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'message' => '❌ Error al procesar la venta',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
