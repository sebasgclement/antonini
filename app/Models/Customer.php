<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',      // Usuario que cargó el cliente (Creador)
        'seller_id',    // 👈 NUEVO: Dueño actual del cliente (Vendedor asignado)
        'locked_until', // 👈 NUEVO: Fecha hasta cuando es dueño
        'status',
        'first_name',
        'last_name',
        'email',
        'phone',
        'alt_phone',
        'doc_type',
        'doc_number',
        'cuit',
        'marital_status',
        'address',
        'city',
        'notes',
        'dni_front',
        'dni_back',
        'is_insurer',
    ];

    // ⚠️ IMPORTANTE: Esto convierte el string de la fecha en un objeto Carbon
    // para poder preguntar cosas como: if ($customer->locked_until > now())
    protected $casts = [
        'locked_until' => 'datetime',
        'is_insurer'   => 'boolean',
    ];

    // Relación: Quién cargó el cliente (Creador)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // 👈 NUEVA RELACIÓN: Quién es el dueño actual (Vendedor)
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    // Accessors para las URLs de las fotos
    protected $appends = ['dni_front_url', 'dni_back_url'];

    public function getDniFrontUrlAttribute()
    {
        return $this->dni_front ? asset('storage/' . $this->dni_front) : null;
    }

    public function getDniBackUrlAttribute()
    {
        return $this->dni_back ? asset('storage/' . $this->dni_back) : null;
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'customer_id');
    }

    public function reservations()
    {
        return $this->hasMany(\App\Models\Reservation::class, 'customer_id');
    }
}