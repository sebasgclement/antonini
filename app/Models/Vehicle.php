<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'brand','model','year','plate','vin','color','km','fuel_type',
        'ownership','customer_id','seller_id','reference_price', 'take_price', 'price','status',
        'check_spare','check_jack', 'check_tools', 'check_docs', 'check_key_copy', 'check_manual', 'notes',
        'photo_front','photo_back','photo_left','photo_right',
        'photo_interior_front','photo_interior_back','photo_trunk',
        'sold_at',
        'destino_vehiculo',
        'published',
        'client_asking_price',
    ];

    protected $casts = [
        'year'                => 'integer',
        'km'                  => 'integer',
        'reference_price'     => 'decimal:2',
        'take_price'          => 'decimal:2',
        'price'               => 'decimal:2',
        'client_asking_price' => 'decimal:2',
        'check_spare'     => 'boolean',
        'check_jack'      => 'boolean',
        'check_tools'     => 'boolean',
        'check_docs'      => 'boolean',
        'check_key_copy'  => 'boolean',
        'check_manual'    => 'boolean',
        'sold_at'         => 'datetime',
        'published'       => 'boolean',
    ];

    // ================= RELACIONES =================
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function expenses()
    {
        return $this->hasMany(VehicleExpense::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    // ================= ATRIBUTOS COMPUTADOS =================
protected $appends = ['has_unpaid_expenses'];

public function getHasUnpaidExpensesAttribute(): bool
{
    
    if ($this->relationLoaded('expenses')) {
        return $this->expenses->where('status', 'no_pagado')->count() > 0;
    }

    return $this->expenses()->where('status', 'no_pagado')->exists();
}


}

