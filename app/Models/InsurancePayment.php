<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InsurancePayment extends Model
{
    protected $fillable = ['service_order_id', 'amount', 'payment_date', 'notes'];

    protected $casts = [
        'amount'       => 'decimal:2',
        'payment_date' => 'date:Y-m-d',
    ];

    public function serviceOrder()
    {
        return $this->belongsTo(ServiceOrder::class);
    }
}
