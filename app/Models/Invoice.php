<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\BusinessUnit;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'business_unit_id',
        'user_id',
        'type',
        'is_fiscal',
        'fiscal_status',
        'number',
        'subtotal',
        'iva_amount',
        'total',
        'notes',
    ];

    protected $casts = [
        'is_fiscal'  => 'boolean',
        'subtotal'   => 'float',
        'iva_amount' => 'float',
        'total'      => 'float',
    ];

    // --- RELACIONES ---

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function businessUnit()
    {
        return $this->belongsTo(BusinessUnit::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function currentAccountMovements()
    {
        return $this->hasMany(CurrentAccount::class);
    }
}