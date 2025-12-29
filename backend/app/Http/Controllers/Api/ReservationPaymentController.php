<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReservationPayment;
use Illuminate\Http\Request;

class ReservationPaymentController extends Controller
{
    /**
     * Listar pagos (opcionalmente filtrados por reserva)
     * GET /api/reservation-payments?reservation_id=123
     */
    public function index(Request $request)
    {
        $query = ReservationPayment::with(['reservation', 'method']);

        if ($request->filled('reservation_id')) {
            $query->where('reservation_id', $request->reservation_id);
        }

        $payments = $query
            ->orderByDesc('id')
            ->get();

        return response()->json($payments);
    }

    /**
     * Registrar un nuevo pago
     * POST /api/reservation-payments
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'reservation_id'    => 'required|exists:reservations,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'amount'            => 'required|numeric|min:0.01',
            'details'           => 'nullable|array',
        ]);

        $payment = ReservationPayment::create($data);

        // 👇 Acá ya se dispara el booted() del modelo ReservationPayment
        //     que recalcula depósito, saldo y puede confirmar la reserva

        return response()->json([
            'message' => 'Pago registrado correctamente',
            'payment' => $payment->load(['reservation', 'method']),
        ], 201);
    }

    /**
     * Actualizar un pago (por si más adelante lo necesitás)
     * PUT /api/reservation-payments/{payment}
     */
    public function update(Request $request, ReservationPayment $payment)
    {
        $data = $request->validate([
            'payment_method_id' => 'sometimes|required|exists:payment_methods,id',
            'amount'            => 'sometimes|required|numeric|min:0.01',
            'details'           => 'nullable|array',
        ]);

        $payment->update($data);

        return response()->json([
            'message' => 'Pago actualizado correctamente',
            'payment' => $payment->load(['reservation', 'method']),
        ]);
    }

    /**
     * Eliminar un pago
     * DELETE /api/reservation-payments/{payment}
     */
    public function destroy(ReservationPayment $payment)
    {
        $payment->delete();

        return response()->json([
            'message' => 'Pago eliminado correctamente',
        ]);
    }
}
