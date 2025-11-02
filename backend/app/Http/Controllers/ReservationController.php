<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReservationController extends Controller
{
    // ================= LISTAR TODAS LAS RESERVAS =================
    public function index()
    {
        $reservations = Reservation::with(['vehicle', 'usedVehicle', 'customer', 'seller'])
            ->orderByDesc('created_at')
            ->get();

        // Agregar ganancia calculada
        $reservations->each(function ($r) {
            $r->profit = $r->profit;
        });

        return response()->json(['data' => $reservations]);
    }

    // ================= FORMULARIO DE CREACIÓN (datos iniciales) =================
    public function create()
    {
        $vehicles = Vehicle::where('status', 'disponible')->get(['id', 'brand', 'model', 'plate', 'price']);
        $customers = Customer::orderBy('last_name')->get(['id', 'first_name', 'last_name']);

        return response()->json([
            'vehicles' => $vehicles,
            'customers' => $customers,
        ]);
    }

    // ================= GUARDAR NUEVA RESERVA =================
    public function store(Request $request)
    {
        $data = $request->validate([
            'vehicle_id'          => 'required|exists:vehicles,id',
            'customer_id'         => 'required|exists:customers,id',
            'used_vehicle_id'     => 'nullable|exists:vehicles,id',
            'price'               => 'required|numeric|min:0',
            'deposit'             => 'nullable|numeric|min:0',
            'credit_bank'         => 'nullable|numeric|min:0',
            'balance'             => 'nullable|numeric',
            // 🔹 ahora se acepta un array de métodos de pago
            'payment_methods'             => 'nullable|array',
            'payment_methods.*.method_id' => 'required_with:payment_methods|exists:payment_methods,id',
            'payment_methods.*.amount'    => 'required_with:payment_methods|numeric|min:1',
            'payment_details'     => 'nullable|string|max:255',
            'workshop_expenses'   => 'nullable|numeric|min:0',
            'comments'            => 'nullable|string|max:1000',
            'status'              => 'nullable|string|max:50',
            'date'                => 'nullable|date',
        ]);

        // 🔸 Calcular automáticamente el depósito total si vienen métodos de pago
        $data['deposit'] = is_array($request->payment_methods)
            ? collect($request->payment_methods)->sum('amount')
            : ($data['deposit'] ?? 0);

        // 🔸 Registrar un nombre genérico si hay múltiples métodos
        $data['payment_method'] = $request->payment_methods
            ? 'Varios'
            : ($request->payment_method ?? null);

        $data['seller_id'] = Auth::id() ?? $request->seller_id ?? 1;
        $data['status'] = $data['status'] ?? 'pendiente';
        $data['date'] = $data['date'] ?? now();

        $reservation = Reservation::create($data);

        // 🔹 (opcional futuro) acá podrías guardar los pagos individuales si tuvieras una tabla `reservation_payments`

        return response()->json([
            'message' => 'Reserva registrada correctamente ✅',
            'data' => [
                ...$reservation->load(['vehicle', 'usedVehicle', 'customer', 'seller'])->toArray(),
                'profit' => $reservation->profit,
            ]
        ], 201);
    }

    // ================= MOSTRAR UNA RESERVA =================
    public function show(Reservation $reservation)
    {
        $reservation->load(['vehicle', 'usedVehicle', 'customer', 'seller']);
        $reservation->profit = $reservation->profit;

        // 🧮 Calcular saldo si no está almacenado o está desactualizado
        $price   = (float) ($reservation->price ?? 0);
        $deposit = (float) ($reservation->deposit ?? 0);
        $credit  = (float) ($reservation->credit_bank ?? 0);
        $trade   = (float) ($reservation->usedVehicle?->price ?? 0);
        $balance = $price - $deposit - $credit - $trade;

        // 🪄 Formatear valores monetarios
        $formatted = [
            'price_fmt'        => '$ ' . number_format($price, 2, ',', '.'),
            'deposit_fmt'      => '$ ' . number_format($deposit, 2, ',', '.'),
            'credit_bank_fmt'  => '$ ' . number_format($credit, 2, ',', '.'),
            'trade_in_fmt'     => '$ ' . number_format($trade, 2, ',', '.'),
            'balance_fmt'      => '$ ' . number_format($balance, 2, ',', '.'),
            'profit_fmt'       => '$ ' . number_format($reservation->profit, 2, ',', '.'),
        ];

        // 💾 Actualizar saldo guardado si cambió
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
            'vehicle_id'        => 'sometimes|exists:vehicles,id',
            'customer_id'       => 'sometimes|exists:customers,id',
            'used_vehicle_id'   => 'nullable|exists:vehicles,id',
            'price'             => 'sometimes|numeric|min:0',
            'deposit'           => 'nullable|numeric|min:0',
            'credit_bank'       => 'nullable|numeric|min:0',
            'balance'           => 'nullable|numeric',
            'payment_methods'             => 'nullable|array',
            'payment_methods.*.method_id' => 'required_with:payment_methods|exists:payment_methods,id',
            'payment_methods.*.amount'    => 'required_with:payment_methods|numeric|min:1',
            'payment_details'   => 'nullable|string|max:255',
            'workshop_expenses' => 'nullable|numeric|min:0',
            'comments'          => 'nullable|string|max:1000',
            'status'            => 'nullable|string|max:50',
            'date'              => 'nullable|date',
        ]);

        // 🚗 Actualizar estado si el vehículo fue vendido
        if (isset($data['vehicle_id'])) {
            $vehicle = Vehicle::find($data['vehicle_id']);
            if ($vehicle && $vehicle->status === 'vendido') {
                $data['status'] = 'vendido';
            }
        }

        // 👤 Asignar vendedor si no tiene
        if (empty($reservation->seller_id)) {
            $data['seller_id'] = Auth::id() ?? $request->seller_id ?? 1;
        }

        // 🔸 Recalcular depósito si cambian los métodos
        if (isset($data['payment_methods']) && is_array($data['payment_methods'])) {
            $data['deposit'] = collect($data['payment_methods'])->sum('amount');
            $data['payment_method'] = 'Varios';
        }

        $reservation->update($data);

        return response()->json([
            'message' => 'Reserva actualizada correctamente ✅',
            'data' => [
                ...$reservation->load(['vehicle', 'usedVehicle', 'customer', 'seller'])->toArray(),
                'profit' => $reservation->profit,
            ]
        ]);
    }

    // ================= ELIMINAR RESERVA =================
    public function destroy(Reservation $reservation)
    {
        $vehicle = $reservation->vehicle;

        $reservation->delete();

        if ($vehicle && $vehicle->status === 'reservado') {
            $vehicle->update(['status' => 'disponible']);
        }

        return response()->json([
            'message' => 'Reserva eliminada correctamente ✅',
        ]);
    }
}
