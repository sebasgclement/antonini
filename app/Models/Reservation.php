<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',        // vehículo vendido
        'customer_id',
        'seller_id',
        'used_vehicle_id',   // vehículo tomado en parte de pago
        'date',
        'price',             // precio total de venta
        'deposit',
        'credit_bank',       // 🆕 nuevo
        'balance',           // 🆕 nuevo
        'payment_method',
        'payment_details',
        'workshop_expenses', // 💡 nuevo campo: gastos de taller
        'comments',
        'status',
    ];

    protected $casts = [
        'price'             => 'decimal:2',
        'deposit'           => 'decimal:2',
        'credit_bank'       => 'decimal:2', // 🆕
        'balance'           => 'decimal:2', // 🆕
        'workshop_expenses' => 'decimal:2',
        'date'              => 'datetime',
    ];

    // ================= RELACIONES =================

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    // Vehículo entregado como parte de pago
    public function usedVehicle()
    {
        return $this->belongsTo(Vehicle::class, 'used_vehicle_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    // ================= MÉTODOS AUXILIARES =================

    /**
     * Calcula la ganancia neta:
     * precio de venta - valor vehículo usado - gastos de taller
     */
    public function getProfitAttribute(): float
    {
        $tradeInValue = $this->usedVehicle?->price ?? 0;
        $workshop = $this->workshop_expenses ?? 0;

        return (float) $this->price - $tradeInValue - $workshop;
    }

    // ================= EVENTOS AUTOMÁTICOS =================

    protected static function booted()
    {
        // Al crear la reserva → marcar vehículo como reservado
        static::created(function ($reservation) {
            if ($reservation->vehicle && $reservation->status === 'pendiente') {
                $reservation->vehicle->update(['status' => 'reservado']);
            }
        });

        // Al actualizar la reserva → sincronizar estado del vehículo
        static::updated(function ($reservation) {
            if (! $reservation->vehicle) return;

            switch ($reservation->status) {
                case 'confirmada':
                    $reservation->vehicle->update(['status' => 'vendido']);
                    break;
                case 'anulada':
                    $reservation->vehicle->update(['status' => 'disponible']);
                    break;
                case 'pendiente':
                    $reservation->vehicle->update(['status' => 'reservado']);
                    break;
            }
        });

        // Al eliminar una reserva pendiente → liberar vehículo
        static::deleted(function ($reservation) {
            if ($reservation->vehicle && $reservation->status === 'pendiente') {
                $reservation->vehicle->update(['status' => 'disponible']);
            }
        });
    }
}
