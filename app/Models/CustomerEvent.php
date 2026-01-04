<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerEvent extends Model
{
    protected $fillable = [
        'customer_id', 
        'user_id',
        'parent_id',
        'type', 
        'description', 
        'date',
        'is_schedule',
        'completed'
    ];
    
    protected $attributes = [
        'parent_id' => null,
    ];

    protected $casts = [
        'date' => 'datetime',
        'is_schedule' => 'boolean',
        'completed' => 'boolean',
        'parent_id' => 'integer',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function customer() {
        return $this->belongsTo(Customer::class);
    }

    public function parent() {
        return $this->belongsTo(CustomerEvent::class, 'parent_id');
    }

    public function children() {
        return $this->hasMany(CustomerEvent::class, 'parent_id');
    }
}