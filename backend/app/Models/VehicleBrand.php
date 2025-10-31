<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleBrand extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'active',
    ];

    // Opcional: relación con vehículos
    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'brand_id');
    }
}
