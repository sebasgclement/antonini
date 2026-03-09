<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingAccount;
use Illuminate\Http\Request;

class AccountingAccountController extends Controller
{
    // Listar todas las cuentas para el árbol
    public function index()
    {
        return response()->json(AccountingAccount::orderBy('code')->get());
    }

    // Crear una cuenta nueva
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required','string','unique:accounting_accounts,code','regex:/^\d(\.\d){2}\.\d{2}\.\d{3}$/'],
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:accounting_accounts,id',
            'level' => 'required|integer',
            'is_selectable' => 'boolean'
        ]);

        $account = AccountingAccount::create($validated);
        return response()->json($account, 201);
    }

    // Actualizar una cuenta existente
    public function update(Request $request, $id)
    {
        $account = AccountingAccount::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_selectable' => 'boolean'
        ]);

        $account->update($validated);
        return response()->json($account);
    }
}