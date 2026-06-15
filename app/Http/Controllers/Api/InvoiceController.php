<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\CurrentAccount;

class InvoiceController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validamos que nos manden lo mínimo e indispensable
        $request->validate([
            'customer_id'      => 'required|exists:customers,id',
            'business_unit_id' => 'required|exists:business_units,id',
            'type'             => 'required|string|in:A,B,C,X',
            'items'            => 'required|array|min:1',
            'items.*.id'       => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            // INICIA LA TRANSACCIÓN MÁGICA 🧙‍♂️
            return DB::transaction(function () use ($request) {
                
                $subtotal = 0;
                $itemsData = [];

                // 2. Recorremos el carrito, buscamos el precio REAL en la BD y bajamos stock
                foreach ($request->items as $item) {
                    $product = Product::findOrFail($item['id']);
                    $quantity = $item['quantity'];
                    
                    
                    $unitPrice = $product->sale_price; 
                    $lineTotal = $unitPrice * $quantity;

                    $subtotal += $lineTotal;

                    
                    $itemsData[] = [
                        'product_id'  => $product->id,
                        'description' => $product->description,
                        'quantity'    => $quantity,
                        'unit_price'  => $unitPrice,
                        'subtotal'    => $lineTotal,
                    ];

                    // Si es un producto físico, restamos el stock según tipo de comprobante
                    if ($product->type === 'product') {
                        $stockField = ($request->type === 'X') ? 'stock_internal' : 'stock_official';
                        $product->decrement($stockField, $quantity);
                    }
                }

                // 3. Calculamos el IVA (Si es Factura A, le sumamos 21%. Si es B/X, asumimos que ya está incluido)
                $ivaAmount = ($request->type === 'A') ? $subtotal * 0.21 : 0;
                $total = $subtotal + $ivaAmount;

                // 4. Creamos la cabecera de la Factura
                // El número usa el ID auto-increment de la BD, que es atómico y sin race condition
                $invoice = Invoice::create([
                    'customer_id'      => $request->customer_id,
                    'business_unit_id' => $request->business_unit_id,
                    'user_id'          => auth()->id(),
                    'type'             => $request->type,
                    'subtotal'         => $subtotal,
                    'iva_amount'       => $ivaAmount,
                    'total'            => $total,
                    'notes'            => $request->notes,
                ]);
                $invoice->update([
                    'number' => '0001-' . str_pad($invoice->id, 8, '0', STR_PAD_LEFT),
                ]);

                // 5. Guardamos todos los ítems de la factura de un tirón
                $invoice->items()->createMany($itemsData);

                // 6. ACTUALIZAMOS LA CUENTA CORRIENTE DEL CLIENTE (El Cuaderno)
                
                
                $lastMovement = CurrentAccount::where('customer_id', $request->customer_id)
                                              ->orderBy('id', 'desc')
                                              ->first();
                
                $previousBalance = $lastMovement ? $lastMovement->balance : 0;
                
                
                $newBalance = $previousBalance + $total;

                CurrentAccount::create([
                    'customer_id' => $request->customer_id,
                    'invoice_id'  => $invoice->id,
                    'concept'     => "Factura {$invoice->type} N° {$invoice->number}",
                    'debit'       => $total, // DEBE: Lo que nos debe por esta venta
                    'credit'      => 0,      // HABER: Nada, porque todavía no nos pagó
                    'balance'     => $newBalance, // Su nuevo saldo total
                ]);

                
                return response()->json([
                    'message' => '✅ Venta registrada con éxito',
                    'invoice' => $invoice->load('items')
                ], 201);
            });

        } catch (\Exception $e) {
            
            return response()->json([
                'message' => '❌ Error al procesar la venta',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
