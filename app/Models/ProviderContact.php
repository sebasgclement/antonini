<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProviderContact extends Model
{
    protected $fillable = [
        'provider_id', 'full_name', 'phone', 
        'email', 'sector', 'observations'
    ];

    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }
}