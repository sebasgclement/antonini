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
        'price',             // Precio de venta del vehículo
        'deposit',
        'credit_bank',
        'balance',
        'payment_method',
        'payment_details',
        'workshop_expenses', // Gastos de taller
        'comments',
        'status',

        // ✅ NUEVOS CAMPOS
        'transfer_cost',       // Costo real de la transferencia (gestor/registro)
        'administrative_cost', // Honorarios de la agencia (Ganancia extra)
        'currency',            // 'ARS' o 'USD'
        'exchange_rate',       // Cotización
        'second_buyer_name',   // Nombre cotitular
        'second_buyer_dni',    // DNI cotitular
        'second_buyer_phone',  // Tel cotitular
        'used_vehicle_checklist', // Checklist del usado (JSON)
    ];

   protected $casts = [
        'price'               => 'decimal:2',
        'deposit'             => 'decimal:2',
        'credit_bank'         => 'decimal:2',
        'balance'             => 'decimal:2',
        'workshop_expenses'   => 'decimal:2',
        'transfer_cost'       => 'decimal:2', // ✅
        'administrative_cost' => 'decimal:2', // ✅
        'exchange_rate'       => 'decimal:2',
        'used_vehicle_checklist' => 'array',  // ✅ convierte el JSON de la BD a Array en PHP
        'date'                => 'datetime',
    ];

    protected $appends = [
    'profit',        // si ya lo estás usando
    'paid_amount',
    'remaining_amount',
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

    public function getProfitAttribute(): float
    {
        $income = (float) $this->price + (float) $this->administrative_cost;

        $costs = (float) ($this->usedVehicle?->price ?? 0) 
               + (float) ($this->workshop_expenses ?? 0)
               + (float) ($this->transfer_cost ?? 0);

        return $income - $costs;
    }
    
    // 💵 TOTAL OPERACIÓN (Lo que paga el cliente en total)
    // Precio Auto + Transferencia + Honorarios
    

    // ================= MÉTODOS AUXILIARES =================

    /**
     * Calcula la ganancia neta:
     * precio de venta - valor vehículo usado - gastos de taller
     */
    public function getTotalOperationAttribute(): float
    {
        return (float) $this->price 
             + (float) ($this->transfer_cost ?? 0) 
             + (float) ($this->administrative_cost ?? 0);
    }

        // ================= MÉTODOS DE PAGO =================

        public function payments()
{
    return $this->hasMany(\App\Models\ReservationPayment::class);
}

// Opcional: helpers para ver lo pagado y lo pendiente
public function getPaidAmountAttribute(): float
{
    return (float) $this->payments()->sum('amount');
}

public function getRemainingAmountAttribute(): float
{
    $total = (float) ($this->price ?? 0);
    return max(0, $total - $this->paid_amount);
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
