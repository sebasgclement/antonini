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
        'used_vehicle_price',
        'date',
        'price',
        'price_ars',           // Precio en ARS congelado al momento de la operación
        'deposit',
        'credit_bank',
        'balance',
        'payment_method',
        'payment_details',
        'workshop_expenses',
        'comments',
        'status',
        'transfer_cost',
        'administrative_cost',
        'currency',
        'exchange_rate',
        'second_buyer_name',
        'second_buyer_dni',
        'second_buyer_phone',
        'used_vehicle_checklist',
    ];

    protected $casts = [
        'price'               => 'decimal:2',
        'deposit'             => 'decimal:2',
        'credit_bank'         => 'decimal:2',
        'balance'             => 'decimal:2',
        'workshop_expenses'   => 'decimal:2',
        'transfer_cost'       => 'decimal:2',
        'administrative_cost' => 'decimal:2',
        'exchange_rate'       => 'decimal:2',
        'used_vehicle_price'  => 'decimal:2',
        'price_ars'           => 'decimal:2',
        'exchange_rate'       => 'decimal:4',
        'used_vehicle_checklist' => 'array',
        'date'                => 'datetime',
    ];

    protected $appends = [
        'profit',
        'paid_amount',
        'remaining_amount',
    ];


    // ================= RELACIONES =================

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function partners()
    {
        return $this->hasMany(ReservationPartner::class);
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

    // ================= CÁLCULOS =================

    public function getProfitAttribute(): float
    {
        $income = (float) $this->price + (float) $this->administrative_cost;

        // 🔥 CORRECCIÓN IMPORTANTE:
        // Usamos $this->used_vehicle_price (lo que pagamos en ESTA reserva)
        // en lugar de $this->usedVehicle->price (que es el precio de lista general)
        $costOfTradeIn = (float) ($this->used_vehicle_price ?? 0);

        $costs = $costOfTradeIn
               + (float) ($this->workshop_expenses ?? 0)
               + (float) ($this->transfer_cost ?? 0);

        return $income - $costs;
    }
    
    // 💵 TOTAL OPERACIÓN (Lo que paga el cliente en total)
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

    public function getPaidAmountAttribute(): float
    {
        // amount_ars es el valor en ARS de cada pago (congelado al tipo de cambio del momento)
        return (float) $this->payments()->sum('amount_ars');
    }

    public function getRemainingAmountAttribute(): float
    {
        // price_ars es el precio de venta en ARS congelado al momento de la reserva
        $priceARS = (float) ($this->price_ars ?? $this->price);
        $total    = $priceARS
                  + (float) ($this->transfer_cost ?? 0)
                  + (float) ($this->administrative_cost ?? 0);
        $paid     = (float) ($this->deposit ?? 0)
                  + (float) ($this->used_vehicle_price ?? 0)
                  + (float) ($this->credit_bank ?? 0)
                  + (float) $this->payments()->sum('amount_ars');
        return max(0, $total - $paid);
    }


}
