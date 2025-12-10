<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class CustomerEvent extends Model
{
    protected $fillable = ['customer_id', 'type', 'description', 'date'];
    
    // Castear la fecha para que Laravel la maneje como objeto Carbon
    protected $casts = [
        'date' => 'datetime',
    ];
}