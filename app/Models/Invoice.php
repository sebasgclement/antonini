<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'business_unit_id',
        'user_id',
        'type',
        'number',
        'subtotal',
        'iva_amount',
        'total',
        'notes',
    ];

    // --- RELACIONES ---

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function businessUnit()
    {
        return $this->belongsTo(\App\Http\Controllers\Accounting\BusinessUnitController::class); // Ajustá el namespace de BusinessUnit si tenés un modelo separado para esto
        // Nota: Si tenés un modelo App\Models\BusinessUnit, cambialo por: return $this->belongsTo(BusinessUnit::class);
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