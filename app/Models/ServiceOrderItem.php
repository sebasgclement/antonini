<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_order_id',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    protected $casts = [
        'quantity'   => 'decimal:2',
        'unit_price' => 'decimal:2',
        'subtotal'   => 'decimal:2',
    ];

    // ================= RELACIONES =================

    public function serviceOrder()
    {
        return $this->belongsTo(ServiceOrder::class);
    }

    public function product()
    {
        
        return $this->belongsTo(Product::class);
    }
}