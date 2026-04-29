<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_id',
        'vehicle_id',
        'reservation_id',
        'technician_id',
        'status',
        'type',
        'insurance_company',
        'policy_number',
        'claim_number',
        'mileage',
        'notes',
        'subtotal',
        'discount',
        'tax',
        'total',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax'      => 'decimal:2',
        'total'    => 'decimal:2',
        'mileage'  => 'integer',
    ];

    // ================= RELACIONES =================

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function technician()
    {
        // Relación con el usuario que hace el trabajo técnico
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function items()
    {
        return $this->hasMany(ServiceOrderItem::class);
    }
}