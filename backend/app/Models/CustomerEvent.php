<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerEvent extends Model
{
    protected $fillable = [
        'customer_id', 
        'user_id',      // 👈 AGREGADO: Importante para saber quién registró el evento
        'type', 
        'description', 
        'date'
    ];
    
    // Castear la fecha para que Laravel la maneje como objeto Carbon
    protected $casts = [
        'date' => 'datetime',
    ];

    // 👈 NUEVA RELACIÓN: Para poder mostrar "Agendado por: Juan" en el historial
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}