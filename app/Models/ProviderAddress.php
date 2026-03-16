<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProviderAddress extends Model
{
    protected $fillable = [
        'provider_id', 'street', 'number', 'floor', 
        'apartment', 'zip_code', 'province_id'
    ];

    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }

    public function province()
    {
        return $this->belongsTo(Province::class);
    }
}
