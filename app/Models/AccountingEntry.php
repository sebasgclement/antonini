<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingEntry extends Model
{
    protected $fillable = ['entry_date', 'description', 'reference', 'user_id'];

    // Relación: Un asiento tiene muchos ítems (Debe/Haber)
    public function items()
    {
        return $this->hasMany(AccountingEntryItem::class);
    }

    // Método de validación: ¿Suma cero?
    public function isBalanced()
    {
        $debit = $this->items->sum('debit');
        $credit = $this->items->sum('credit');
        
        // Usamos bccomp para evitar problemas de precisión con decimales
        return bccomp($debit, $credit, 2) === 0;
    }
}