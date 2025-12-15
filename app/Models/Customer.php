<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',      // 👈 Importante para saber quién lo cargó
        'status',       // 👈 Importante para el filtro (consulta vs cliente)
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
    ];

    // 👇 ESTA ES LA FUNCIÓN QUE TE FALTA Y DA EL ERROR
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Accessors para las URLs de las fotos (ya los tenías, los dejo por las dudas)
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