<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccountingEntryItem extends Model
{
    use SoftDeletes;
    
    protected $fillable = ['accounting_entry_id', 'accounting_account_id', 'debit', 'credit'];

    public function account()
    {
        return $this->belongsTo(AccountingAccount::class, 'accounting_account_id');
    }

    public function entry() {
    return $this->belongsTo(AccountingEntry::class, 'accounting_entry_id');
}

}