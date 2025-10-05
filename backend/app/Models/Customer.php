<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'doc_type',
        'doc_number',
        'cuit',
        'email',
        'phone',
        'alt_phone',
        'city',
        'address',
        'notes',
        'dni_front',  // foto frente
        'dni_back'    // foto dorso
    ];

    // Relaciones
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // 🔗 Accessors para devolver URLs completas
    protected $appends = ['dni_front_url', 'dni_back_url'];

    public function getDniFrontUrlAttribute()
    {
        return $this->dni_front ? asset('storage/' . $this->dni_front) : null;
    }

    public function getDniBackUrlAttribute()
    {
        return $this->dni_back ? asset('storage/' . $this->dni_back) : null;
    }
}
