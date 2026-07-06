<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\ReservationPayment;
use App\Services\CurrentAccountService;
use App\Services\VehicleStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReservationPaymentController extends Controller
{
    public function __construct(
        private CurrentAccountService $ccService,
        private VehicleStatusService $statusService,
    ) {}
    public function index(Request $request)
    {
        $query = ReservationPayment::with(['reservation', 'method']);

        if ($request->filled('reservation_id')) {
            $query->where('reservation_id', $request->reservation_id);
        }

        $payments = $query->orderByDesc('id')->get()
            ->map(fn ($p) => $this->withReceiptUrl($p));

        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'reservation_id'    => 'required|exists:reservations,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'amount'            => 'required|numeric|min:0.01',
            'currency'          => 'nullable|string|in:ARS,USD',
            'exchange_rate'     => 'required_if:currency,USD|nullable|numeric|min:0.01',
            'details'           => 'nullable',
            'receipt'           => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:8192',
        ]);

        // details puede venir como JSON string (cuando se usa FormData)
        if (isset($data['details']) && is_string($data['details'])) {
            $data['details'] = json_decode($data['details'], true) ?? [];
        }

        $currency           = $data['currency'] ?? 'ARS';
        $rate               = max(1, floatval($data['exchange_rate'] ?? 1));
        $data['currency']   = $currency;
        $data['amount_ars'] = $currency === 'USD'
            ? round($data['amount'] * $rate, 2)
            : $data['amount'];

        unset($data['receipt']);
        $payment = ReservationPayment::create($data);

        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts/payments', 'public');
            $payment->updateQuietly(['receipt_path' => $path]);
        }

        $this->syncBalance((int) $data['reservation_id']);

        $payment->load(['method', 'reservation.vehicle']);
        $this->ccService->onReservationPaymentCreated($payment);

        return response()->json([
            'message' => 'Pago registrado correctamente',
            'payment' => $this->withReceiptUrl($payment->load(['reservation', 'method'])),
        ], 201);
    }

    public function update(Request $request, ReservationPayment $reservationPayment)
    {
        $data = $request->validate([
            'payment_method_id' => 'sometimes|required|exists:payment_methods,id',
            'amount'            => 'sometimes|required|numeric|min:0.01',
            'currency'          => 'nullable|string|in:ARS,USD',
            'exchange_rate'     => 'nullable|numeric|min:0.01',
            'details'           => 'nullable',
            'receipt'           => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:8192',
        ]);

        if (isset($data['details']) && is_string($data['details'])) {
            $data['details'] = json_decode($data['details'], true) ?? [];
        }

        if ($request->hasAny(['amount', 'currency', 'exchange_rate'])) {
            $currency           = $data['currency']       ?? $reservationPayment->currency       ?? 'ARS';
            $rate               = max(1, floatval($data['exchange_rate'] ?? $reservationPayment->exchange_rate ?? 1));
            $amount             = floatval($data['amount'] ?? $reservationPayment->amount);
            $data['amount_ars'] = $currency === 'USD' ? round($amount * $rate, 2) : $amount;
        }

        unset($data['receipt']);
        $reservationPayment->update($data);

        if ($request->hasFile('receipt')) {
            if ($reservationPayment->receipt_path) {
                Storage::disk('public')->delete($reservationPayment->receipt_path);
            }
            $path = $request->file('receipt')->store('receipts/payments', 'public');
            $reservationPayment->updateQuietly(['receipt_path' => $path]);
        }

        $this->syncBalance((int) $reservationPayment->reservation_id);

        $reservationPayment->load(['method', 'reservation.vehicle']);
        $this->ccService->onReservationPaymentUpdated($reservationPayment);

        return response()->json([
            'message' => 'Pago actualizado correctamente',
            'payment' => $this->withReceiptUrl($reservationPayment->fresh()->load(['reservation', 'method'])),
        ]);
    }

    public function destroy(ReservationPayment $reservationPayment)
    {
        $reservationId = (int) $reservationPayment->reservation_id;
        $paymentId     = (int) $reservationPayment->id;

        $reservationPayment->loadMissing('reservation');
        $customerId = (int) ($reservationPayment->reservation?->customer_id ?? 0);

        // Limpiar CC antes de borrar el pago
        if ($customerId) {
            $this->ccService->onReservationPaymentDeleted($paymentId, $customerId);
        }

        $reservationPayment->delete();
        $this->syncBalance($reservationId);

        return response()->json(['message' => 'Pago eliminado correctamente']);
    }

    private function withReceiptUrl(ReservationPayment $payment): ReservationPayment
    {
        $payment->receipt_url = $payment->receipt_path
            ? asset('storage/' . $payment->receipt_path)
            : null;
        return $payment;
    }

    private function syncBalance(int $reservationId): void
    {
        $reservation = Reservation::with(['payments', 'vehicle'])->find($reservationId);
        if (!$reservation) return;

        $price    = (float) ($reservation->price ?? 0);
        $priceARS = (float) ($reservation->price_ars ?? $price);
        $transfer = (float) ($reservation->transfer_cost ?? 0);
        $admin    = (float) ($reservation->administrative_cost ?? 0);
        $deposit  = (float) ($reservation->deposit ?? 0);
        $credit   = (float) ($reservation->credit_bank ?? 0);
        $trade    = (float) ($reservation->used_vehicle_price ?? 0);

        $balance = ($priceARS + $transfer + $admin)
                 - $deposit
                 - $reservation->payments->sum('amount_ars')
                 - $credit
                 - $trade;

        $updates = ['balance' => $balance];

        if ($priceARS > 0 && $balance <= 0 && !in_array($reservation->status, ['vendida', 'anulada'])) {
            $updates['status'] = 'vendida';
            if ($reservation->vehicle) {
                $this->statusService->onConfirmed($reservation->vehicle);
            }
        }

        $reservation->updateQuietly($updates);
    }
}
