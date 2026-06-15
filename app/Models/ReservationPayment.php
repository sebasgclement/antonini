<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ReservationPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'payment_method_id',
        'amount',
        'currency',
        'exchange_rate',
        'amount_ars',
        'details',
        'notes',
        'receipt_path',
    ];

    protected $casts = [
        'amount'        => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_ars'    => 'decimal:2',
        'details'       => 'array',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function method()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }
}