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

    // =====================================================================
    // VENCIMIENTOS: cada cargo vence a los DUE_DAYS días. Desde WARN_DAYS se avisa "por vencer".
    // =====================================================================
    public const DUE_DAYS  = 30;
    public const WARN_DAYS = 20;

    /**
     * Cargos con saldo pendiente de un cliente. Como los pagos no se imputan a un cargo
     * puntual, se aplican primero a los cargos más viejos (FIFO).
     *
     * @return array<int, array{movement_id:int, concept:string, date:string, due_date:string, amount:float, remaining:float, days:int, days_to_due:int, status:string}>
     */
    public function openDebts(int $customerId): array
    {
        $movements = CurrentAccount::where('customer_id', $customerId)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'concept', 'debit', 'credit', 'created_at']);

        return $this->allocate($movements);
    }

    /** Resumen de antigüedad de deuda de un cliente (para badges y listados). */
    public function agingSummary(array $openDebts): array
    {
        $summary = ['total' => 0.0, 'overdue' => 0.0, 'due_today' => 0.0, 'due_soon' => 0.0, 'current' => 0.0, 'max_days' => 0, 'status' => 'al_dia'];

        foreach ($openDebts as $d) {
            $summary['total'] += $d['remaining'];
            $key = match ($d['status']) {
                'vencido'   => 'overdue',
                'vence_hoy' => 'due_today',
                'por_vencer'=> 'due_soon',
                default     => 'current',
            };
            $summary[$key] += $d['remaining'];
            $summary['max_days'] = max($summary['max_days'], $d['days']);
        }

        // El estado del cliente es el de su deuda más urgente
        $summary['status'] = $summary['overdue'] > 0 ? 'vencido'
            : ($summary['due_today'] > 0 ? 'vence_hoy'
            : ($summary['due_soon'] > 0 ? 'por_vencer'
            : ($summary['total'] > 0 ? 'al_dia' : 'sin_deuda')));

        foreach (['total', 'overdue', 'due_today', 'due_soon', 'current'] as $k) {
            $summary[$k] = round($summary[$k], 2);
        }

        return $summary;
    }

    /** Todos los clientes con deuda abierta, con su antigüedad. */
    public function agingByCustomer(): array
    {
        $movements = CurrentAccount::orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'customer_id', 'concept', 'debit', 'credit', 'created_at'])
            ->groupBy('customer_id');

        $rows = [];
        foreach ($movements as $customerId => $list) {
            $open = $this->allocate($list);
            if (empty($open)) continue;
            $rows[(int) $customerId] = [
                'open_debts' => $open,
                'aging'      => $this->agingSummary($open),
            ];
        }

        return $rows;
    }

    private function allocate($movements): array
    {
        $debts   = [];
        $credits = 0.0;

        foreach ($movements as $m) {
            if ((float) $m->debit > 0) {
                $debts[] = ['m' => $m, 'remaining' => (float) $m->debit];
            }
            $credits += (float) $m->credit;
        }

        // Aplicar todos los pagos/créditos a los cargos más antiguos
        foreach ($debts as &$d) {
            if ($credits <= 0) break;
            $applied        = min($credits, $d['remaining']);
            $d['remaining'] -= $applied;
            $credits        -= $applied;
        }
        unset($d);

        $today = now()->startOfDay();
        $open  = [];

        foreach ($debts as $d) {
            if (round($d['remaining'], 2) <= 0) continue;

            $date      = $d['m']->created_at->copy()->startOfDay();
            $days      = (int) $date->diffInDays($today);
            $daysToDue = self::DUE_DAYS - $days;

            $status = $daysToDue < 0 ? 'vencido'
                : ($daysToDue === 0 ? 'vence_hoy'
                : ($days >= self::WARN_DAYS ? 'por_vencer' : 'al_dia'));

            $open[] = [
                'movement_id' => $d['m']->id,
                'concept'     => $d['m']->concept,
                'date'        => $date->toDateString(),
                'due_date'    => $date->copy()->addDays(self::DUE_DAYS)->toDateString(),
                'amount'      => round((float) $d['m']->debit, 2),
                'remaining'   => round($d['remaining'], 2),
                'days'        => $days,
                'days_to_due' => $daysToDue,
                'status'      => $status,
            ];
        }

        return $open;
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
