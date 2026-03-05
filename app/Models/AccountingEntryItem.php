<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingEntryItem extends Model
{
    protected $fillable = ['accounting_entry_id', 'accounting_account_id', 'debit', 'credit'];

    public function account()
    {
        return $this->belongsTo(AccountingAccount::class, 'accounting_account_id');
    }
}