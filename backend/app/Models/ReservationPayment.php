<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ReservationPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'payment_method_id', // ✅ Esto es clave que esté aquí
        'amount',
        'details', // Para guardar JSON de cheques, bancos, etc.
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'details' => 'array', // ✅ Para que Laravel convierta el JSON a array solo
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    // ✅ ESTA ES LA FUNCIÓN QUE FALTABA Y CAUSABA EL ERROR
    public function method()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }
}