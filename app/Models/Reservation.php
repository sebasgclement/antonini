<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'customer_id',
        'seller_id',
        'used_vehicle_id',
        'date',
        'price',
        'deposit',
        'payment_method',
        'payment_details',
        'comments',
        'status',
    ];

    protected $casts = [
        'price'   => 'decimal:2',
        'deposit' => 'decimal:2',
        'date'    => 'datetime',
    ];

    // ================= RELACIONES =================

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

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

    // ================= EVENTOS AUTOMÁTICOS =================

    protected static function booted()
    {
        // Cuando se crea una reserva -> marcar vehículo como reservado
        static::created(function ($reservation) {
            if ($reservation->vehicle && $reservation->status === 'pendiente') {
                $reservation->vehicle->update(['status' => 'reservado']);
            }
        });

        // Cuando se actualiza una reserva -> sincronizar estado del vehículo
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

        // Cuando se elimina una reserva pendiente -> liberar vehículo
        static::deleted(function ($reservation) {
            if ($reservation->vehicle && $reservation->status === 'pendiente') {
                $reservation->vehicle->update(['status' => 'disponible']);
            }
        });
    }
}
