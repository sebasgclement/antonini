<?php

namespace App\Services;

use App\Models\CurrentAccount;
use App\Models\Reservation;
use App\Models\ReservationPayment;
use App\Models\ServiceOrder;
use Illuminate\Support\Facades\DB;

class CurrentAccountService
{
    public function onReservationCreated(Reservation $reservation): void
    {
        $reservation->loadMissing(['vehicle', 'usedVehicle']);
        $cid = $reservation->customer_id;

        $vehicle = $reservation->vehicle;
        $vLabel  = $vehicle
            ? "{$vehicle->brand} {$vehicle->model} ({$vehicle->plate})"
            : "Reserva #{$reservation->id}";

        $priceARS = (float)($reservation->price_ars ?? $reservation->price ?? 0);
        $transfer = (float)($reservation->transfer_cost ?? 0);
        $admin    = (float)($reservation->administrative_cost ?? 0);
        $total    = $priceARS + $transfer + $admin;

        $this->insert($cid, [
            'reservation_id' => $reservation->id,
            'concept'        => "Venta - $vLabel",
            'debit'          => $total,
            'credit'         => 0,
            'status'         => 'pendiente',
        ]);

        if ((float)($reservation->deposit ?? 0) > 0) {
            $this->insert($cid, [
                'reservation_id' => $reservation->id,
                'concept'        => "Anticipo - $vLabel",
                'debit'          => 0,
                'credit'         => (float)$reservation->deposit,
                'status'         => 'pagado',
                'payment_date'   => now()->toDateString(),
            ]);
        }

        if ((float)($reservation->credit_bank ?? 0) > 0) {
            $this->insert($cid, [
                'reservation_id' => $reservation->id,
                'concept'        => "Crédito banco - $vLabel",
                'debit'          => 0,
                'credit'         => (float)$reservation->credit_bank,
                'status'         => 'pagado',
                'payment_date'   => now()->toDateString(),
            ]);
        }

        if ((float)($reservation->used_vehicle_price ?? 0) > 0) {
            $used    = $reservation->usedVehicle;
            $uLabel  = $used ? "{$used->brand} {$used->model}" : "usado";
            $this->insert($cid, [
                'reservation_id' => $reservation->id,
                'concept'        => "Toma - $uLabel",
                'debit'          => 0,
                'credit'         => (float)$reservation->used_vehicle_price,
                'status'         => 'pagado',
                'payment_date'   => now()->toDateString(),
            ]);
        }

        $this->recalculate($cid);
    }

    public function onReservationCancelled(Reservation $reservation): void
    {
        CurrentAccount::where('reservation_id', $reservation->id)->delete();
        $this->recalculate($reservation->customer_id);
    }

    public function onTradeInUpdated(Reservation $reservation): void
    {
        $reservation->loadMissing('usedVehicle');
        $used    = $reservation->usedVehicle;
        $uLabel  = $used ? "{$used->brand} {$used->model}" : "usado";
        $newAmt  = (float) ($reservation->used_vehicle_price ?? 0);

        $entry = CurrentAccount::where('reservation_id', $reservation->id)
            ->where('concept', 'like', 'Toma -%')
            ->first();

        if ($entry) {
            if ($newAmt > 0) {
                $entry->credit  = $newAmt;
                $entry->concept = "Toma - $uLabel";
                $entry->save();
            } else {
                $entry->delete();
            }
        } elseif ($newAmt > 0) {
            $this->insert($reservation->customer_id, [
                'reservation_id' => $reservation->id,
                'concept'        => "Toma - $uLabel",
                'debit'          => 0,
                'credit'         => $newAmt,
                'status'         => 'pagado',
                'payment_date'   => now()->toDateString(),
            ]);
        }

        $this->recalculate($reservation->customer_id);
    }

    public function onReservationPaymentCreated(ReservationPayment $payment): void
    {
        $payment->loadMissing(['method', 'reservation.vehicle']);
        $reservation = $payment->reservation;
        if (!$reservation) return;

        $vehicle = $reservation->vehicle;
        $vLabel  = $vehicle
            ? "{$vehicle->brand} {$vehicle->model}"
            : "Reserva #{$reservation->id}";
        $method  = $payment->method?->name ?? 'Pago';

        $this->insert($reservation->customer_id, [
            'reservation_id'         => $reservation->id,
            'reservation_payment_id' => $payment->id,
            'concept'                => "$method - $vLabel",
            'debit'                  => 0,
            'credit'                 => (float)($payment->amount_ars ?? $payment->amount),
            'status'                 => 'pagado',
            'payment_date'           => now()->toDateString(),
        ]);

        $this->recalculate($reservation->customer_id);
    }

    public function onReservationPaymentUpdated(ReservationPayment $payment): void
    {
        $payment->loadMissing(['reservation']);
        $reservation = $payment->reservation;
        if (!$reservation) return;

        $entry = CurrentAccount::where('reservation_payment_id', $payment->id)->first();

        if ($entry) {
            $entry->credit = (float)($payment->amount_ars ?? $payment->amount);
            $entry->save();
            $this->recalculate($reservation->customer_id);
        } else {
            $this->onReservationPaymentCreated($payment);
        }
    }

    public function onReservationPaymentDeleted(int $paymentId, int $customerId): void
    {
        CurrentAccount::where('reservation_payment_id', $paymentId)->delete();
        $this->recalculate($customerId);
    }

    public function onServiceOrderCompleted(ServiceOrder $order): void
    {
        // Evitar duplicados si ya tiene un debe
        if (CurrentAccount::where('service_order_id', $order->id)->where('debit', '>', 0)->exists()) {
            return;
        }

        $order->loadMissing('vehicle');
        $vehicle = $order->vehicle;
        $label   = $vehicle
            ? "OT #{$order->id} - {$vehicle->brand} {$vehicle->model} ({$vehicle->plate})"
            : "Orden de Servicio #{$order->id}";

        $this->insert($order->customer_id, [
            'service_order_id' => $order->id,
            'concept'          => $label,
            'debit'            => (float)($order->total ?? 0),
            'credit'           => 0,
            'status'           => 'pendiente',
        ]);

        $this->recalculate($order->customer_id);
    }

    public function onServiceOrderCancelled(ServiceOrder $order): void
    {
        CurrentAccount::where('service_order_id', $order->id)->delete();
        $this->recalculate($order->customer_id);
    }

    public function recalculate(int $customerId): void
    {
        DB::transaction(function () use ($customerId) {
            $entries = CurrentAccount::where('customer_id', $customerId)
                ->orderBy('id', 'asc')
                ->lockForUpdate()
                ->get();

            $running = 0;
            foreach ($entries as $entry) {
                $running = round($running + $entry->debit - $entry->credit, 2);
                $entry->balance = $running;
                $entry->save();
            }
        });
    }

    private function insert(int $customerId, array $data): CurrentAccount
    {
        return CurrentAccount::create([
            'customer_id' => $customerId,
            'balance'     => 0,
            ...$data,
        ]);
    }
}
