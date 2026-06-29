<?php

namespace App\Http\Controllers;

use App\Models\ServiceOrder;
use App\Models\ServiceOrderItem;
use App\Models\Product;
use App\Services\CurrentAccountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ServiceOrderController extends Controller
{
    public function __construct(private CurrentAccountService $ccService) {}
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
            $isInsurance = $request->type === 'insurance';
            $order = ServiceOrder::create([
                'order_number'      => $orderNumber,
                'customer_id'       => $request->customer_id,
                'vehicle_id'        => $request->vehicle_id,
                'technician_id'     => $request->technician_id,
                'type'              => $request->type,
                'insurance_company'  => $isInsurance ? $request->insurance_company : null,
                'insurer_id'         => $isInsurance ? $request->insurer_id : null,
                'insurance_due_date' => $isInsurance ? $request->insurance_due_date : null,
                'policy_number'      => $isInsurance ? $request->policy_number : null,
                'claim_number'       => $isInsurance ? $request->claim_number : null,
                'invoice_number'     => $isInsurance ? $request->invoice_number : null,
                'invoice_date'       => $isInsurance ? $request->invoice_date : null,
                'mileage'           => $request->mileage,
                'notes'             => $request->notes,
                'discount'          => $request->discount ?? 0,
                'status'            => 'pending'
            ]);

            $subtotalGeneral = 0;

            // C. Guardamos los Renglones (Items) y descontamos Stock
            foreach ($request->items as $item) {
                $includesIva  = !empty($item['includes_iva']);
                $baseSubtotal = $item['quantity'] * $item['unit_price'];
                $subtotalItem = $includesIva ? $baseSubtotal : $baseSubtotal * 1.21;
                $subtotalGeneral += $subtotalItem;

                ServiceOrderItem::create([
                    'service_order_id' => $order->id,
                    'product_id'       => $item['product_id'] ?? null,
                    'description'      => $item['description'],
                    'quantity'         => $item['quantity'],
                    'unit_price'       => $item['unit_price'],
                    'subtotal'         => $subtotalItem,
                    'includes_iva'     => $includesIva,
                ]);

                if (!empty($item['product_id'])) {
                    $product = Product::find($item['product_id']);
                    if ($product && $product->type === 'product') {
                        $product->decrement('stock_official', $item['quantity']);
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

    public function update(Request $request, ServiceOrder $serviceOrder)
    {
        $validated = $request->validate([
            'status'            => 'sometimes|in:pending,in_progress,completed,delivered,cancelled',
            'technician_id'     => 'nullable|exists:users,id',
            'mileage'           => 'nullable|integer',
            'notes'             => 'nullable|string',
            'discount'          => 'nullable|numeric|min:0',
            'insurance_company'  => 'nullable|string',
            'insurer_id'         => 'nullable|exists:customers,id',
            'insurance_due_date' => 'nullable|date',
            'policy_number'      => 'nullable|string',
            'claim_number'       => 'nullable|string',
            'invoice_number'    => 'nullable|string',
            'invoice_date'      => 'nullable|date',
        ]);

        $oldStatus = $serviceOrder->status;
        $serviceOrder->update($validated);

        if (isset($validated['discount'])) {
            $serviceOrder->update(['total' => $serviceOrder->subtotal - $serviceOrder->discount]);
        }

        // Sincronizar CC cuando la orden pasa a completada/entregada
        $newStatus = $validated['status'] ?? null;
        if ($newStatus && $newStatus !== $oldStatus
            && in_array($newStatus, ['completed', 'delivered'])
            && $serviceOrder->customer_id
        ) {
            $serviceOrder->refresh();
            $this->ccService->onServiceOrderCompleted($serviceOrder);
        }

        // Si se cancela y tenía un debe en CC, revertirlo
        if ($newStatus === 'cancelled' && $serviceOrder->customer_id) {
            $this->ccService->onServiceOrderCancelled($serviceOrder);
        }

        return response()->json([
            'message' => 'Orden actualizada',
            'order'   => $serviceOrder->load('items'),
        ]);
    }

    public function destroy(ServiceOrder $serviceOrder)
    {
        if (in_array($serviceOrder->status, ['completed', 'delivered'])) {
            return response()->json(['error' => 'No se puede eliminar una orden completada o entregada.'], 409);
        }

        // Revertir stock descontado
        foreach ($serviceOrder->items as $item) {
            if ($item->product_id && $item->product?->type === 'product') {
                $item->product->increment('stock_official', $item->quantity);
            }
        }

        if ($serviceOrder->customer_id) {
            $this->ccService->onServiceOrderCancelled($serviceOrder);
        }

        $serviceOrder->items()->delete();
        $serviceOrder->delete();

        return response()->json(['message' => 'Orden eliminada']);
    }
}