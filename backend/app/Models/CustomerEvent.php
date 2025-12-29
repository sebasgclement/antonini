<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerEvent extends Model
{
    protected $fillable = [
        'customer_id', 
        'user_id',
        'type', 
        'description', 
        'date'
    ];
    
    protected $casts = [
        'date' => 'datetime',
    ];

    // Relación con el Usuario (Vendedor)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // 👇 ESTA ES LA QUE FALTABA
    // Relación con el Cliente (Para saber de quién es el evento)
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}