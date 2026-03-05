<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EntryController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validación básica de campos
        $request->validate([
            'entry_date' => 'required|date',
            'description' => 'required|string',
            'items' => 'required|array|min:2', // Al menos dos movimientos
            'items.*.accounting_account_id' => 'required|exists:accounting_accounts,id',
        ]);

        return DB::transaction(function () use ($request) {
            // 2. Crear cabecera
            $entry = AccountingEntry::create([
                'entry_date' => $request->entry_date,
                'description' => $request->description,
                'reference' => $request->reference,
                'user_id' => auth()->id(),
            ]);

            // 3. Crear los ítems
            foreach ($request->items as $item) {
                $entry->items()->create([
                    'accounting_account_id' => $item['accounting_account_id'],
                    'debit' => $item['debit'] ?? 0,
                    'credit' => $item['credit'] ?? 0,
                ]);
            }

            // 4. LA PRUEBA DE FUEGO: ¿Balancea?
            if (!$entry->isBalanced()) {
                throw new \Exception("El asiento no está balanceado. El Debe y el Haber deben coincidir.");
            }

            return response()->json(['message' => 'Asiento guardado con éxito', 'data' => $entry], 201);
        });
    }
}
