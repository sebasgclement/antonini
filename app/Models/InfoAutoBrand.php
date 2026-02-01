<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InfoAutoBrand extends Model
{
    protected $guarded = []; // Esto permite guardar todo sin restricciones
    public $timestamps = true;
    
    // Relación
    public function groups()
    {
        return $this->hasMany(InfoAutoGroup::class, 'brand_id');
    }
}