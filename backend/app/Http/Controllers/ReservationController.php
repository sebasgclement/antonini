<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;   // 👈 Fundamental para evitar duplicados
use Illuminate\Support\Facades\Log;  // 👈 Para registrar errores sin romper
use App\Events\ReservaCreada;        // 👈 El evento liviano

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

    // ================= GUARDAR NUEVA RESERVA (BLINDADO) =================
    public function store(Request $request)
    {
        // 1. Validamos AFUERA de la transacción (fail fast)
        $data = $request->validate([
            'vehicle_id'      => 'required|exists:vehicles,id',
            'customer_id'     => 'required|exists:customers,id',
            'used_vehicle_id' => 'nullable|exists:vehicles,id',
            'price'           => 'required|numeric|min:0',
            'deposit'         => 'nullable|numeric|min:0',
            'credit_bank'     => 'nullable|numeric|min:0',
            'balance'         => 'nullable|numeric',
            'payment_methods'             => 'nullable|array',
            'payment_methods.*.method_id' => 'required_with:payment_methods|exists:payment_methods,id',
            'payment_methods.*.amount'    => 'required_with:payment_methods|numeric|min:1',
            'payment_methods.*.details'   => 'nullable',
            'payment_details'   => 'nullable|string|max:255',
            'workshop_expenses' => 'nullable|numeric|min:0',
            'comments'          => 'nullable|string|max:1000',
            'status'            => 'nullable|string|max:50',
            'date'              => 'nullable|date',
            'transfer_cost'       => 'nullable|numeric|min:0',
            'administrative_cost' => 'nullable|numeric|min:0',
            'currency'            => 'nullable|string|in:ARS,USD',
            'exchange_rate'       => 'nullable|numeric|min:0',
            'second_buyer_name'   => 'nullable|string|max:255',
            'second_buyer_dni'    => 'nullable|string|max:50',
            'second_buyer_phone'  => 'nullable|string|max:50',
            'used_vehicle_checklist' => 'nullable|array',
        ]);

        // 2. Usamos TRANSACTIONS para atomicidad
        return DB::transaction(function () use ($data, $request) {
            
            $paymentMethodsPayload = $request->payment_methods;
            unset($data['payment_methods']);

            $data['deposit'] = is_array($paymentMethodsPayload)
                ? collect($paymentMethodsPayload)->sum('amount')
                : ($data['deposit'] ?? 0);

            $data['payment_method'] = $paymentMethodsPayload ? 'Varios' : ($request->payment_method ?? null);
            $data['seller_id'] = Auth::id() ?? $request->seller_id ?? 1;
            $data['status']    = $data['status'] ?? 'pendiente';
            $data['date']      = $data['date'] ?? now();

            // A. Crear la reserva
            $reservation = Reservation::create($data);

            // B. Crear los pagos
            if (is_array($paymentMethodsPayload)) {
                foreach ($paymentMethodsPayload as $pm) {
                    if (empty($pm['method_id']) || empty($pm['amount'])) continue;
                    $details = $pm['details'] ?? null;
                    $reservation->payments()->create([
                        'payment_method_id' => $pm['method_id'],
                        'amount'            => $pm['amount'],
                        'details'           => is_array($details) ? $details : ($details ? ['raw' => $details] : null),
                    ]);
                }
            }

            // 🔥 C. INTENTO DE NOTIFICACIÓN (SEGURA)
            // Si esto falla, la reserva YA ESTÁ guardada y no queremos revertirla.
            // Por eso usamos try/catch dentro del flujo exitoso.
            // 🔥 3. DISPARAR EVENTO (MODO DEBUG)
        
            // 🔥 3. DISPARAR EVENTO (CON RED DE SEGURIDAD)
            try {
                broadcast(new ReservaCreada($reservation));
            } catch (\Throwable $e) {
                // Si Reverb falla, solo lo anotamos en el log.
                // NO detenemos la reserva.
                Log::error("⚠️ Error enviando notificación Reverb: " . $e->getMessage());
            }
                    // D. Retornar respuesta exitosa
            return response()->json([
                'message' => 'Reserva registrada correctamente ✅',
                'data' => [
                    ...$reservation->load([
                        'vehicle', 'usedVehicle', 'customer', 'seller', 'payments.method',
                    ])->toArray(),
                    'profit' => $reservation->profit,
                ]
            ], 201);
        });
    }

    // ================= MOSTRAR UNA RESERVA =================
    public function show(Reservation $reservation)
    {
        $reservation->load(['vehicle', 'usedVehicle', 'customer', 'seller', 'payments.method']);
        
        $price   = (float) ($reservation->price ?? 0);
        $deposit = (float) ($reservation->deposit ?? 0);
        $credit  = (float) ($reservation->credit_bank ?? 0);
        $trade   = (float) ($reservation->usedVehicle?->price ?? 0);
        $balance = $price - $deposit - $credit - $trade;

        $formatted = [
            'price_fmt'       => '$ ' . number_format($price, 2, ',', '.'),
            'deposit_fmt'     => '$ ' . number_format($deposit, 2, ',', '.'),
            'credit_bank_fmt' => '$ ' . number_format($credit, 2, ',', '.'),
            'trade_in_fmt'    => '$ ' . number_format($trade, 2, ',', '.'),
            'balance_fmt'     => '$ ' . number_format($balance, 2, ',', '.'),
            'profit_fmt'      => '$ ' . number_format($reservation->profit, 2, ',', '.'),
        ];

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
        $data = $request->validate([
            'vehicle_id'      => 'sometimes|exists:vehicles,id',
            'customer_id'     => 'sometimes|exists:customers,id',
            'used_vehicle_id' => 'nullable|exists:vehicles,id',
            'price'           => 'sometimes|numeric|min:0',
            'deposit'         => 'nullable|numeric|min:0',
            'credit_bank'     => 'nullable|numeric|min:0',
            'balance'         => 'nullable|numeric',
            'payment_methods'             => 'nullable|array',
            'payment_methods.*.method_id' => 'required_with:payment_methods|exists:payment_methods,id',
            'payment_methods.*.amount'    => 'required_with:payment_methods|numeric|min:1',
            'payment_methods.*.details'   => 'nullable',
            'payment_details'   => 'nullable|string|max:255',
            'workshop_expenses' => 'nullable|numeric|min:0',
            'comments'          => 'nullable|string|max:1000',
            'status'            => 'nullable|string|max:50',
            'date'              => 'nullable|date',
            'transfer_cost'       => 'nullable|numeric|min:0',
            'administrative_cost' => 'nullable|numeric|min:0',
            'currency'            => 'nullable|string|in:ARS,USD',
            'exchange_rate'       => 'nullable|numeric|min:0',
            'second_buyer_name'   => 'nullable|string|max:255',
            'second_buyer_dni'    => 'nullable|string|max:50',
            'second_buyer_phone'  => 'nullable|string|max:50',
            'used_vehicle_checklist' => 'nullable|array',
        ]);

        $paymentMethodsPayload = $request->payment_methods;
        unset($data['payment_methods']);

        if (isset($data['vehicle_id'])) {
            $vehicle = Vehicle::find($data['vehicle_id']);
            if ($vehicle && $vehicle->status === 'vendido') {
                $data['status'] = 'vendido';
            }
        }

        if (empty($reservation->seller_id)) {
            $data['seller_id'] = Auth::id() ?? $request->seller_id ?? 1;
        }

        if (is_array($paymentMethodsPayload)) {
            $data['deposit']        = collect($paymentMethodsPayload)->sum('amount');
            $data['payment_method'] = 'Varios';
        }

        $reservation->update($data);

        if (is_array($paymentMethodsPayload)) {
            $reservation->payments()->delete();
            foreach ($paymentMethodsPayload as $pm) {
                if (empty($pm['method_id']) || empty($pm['amount'])) continue;
                $details = $pm['details'] ?? null;
                $reservation->payments()->create([
                    'payment_method_id' => $pm['method_id'],
                    'amount'            => $pm['amount'],
                    'details'           => is_array($details) ? $details : ($details ? ['raw' => $details] : null),
                ]);
            }
        }

        return response()->json([
            'message' => 'Reserva actualizada correctamente ✅',
            'data' => [
                ...$reservation->load([
                    'vehicle', 'usedVehicle', 'customer', 'seller', 'payments.method',
                ])->toArray(),
                'profit' => $reservation->profit,
            ]
        ]);
    }

    // ================= ELIMINAR RESERVA (CANCELAR) =================
    public function destroy(Reservation $reservation)
    {
        // Usamos transaction acá también por seguridad
        DB::transaction(function() use ($reservation) {
            $vehicle = $reservation->vehicle;

            // 1. Eliminar pagos
            $reservation->payments()->delete();

            // 2. Eliminar reserva
            $reservation->delete();

            // 3. Liberar vehículo
            if ($vehicle) {
                $vehicle->update(['status' => 'disponible']);
            }
        });

        return response()->json([
            'message' => 'Reserva cancelada y vehículo liberado ✅',
        ]);
    }
}