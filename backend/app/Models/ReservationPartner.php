<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ReservationPartner extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'full_name',
        'dni',
        'phone',
        'document_photo_path'
    ];

    // Relación inversa (opcional, pero útil)
    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }
}