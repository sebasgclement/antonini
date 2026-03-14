<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingEntryItem extends Model
{
    protected $fillable = [
        'accounting_entry_id',
        'accounting_account_id',
        'description',
        'debit',
        'credit'
    ];

    // 👇 ESTA ES LA FUNCIÓN QUE FALTABA Y CAUSABA EL ERROR 500 👇
    public function accountingAccount()
    {
        return $this->belongsTo(AccountingAccount::class, 'accounting_account_id');
    }
    
    // Relación inversa hacia la cabecera (buena práctica)
    public function entry()
    {
        return $this->belongsTo(AccountingEntry::class, 'accounting_entry_id');
    }
}