<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Events\ReservaCreada;

class ReservationController extends Controller
{
    // ================= LISTAR TODAS LAS RESERVAS =================
    public function index()
    {
        $reservations = Reservation::with([
                'vehicle', 'usedVehicle', 'customer', 'seller', 'payments.method',
            ])
            ->orderByDesc('created_at')
            ->get();

        // Si tenés un accessor 'profit', se calcula acá
        $reservations->each(function ($r) {
            $r->profit = $r->profit;
        });

        return response()->json(['data' => $reservations]);
    }

    // ================= FORMULARIO DE CREACIÓN =================
    public function create()
    {
        $vehicles = Vehicle::where('status', 'disponible')
            ->get(['id', 'brand', 'model', 'plate', 'price']);

        $customers = Customer::orderBy('last_name')
            ->get(['id', 'first_name', 'last_name']);

        $paymentMethods = PaymentMethod::orderBy('name')->get();

        return response()->json([
            'vehicles'      => $vehicles,
            'customers'     => $customers,
            'payment_methods' => $paymentMethods,
        ]);
    }

    // ================= GUARDAR NUEVA RESERVA =================
    public function store(Request $request)
    {
        // 1. Validaciones
        $data = $request->validate([
            'vehicle_id'      => 'required|exists:vehicles,id',
            'customer_id'     => 'required|exists:customers,id',
            'price'           => 'required|numeric|min:0',
            
            // 🔥 CORRECCIÓN 1: 'different:vehicle_id' evita que entregue el mismo auto
            'used_vehicle_id'        => 'nullable|exists:vehicles,id|different:vehicle_id',
            'used_vehicle_price'     => 'nullable|numeric|min:0',
            'used_vehicle_checklist' => 'nullable|string', // Viene como JSON String
            
            // ... validaciones de partners ...
            'partners'              => 'nullable|array',
            'partners.*.full_name'  => 'required_with:partners|string',
            'partners.*.dni'        => 'nullable|string',
            'partners.*.phone'      => 'nullable|string',
            'partners.*.photo'      => 'nullable|image|max:5120', 
        ]);

        // =======================================================
        // 🔥 CORRECCIÓN 2: VALIDAR QUE EL 08 ESTÉ MARCADO
        // =======================================================
        if (!empty($data['used_vehicle_id'])) {
            // Decodificamos el JSON que viene del front (ej: '{"08":false, "titulo":true...}')
            $checklist = json_decode($request->used_vehicle_checklist, true);
            
            // Verificamos si existe la key "08" y si es true
            // Si el checkbox en el front se llama '08' o 'cero_ocho', ajustalo acá
            if (empty($checklist['08']) || $checklist['08'] !== true) {
                 return response()->json([
                    'message' => 'No se puede tomar el usado sin el 08 firmado.',
                    'errors' => ['used_vehicle_checklist' => ['El 08 es obligatorio para la toma.']]
                 ], 422);
            }
        }

        try {
            return DB::transaction(function () use ($data, $request) {
                
                // ... (Logica de limpiar datos extra) ...
                $paymentMethodsPayload = $request->payment_methods;
                if(isset($data['payment_methods'])) unset($data['payment_methods']);
                
                $partnersData = $request->partners ?? [];
                unset($data['partners']); 

                // Asignar vendedor
                $data['seller_id'] = Auth::id(); 

                // Crear Reserva
                $reservation = Reservation::create($data);

                // ... (El resto de tu lógica de pagos y socios sigue igual) ...
                if (is_array($paymentMethodsPayload)) {
                    // lógica de pagos...
                }
                
                if (!empty($partnersData)) {
                    // lógica de socios...
                }

                return response()->json([
                    'message' => 'Reserva registrada correctamente ✅',
                    'data' => [
                        ...$reservation->load(['vehicle', 'customer', 'seller', 'payments.method', 'partners'])->toArray(),
                    ]
                ], 201);
            });

        } catch (\Exception $e) {
            Log::error("Error al crear reserva: " . $e->getMessage());
            return response()->json([
                'message' => 'Ocurrió un error al guardar la reserva.',
                'error_detail' => $e->getMessage()
            ], 500);
        }
    }

    // ================= MOSTRAR UNA RESERVA =================
    public function show(Reservation $reservation)
    {
        $reservation->load(['vehicle', 'usedVehicle', 'customer', 'seller', 'payments.method', 'partners']);
        
        $price   = (float) ($reservation->price ?? 0);
        $deposit = (float) ($reservation->deposit ?? 0);
        $credit  = (float) ($reservation->credit_bank ?? 0);
        
        // 🔥 CORRECCIÓN AQUÍ: Usamos el precio guardado en la reserva, no el del vehículo
        $trade   = (float) ($reservation->used_vehicle_price ?? 0);
        
        $paymentsTotal = $reservation->payments->sum('amount');
        $totalPaid = max($deposit, $paymentsTotal);
        
        if(isset($reservation->paid_amount) && $reservation->paid_amount > 0) {
             $totalPaid = $reservation->paid_amount;
        }

        $balance = $price - $totalPaid - $credit - $trade;

        $formatted = [
            'price_fmt'       => '$ ' . number_format($price, 2, ',', '.'),
            'deposit_fmt'     => '$ ' . number_format($deposit, 2, ',', '.'),
            'credit_bank_fmt' => '$ ' . number_format($credit, 2, ',', '.'),
            'trade_in_fmt'    => '$ ' . number_format($trade, 2, ',', '.'),
            'balance_fmt'     => '$ ' . number_format($balance, 2, ',', '.'),
            'profit_fmt'      => '$ ' . number_format($reservation->profit, 2, ',', '.'),
        ];

        // Actualizar saldo si difiere
        if (empty($reservation->balance) || abs($reservation->balance - $balance) > 0.01) {
            $reservation->updateQuietly(['balance' => $balance]);
        }

        return response()->json([
            'data' => [
                ...$reservation->toArray(),
                ...$formatted,
                'balance' => $balance,
            ],
        ]);
    }

    // ================= ACTUALIZAR RESERVA =================
    public function update(Request $request, Reservation $reservation)
    {
        // 1. Validaciones básicas de tipos de datos
        $data = $request->validate([
            'vehicle_id'      => 'sometimes|exists:vehicles,id',
            'customer_id'     => 'sometimes|exists:customers,id',
            'price'           => 'sometimes|numeric|min:0',
            'deposit'         => 'nullable|numeric|min:0',
            'status'          => 'nullable|string',
            
            // Toma de usados
            'used_vehicle_id'        => 'nullable|exists:vehicles,id',
            'used_vehicle_price'     => 'nullable|numeric|min:0',
            'used_vehicle_checklist' => 'nullable|string',
        ]);

        // =======================================================
        // 🔥 CORRECCIÓN 1: VALIDAR AUTO-PERMUTA (Lógica Manual)
        // =======================================================
        // Como es un update parcial, tenemos que ver si el dato viene en el request
        // o si usamos el que ya está guardado en la base de datos.
        
        $finalVehicleId = $request->has('vehicle_id') ? $request->vehicle_id : $reservation->vehicle_id;
        $finalUsedId    = $request->has('used_vehicle_id') ? $request->used_vehicle_id : $reservation->used_vehicle_id;

        // Si hay un usado definido y es igual al vehículo que se lleva... ERROR.
        if ($finalUsedId && $finalUsedId == $finalVehicleId) {
            return response()->json([
                'message' => 'Conflicto de vehículos.',
                'errors'  => ['used_vehicle_id' => ['No podés entregar como parte de pago el mismo vehículo que estás comprando.']]
            ], 422);
        }

        // =======================================================
        // 🔥 CORRECCIÓN 2: VALIDAR QUE EL 08 ESTÉ MARCADO
        // =======================================================
        // Solo validamos si están enviando un checklist nuevo y hay un auto usado involucrado
        if ($request->has('used_vehicle_checklist') && $finalUsedId) {
            
            $checklist = json_decode($request->used_vehicle_checklist, true);
            
            if (empty($checklist['08']) || $checklist['08'] !== true) {
                 return response()->json([
                    'message' => 'No se puede actualizar la toma sin el 08 firmado.',
                    'errors' => ['used_vehicle_checklist' => ['El 08 es obligatorio para la toma.']]
                 ], 422);
            }
        }

        // 3. Try-Catch para guardar
        try {
            $reservation->update($data);

            return response()->json([
                'message' => 'Reserva actualizada correctamente ✅',
                'data' => $reservation
            ]);

        } catch (\Exception $e) {
            Log::error("Error al actualizar reserva ID {$reservation->id}: " . $e->getMessage());
            
            return response()->json([
                'message' => 'Ocurrió un error al actualizar la reserva.',
                'error_detail' => $e->getMessage()
            ], 500);
        }
    }

    // ================= ELIMINAR RESERVA =================
    public function destroy(Reservation $reservation)
    {
        return DB::transaction(function() use ($reservation) {
            $vehicle = $reservation->vehicle;
            
            $reservation->payments()->delete();
            $reservation->partners()->delete(); // Limpiamos socios también
            $reservation->delete();

            if ($vehicle) {
                $vehicle->update(['status' => 'disponible']);
            }

            return response()->json(['message' => 'Reserva eliminada y vehículo liberado ✅']);
        });
    }

    // ================= CANCELAR / ANULAR =================
    public function cancel(Request $request, $id)
    {
        $reservation = Reservation::findOrFail($id);
        $refund = $request->input('refund', false); 

        return DB::transaction(function() use ($reservation, $refund) {
            
            if ($refund) {
                $reservation->payments()->delete(); 
                $reservation->deposit = 0;
            } 
            
            $reservation->status = 'anulada';
            $reservation->save();

            if ($reservation->vehicle) {
                $reservation->vehicle->status = 'disponible';
                $reservation->vehicle->save();
            }

            return response()->json(['message' => 'Reserva anulada correctamente']);
        });
    }

}