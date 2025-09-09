<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Reception extends Model
{
    use HasFactory;

    protected $fillable = [
        'received_by', 'customer_id',
        'customer_name', 'customer_email', 'customer_phone',
        'brand', 'model', 'year', 'plate', 'vin', 'color', 'km', 'fuel_level',
        'check_spare', 'check_jack', 'check_docs',
        'notes', 'status',
    ];

    protected $casts = [
        'year'        => 'integer',
        'km'          => 'integer',
        'fuel_level'  => 'integer',
        'check_spare' => 'boolean',
        'check_jack'  => 'boolean',
        'check_docs'  => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
