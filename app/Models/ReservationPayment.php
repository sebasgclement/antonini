<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ReservationPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'payment_method_id',
        'amount',
        'details',
    ];

    protected $casts = [
        'amount'  => 'decimal:2',
        'details' => 'array',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function method()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    /**
     * Cada vez que se guarda un pago:
     * - recalcula depósito y saldo
     * - si el saldo llega a 0 o menos → marca la reserva como confirmada
     *   (y Reservation::booted ya pone el vehículo como "vendido")
     */
    protected static function booted()
    {
        static::saved(function (ReservationPayment $payment) {
            $reservation = $payment->reservation()
                ->with('usedVehicle')
                ->first();

            if (! $reservation) {
                return;
            }

            // Total de la operación
            $price  = (float) ($reservation->price ?? 0);
            $credit = (float) ($reservation->credit_bank ?? 0);
            $trade  = (float) ($reservation->usedVehicle?->price ?? 0);

            // Total pagado por todos los pagos registrados
            $paid = (float) $reservation->payments()->sum('amount');

            // Nuevo saldo
            $balance = $price - $paid - $credit - $trade;

            $updateData = [
                'deposit' => $paid,
                'balance' => $balance,
            ];

            // Si ya está todo pagado o más → confirmar reserva
            if ($price > 0 && $balance <= 0) {
                $updateData['status'] = 'confirmada';
            }

            // Esto dispara el booted() de Reservation (que marca vehículo vendido)
            $reservation->update($updateData);
        });
    }
}
