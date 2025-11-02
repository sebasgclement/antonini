<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'requires_details'];

    public function payments()
    {
        return $this->hasMany(ReservationPayment::class, 'payment_method_id');
    }
}
