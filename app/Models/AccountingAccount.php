<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountingAccount extends Model
{
    use HasFactory;

    // 1. Definimos los campos que se pueden cargar masivamente (Fillable)
    protected $fillable = [
        'code',          // Ej: 1.1.1.01.000 
        'name',          // Ej: Caja 
        'parent_id',     // ID de la cuenta de nivel superior
        'level',         // Nivel (1 al 5)
        'is_selectable'  // Si permite asientos contables (Solo nivel 5)
    ];

    /**
     * RELACIÓN PADRE: 
     * Obtiene la cuenta de nivel superior (ej: "Bancos" es padre de "Banco Credicoop") 
     */
    public function parent()
    {
        return $this->belongsTo(AccountingAccount::class, 'parent_id');
    }

    /**
     * RELACIÓN HIJOS: 
     * Obtiene todas las subcuentas (ej: "ACTIVO" tiene como hijos a "CORRIENTE" y "NO CORRIENTE") 
     */
    public function children()
    {
        return $this->hasMany(AccountingAccount::class, 'parent_id')->orderBy('code');
    }

    /**
     * SCOPE PARA CUENTAS IMPUTABLES:
     * Útil para los selects del frontend donde solo querés mostrar cuentas donde se puede cargar plata.
     */
    public function scopeSelectable($query)
    {
        return $query->where('is_selectable', true);
    }
}