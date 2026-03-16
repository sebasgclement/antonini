<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Provider extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'cuit', 'tax_responsibility_id', 'business_name', 
        'iibb', 'business_unit_id'
    ];

    public function taxResponsibility()
    {
        return $this->belongsTo(TaxResponsibility::class);
    }

    public function businessUnit()
    {
        return $this->belongsTo(BusinessUnit::class);
    }

    public function addresses()
    {
        return $this->hasMany(ProviderAddress::class);
    }

    public function contacts()
    {
        return $this->hasMany(ProviderContact::class);
    }
}