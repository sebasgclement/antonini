<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PriceList extends Model
{
    use SoftDeletes;
    protected $fillable = ['name', 'provider_id'];

    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }
}