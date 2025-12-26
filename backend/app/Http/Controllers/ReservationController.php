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

    // ================= GUARDAR NUEVA RESERVA (Lógica Financiera Corregida) =================
    public function store(Request $request)
    {
        // 1. Validaciones
        $data = $request->validate([
            'vehicle_id'      => 'required|exists:vehicles,id',
            'customer_id'     => 'required|exists:customers,id',
            'price'           => 'required|numeric|min:0',
            'deposit'         => 'nullable|numeric|min:0', // <--- AGREGADO: Importante validar esto
            
            // Validaciones de Permuta
            'used_vehicle_id'        => 'nullable|exists:vehicles,id|different:vehicle_id',
            'used_vehicle_price'     => 'nullable|numeric|min:0',
            'used_vehicle_checklist' => 'nullable|string', 
            
            // Validaciones de Partners
            'partners'              => 'nullable|array',
            'partners.*.full_name'  => 'required_with:partners|string',
            'partners.*.dni'        => 'nullable|string',
            'partners.*.phone'      => 'nullable|string',
            'partners.*.photo'      => 'nullable|image|max:5120', 
        ]);

        // 2. Validación lógica del 08 (Permuta)
        if (!empty($data['used_vehicle_id'])) {
            $checklist = json_decode($request->used_vehicle_checklist, true);
            if (empty($checklist['08']) || $checklist['08'] !== true) {
                 return response()->json([
                    'message' => 'No se puede tomar el usado sin el 08 firmado.',
                    'errors' => ['used_vehicle_checklist' => ['El 08 es obligatorio para la toma.']]
                 ], 422);
            }
        }

        try {
            return DB::transaction(function () use ($data, $request) {
                
                // --- A. Limpieza de datos auxiliares ---
                $paymentMethodsPayload = $request->payment_methods;
                if(isset($data['payment_methods'])) unset($data['payment_methods']);
                
                $partnersData = $request->partners ?? [];
                unset($data['partners']); 

                // --- B. Asignar Vendedor ---
                $data['seller_id'] = Auth::id(); 

                // --- C. CÁLCULO FINANCIERO OBLIGATORIO (Backend) ---
                // No confiamos en lo que mande el front en 'balance'. Lo calculamos acá.
                $price = floatval($data['price']);
                $deposit = floatval($data['deposit'] ?? 0);
                $tradeIn = floatval($data['used_vehicle_price'] ?? 0);

                // Fórmula: Precio - Seña - ValorPermuta
                $calculatedBalance = $price - $deposit - $tradeIn;
                
                // Guardamos el saldo calculado
                $data['balance'] = $calculatedBalance;

                // Definimos estado inicial basado en la deuda
                if ($calculatedBalance > 0) {
                    $data['status'] = 'pendiente';
                } else {
                    // Si pagó todo de una (raro en reserva, pero posible)
                    $data['status'] = 'confirmada'; 
                }

                // --- D. Crear la Reserva ---
                $reservation = Reservation::create($data);

                // --- E. Guardar Métodos de Pago y Socios ---
                // Aquí iría tu lógica de payment_methods si la tenés separada
                // ...
                
                if (!empty($partnersData)) {
                    // Aquí iría tu lógica de creación de socios
                    $reservation->partners()->createMany($partnersData);
                }

                // Si hay vehículo, cambiar estado a 'reservado'
                if ($reservation->vehicle) {
                    $reservation->vehicle->update(['status' => 'reservado']);
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
        $trade   = (float) ($reservation->used_vehicle_price ?? 0);
        
        // Sumamos pagos históricos registrados en la tabla payments
        $paymentsTotal = $reservation->payments->sum('amount');
        
        // El total pagado es la Seña inicial (deposit) O la suma de pagos si es mayor
        // (A veces el depósito se registra como un pago más)
        $totalPaid = max($deposit, $paymentsTotal);
        
        if(isset($reservation->paid_amount) && $reservation->paid_amount > 0) {
             $totalPaid = $reservation->paid_amount;
        }

        $balance = $price - $totalPaid - $credit - $trade;

        // Auto-corrección silenciosa (Excelente práctica que ya tenías)
        if (empty($reservation->balance) || abs($reservation->balance - $balance) > 100) {
            $reservation->updateQuietly(['balance' => $balance]);
        }

        return response()->json([
            'data' => [
                ...$reservation->toArray(),
                'balance' => $balance, // Enviamos el calculado al momento
            ],
        ]);
    }

    // ================= ACTUALIZAR RESERVA =================
    public function update(Request $request, Reservation $reservation)
    {
        $data = $request->validate([
            'vehicle_id'      => 'sometimes|exists:vehicles,id',
            'customer_id'     => 'sometimes|exists:customers,id',
            'price'           => 'sometimes|numeric|min:0',
            'deposit'         => 'nullable|numeric|min:0',
            'status'          => 'nullable|string',
            'used_vehicle_id'        => 'nullable|exists:vehicles,id',
            'used_vehicle_price'     => 'nullable|numeric|min:0',
            'used_vehicle_checklist' => 'nullable|string',
        ]);

        // 1. Validar conflicto de vehículos
        $finalVehicleId = $request->has('vehicle_id') ? $request->vehicle_id : $reservation->vehicle_id;
        $finalUsedId    = $request->has('used_vehicle_id') ? $request->used_vehicle_id : $reservation->used_vehicle_id;

        if ($finalUsedId && $finalUsedId == $finalVehicleId) {
            return response()->json([
                'message' => 'Conflicto de vehículos.',
                'errors'  => ['used_vehicle_id' => ['No podés entregar el mismo vehículo que comprás.']]
            ], 422);
        }

        // 2. Validar checklist 08 si cambia
        if ($request->has('used_vehicle_checklist') && $finalUsedId) {
            $checklist = json_decode($request->used_vehicle_checklist, true);
            if (empty($checklist['08']) || $checklist['08'] !== true) {
                 return response()->json([
                    'message' => 'Falta el 08 firmado.',
                    'errors' => ['used_vehicle_checklist' => ['El 08 es obligatorio.']]
                 ], 422);
            }
        }

        try {
            // --- CÁLCULO DE REAJUSTE DE SALDO ---
            // Si cambian precio, seña o permuta, recalcular saldo
            if ($request->has('price') || $request->has('deposit') || $request->has('used_vehicle_price')) {
                $newPrice = $request->has('price') ? floatval($data['price']) : $reservation->price;
                $newDeposit = $request->has('deposit') ? floatval($data['deposit']) : $reservation->deposit;
                $newTrade = $request->has('used_vehicle_price') ? floatval($data['used_vehicle_price']) : $reservation->used_vehicle_price;

                $data['balance'] = $newPrice - $newDeposit - $newTrade;
            }

            $reservation->update($data);

            return response()->json([
                'message' => 'Reserva actualizada correctamente ✅',
                'data' => $reservation
            ]);

        } catch (\Exception $e) {
            Log::error("Error update reserva: " . $e->getMessage());
            return response()->json(['message' => 'Error al actualizar', 'error' => $e->getMessage()], 500);
        }
    }

    // ================= ELIMINAR RESERVA =================
    public function destroy(Reservation $reservation)
    {
        return DB::transaction(function() use ($reservation) {
            $vehicle = $reservation->vehicle;
            
            $reservation->payments()->delete();
            $reservation->partners()->delete(); 
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
            
            // Forzar saldo a 0 al anular para que no figure deuda
            $reservation->balance = 0;
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