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
        'marital_status',  
        'email',
        'phone',
        'alt_phone',       
        'address',         
        'city',            
        'notes',           
        'dni_front',
        'dni_back'
    ];

    public function events()
    {
        return $this->hasMany(CustomerEvent::class)->orderBy('date', 'desc');
    }

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
