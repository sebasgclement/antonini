<?php

namespace App\Console\Commands;

use App\Models\CurrentAccount;
use App\Models\Reservation;
use App\Models\ServiceOrder;
use App\Services\CurrentAccountService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillCurrentAccounts extends Command
{
    protected $signature = 'cc:backfill {--dry-run : Mostrar qué se haría sin escribir nada}';
    protected $description = 'Puebla la cuenta corriente con las reservas y órdenes de servicio existentes';

    public function handle(CurrentAccountService $ccService): int
    {
        $dry = $this->option('dry-run');

        if ($dry) {
            $this->warn('[DRY RUN] No se escribirá nada en la base de datos.');
        }

        // ── 1. RESERVAS ──────────────────────────────────────────────────────
        $reservations = Reservation::with(['vehicle', 'usedVehicle', 'payments.method'])
            ->whereNotIn('status', ['anulada'])
            ->orderBy('created_at')
            ->get();

        $this->info("Reservas a procesar: {$reservations->count()}");
        $reservationsAdded = 0;
        $paymentsAdded     = 0;

        foreach ($reservations as $reservation) {
            // Saltar si ya tiene entradas en CC
            $alreadySynced = CurrentAccount::where('reservation_id', $reservation->id)->exists();

            if ($alreadySynced) {
                $this->line("  [SKIP] Reserva #{$reservation->id} (ya tiene movimientos en CC)");
                continue;
            }

            $label = $reservation->vehicle
                ? "{$reservation->vehicle->brand} {$reservation->vehicle->model} ({$reservation->vehicle->plate})"
                : "Reserva #{$reservation->id}";

            $this->line("  [OK]   Reserva #{$reservation->id} — $label");

            if (!$dry) {
                $ccService->onReservationCreated($reservation);
            }
            $reservationsAdded++;

            // Pagos de la reserva, en orden de creación
            foreach ($reservation->payments->sortBy('id') as $payment) {
                $method = $payment->method?->name ?? 'Pago';
                $amount = number_format((float)($payment->amount_ars ?? $payment->amount), 0, ',', '.');
                $this->line("         + Pago #{$payment->id} {$method} \${$amount}");

                if (!$dry) {
                    $ccService->onReservationPaymentCreated($payment);
                }
                $paymentsAdded++;
            }
        }

        // ── 2. ÓRDENES DE SERVICIO ───────────────────────────────────────────
        $orders = ServiceOrder::with('vehicle')
            ->whereIn('status', ['completed', 'delivered'])
            ->whereNotNull('customer_id')
            ->orderBy('id')
            ->get();

        $this->info("Órdenes de servicio completadas: {$orders->count()}");
        $ordersAdded = 0;

        foreach ($orders as $order) {
            $alreadySynced = CurrentAccount::where('service_order_id', $order->id)
                ->where('debit', '>', 0)
                ->exists();

            if ($alreadySynced) {
                $this->line("  [SKIP] OT #{$order->id} (ya tiene movimiento en CC)");
                continue;
            }

            $vehicle = $order->vehicle;
            $label   = $vehicle
                ? "OT #{$order->id} — {$vehicle->brand} {$vehicle->model} ({$vehicle->plate})"
                : "OT #{$order->id}";

            $total = number_format((float)($order->total ?? 0), 0, ',', '.');
            $this->line("  [OK]   {$label} \${$total}");

            if (!$dry) {
                $ccService->onServiceOrderCompleted($order);
            }
            $ordersAdded++;
        }

        // ── 3. RESUMEN ───────────────────────────────────────────────────────
        $this->newLine();
        $this->info('──────────────────────────────────────');
        $this->info("Reservas procesadas : {$reservationsAdded}");
        $this->info("Pagos procesados    : {$paymentsAdded}");
        $this->info("OT procesadas       : {$ordersAdded}");

        if ($dry) {
            $this->warn('[DRY RUN] Ningún dato fue modificado.');
        } else {
            $this->info('✅ Backfill completado.');
        }

        return Command::SUCCESS;
    }
}
