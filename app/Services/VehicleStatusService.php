<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Single source of truth for vehicle ↔ reservation status transitions.
 *
 * All callers use this service. Neither Vehicle::booted() nor Reservation::booted()
 * contain cross-model logic — that was the source of cascade bugs.
 *
 * Internal saves use updateQuietly() or Reservation::withoutEvents() to prevent
 * any accidental re-triggering of observer chains.
 */
class VehicleStatusService
{
    /**
     * A reservation was just created with status 'pendiente'.
     * Vehicle: disponible → reservado.
     */
    public function reserve(Vehicle $vehicle): void
    {
        $vehicle->updateQuietly(['status' => 'reservado']);
    }

    /**
     * A reservation was confirmed (status confirmada or vendido).
     * Vehicle: reservado → vendido, stamps seller_id and sold_at.
     * Does NOT change reservation status — the controller already did that.
     */
    public function onConfirmed(Vehicle $vehicle): void
    {
        $vehicle->updateQuietly([
            'status'    => 'vendido',
            'seller_id' => $vehicle->seller_id ?? Auth::id() ?? 1,
            'sold_at'   => $vehicle->sold_at ?? now(),
        ]);
    }

    /**
     * A reservation was cancelled or deleted.
     * Vehicle: → disponible, only if no other active reservation exists.
     */
    public function onCancelled(Vehicle $vehicle): void
    {
        $hasActive = $vehicle->reservations()
            ->whereIn('status', ['pendiente', 'reservado', 'confirmada'])
            ->exists();

        if (!$hasActive) {
            $vehicle->updateQuietly([
                'status'  => 'disponible',
                'sold_at' => null,
            ]);
        }
    }

    /**
     * Admin manually sets vehicle to 'vendido' without an existing reservation.
     * Auto-creates a "Venta directa" reservation and stamps the vehicle.
     */
    public function directSale(Vehicle $vehicle): void
    {
        DB::transaction(function () use ($vehicle) {
            $alreadyExists = $vehicle->reservations()
                ->whereIn('status', ['confirmada', 'vendido'])
                ->exists();

            if (!$alreadyExists) {
                Reservation::withoutEvents(function () use ($vehicle) {
                    $vehicle->reservations()->create([
                        'customer_id'       => $vehicle->customer_id ?? 1,
                        'seller_id'         => Auth::id() ?? 1,
                        'price'             => $vehicle->price ?? 0,
                        'deposit'           => 0,
                        'payment_method'    => 'contado',
                        'workshop_expenses' => 0,
                        'comments'          => 'Venta directa generada automáticamente',
                        'status'            => 'vendido',
                        'date'              => now(),
                    ]);
                });
            }

            $vehicle->updateQuietly([
                'status'    => 'vendido',
                'seller_id' => $vehicle->seller_id ?? Auth::id() ?? 1,
                'sold_at'   => $vehicle->sold_at ?? now(),
            ]);
        });
    }

    /**
     * Admin resets vehicle to 'disponible' (or 'ofrecido').
     * Cancels all active reservations (pendiente/reservado/confirmada).
     */
    public function release(Vehicle $vehicle, string $targetStatus = 'disponible'): void
    {
        DB::transaction(function () use ($vehicle, $targetStatus) {
            Reservation::withoutEvents(function () use ($vehicle) {
                $vehicle->reservations()
                    ->whereIn('status', ['pendiente', 'reservado', 'confirmada'])
                    ->each(fn($r) => $r->updateQuietly(['status' => 'anulada']));
            });

            $vehicle->updateQuietly([
                'status'  => $targetStatus,
                'sold_at' => null,
            ]);
        });
    }
}
