<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccountingEntry extends Model
{
    use SoftDeletes;
    
    protected $fillable = ['entry_date', 'description', 'reference', 'user_id', 'business_unit_id'];

    // Relación: Un asiento tiene muchos ítems (Debe/Haber)
    public function items()
    {
        return $this->hasMany(AccountingEntryItem::class);
    }

    // 👇 ¡ACÁ ESTÁ LA MAGIA QUE FALTABA! 👇
    // Relación: Un asiento pertenece a una Unidad de Negocio
    public function businessUnit()
    {
        return $this->belongsTo(BusinessUnit::class);
    }

    // Relación: Un asiento fue creado por un Usuario (opcional pero muy recomendado)
    public function user()
    {
        return $this->belongsTo(User::class);
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