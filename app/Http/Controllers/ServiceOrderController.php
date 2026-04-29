<?php

namespace App\Http\Controllers;

use App\Models\ServiceOrder;
use App\Models\ServiceOrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ServiceOrderController extends Controller
{
    // Mostrar todas las órdenes (Para el listado principal)
    public function index(Request $request)
    {
        $orders = ServiceOrder::with(['customer', 'vehicle', 'technician'])
            ->orderBy('id', 'desc')
            ->paginate(15);
            
        return response()->json($orders);
    }

    // Crear una nueva Orden de Servicio
    public function store(Request $request)
    {
        // 1. Validamos que venga lo mínimo y necesario
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'vehicle_id'  => 'required|exists:vehicles,id',
            'type'        => 'required|in:particular,insurance',
            'items'       => 'required|array|min:1', // Los renglones
            'items.*.description' => 'required|string',
            'items.*.quantity'    => 'required|numeric|min:0.1',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        // 2. Usamos una Transacción (Si algo falla, no se guarda nada a medias)
        DB::beginTransaction();

        try {
            // A. Generamos un número de orden único (Ej: OS-20260429-001)
            $lastOrder = ServiceOrder::latest('id')->first();
            $nextId = $lastOrder ? $lastOrder->id + 1 : 1;
            $orderNumber = 'OS-' . now()->format('Ymd') . '-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

            // B. Creamos la Cabecera de la orden
            $order = ServiceOrder::create([
                'order_number'      => $orderNumber,
                'customer_id'       => $request->customer_id,
                'vehicle_id'        => $request->vehicle_id,
                'technician_id'     => $request->technician_id,
                'type'              => $request->type,
                'insurance_company' => $request->type === 'insurance' ? $request->insurance_company : null,
                'policy_number'     => $request->type === 'insurance' ? $request->policy_number : null,
                'claim_number'      => $request->type === 'insurance' ? $request->claim_number : null,
                'mileage'           => $request->mileage,
                'notes'             => $request->notes,
                'discount'          => $request->discount ?? 0,
                'status'            => 'pending'
            ]);

            $subtotalGeneral = 0;

            // C. Guardamos los Renglones (Items) y descontamos Stock
            foreach ($request->items as $item) {
                $subtotalItem = $item['quantity'] * $item['unit_price'];
                $subtotalGeneral += $subtotalItem;

                ServiceOrderItem::create([
                    'service_order_id' => $order->id,
                    'product_id'       => $item['product_id'] ?? null,
                    'description'      => $item['description'],
                    'quantity'         => $item['quantity'],
                    'unit_price'       => $item['unit_price'],
                    'subtotal'         => $subtotalItem,
                ]);

                // MAGIA: Si el ítem es un Producto del catálogo, descontamos el stock
                if (!empty($item['product_id'])) {
                    $product = Product::find($item['product_id']);
                    if ($product) {
                        // Descontamos stock (Asegurate de tener una columna stock en tu tabla products)
                        // $product->decrement('stock', $item['quantity']); 
                    }
                }
            }

            // D. Calculamos el Total Final de la Orden
            $totalFinal = $subtotalGeneral - $order->discount;
            // Si tenés impuestos (IVA), lo sumarías acá. Ejemplo: $totalFinal * 1.21

            $order->update([
                'subtotal' => $subtotalGeneral,
                'total'    => $totalFinal
            ]);

            DB::commit(); // Todo salió bien, guardamos definitivamente

            return response()->json([
                'message' => 'Orden de servicio creada con éxito',
                'order'   => $order->load('items') // Devolvemos la orden con sus items
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack(); // Si explotó algo, deshacemos todo
            return response()->json(['error' => 'Error al crear la orden: ' . $e->getMessage()], 500);
        }
    }

    // Ver el detalle de una orden (Para armar el PDF después)
    public function show($id)
    {
        $order = ServiceOrder::with(['customer', 'vehicle', 'technician', 'items.product'])->findOrFail($id);
        return response()->json($order);
    }
}