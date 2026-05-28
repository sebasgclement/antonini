<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type',
        'manufacturer_code',
        'category',
        'business_unit_id',
        'description',
        'multiplier_factor',
        'sale_price',
        'iva_id',
        'accounting_account_id',
        'provider_id',
        'stock_official',
        'stock_internal',
        'reorder_point'
    ];

    public function businessUnit()
    {
        return $this->belongsTo(BusinessUnit::class);
    }

    public function iva()
    {
        return $this->belongsTo(Iva::class);
    }

    public function accountingAccount()
    {
        return $this->belongsTo(AccountingAccount::class);
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }

    public function prices()
    {
        return $this->hasMany(ProductPrice::class);
    }
}