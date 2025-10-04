<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'first_name','last_name','doc_type','doc_number','cuit',
        'email','phone','alt_phone','city','address','notes'
    ];

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

}
