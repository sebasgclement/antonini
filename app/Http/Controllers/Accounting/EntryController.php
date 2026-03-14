<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EntryController extends Controller
{
    // 👇 ESTA ES LA FUNCIÓN QUE FALTABA PARA EL LISTADO 👇
    public function index(Request $request)
    {
        $query = AccountingEntry::with(['businessUnit', 'items.accountingAccount']);

        // 1. Filtro por Fecha Desde
        if ($request->filled('date_from')) {
            $query->whereDate('entry_date', '>=', $request->date_from);
        }

        // 2. Filtro por Fecha Hasta
        if ($request->filled('date_to')) {
            $query->whereDate('entry_date', '<=', $request->date_to);
        }

        // 3. Filtro por Unidad de Negocio
        if ($request->filled('business_unit_id')) {
            $query->where('business_unit_id', $request->business_unit_id);
        }

        // 4. Filtro por Cuenta Contable (Busca dentro de los ítems del asiento)
        if ($request->filled('account_id')) {
            $query->whereHas('items', function ($q) use ($request) {
                $q->where('accounting_account_id', $request->account_id);
            });
        }

        // Paginamos de a 20 registros
        $entries = $query->orderBy('entry_date', 'desc')
                         ->orderBy('id', 'desc')
                         ->paginate(20);

        return response()->json($entries);
    }

    // Tu función store original sigue intacta acá abajo
    public function store(Request $request)
    {
        // 1. Validación básica de campos
        $request->validate([
            'entry_date' => 'required|date',
            'description' => 'required|string',
            'business_unit_id' => 'required|exists:business_units,id',
            'items' => 'required|array|min:2', // Al menos dos movimientos
            'items.*.accounting_account_id' => 'required|exists:accounting_accounts,id',
        ]);

        return DB::transaction(function () use ($request) {
            // 2. Crear cabecera
            $entry = AccountingEntry::create([
                'entry_date' => $request->entry_date,
                'description' => $request->description,
                'reference' => $request->reference,
                'business_unit_id' => $request->business_unit_id,
                'user_id' => auth()->id() ?? 1,
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