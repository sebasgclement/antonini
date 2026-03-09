<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessUnit extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'name', 'reason_social', 'logo', 'tax_condition', 
        'start_date', 'cuit', 'iibb', 'address', 
        'zip_code', 'city', 'province', 'logo'
    ];

    public function pointsOfSale(): HasMany
    {
        return $this->hasMany(PosUnit::class);
    }
}
