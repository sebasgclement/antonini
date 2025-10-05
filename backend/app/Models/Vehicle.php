<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'brand','model','year','plate','vin','color','km','fuel_level',
        'ownership','customer_id','reference_price','price','status',
        'check_spare','check_jack','check_docs','notes',
        'photo_front','photo_back','photo_left','photo_right', // 🆕 nuevas columnas
    ];

    protected $casts = [
        'year'            => 'integer',
        'km'              => 'integer',
        'fuel_level'      => 'integer',
        'reference_price' => 'decimal:2',
        'price'           => 'decimal:2',
        'check_spare'     => 'boolean',
        'check_jack'      => 'boolean',
        'check_docs'      => 'boolean',
    ];

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
}
