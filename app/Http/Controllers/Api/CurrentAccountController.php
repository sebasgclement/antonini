<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CurrentAccount;
use App\Models\Customer;
use App\Services\CurrentAccountService;
use Illuminate\Support\Facades\DB;

class CurrentAccountController extends Controller
{
    // GET /customers/{id}/current-account
    public function index($customerId, CurrentAccountService $ccService)
    {
        $customer = Customer::findOrFail($customerId);

        $movements = CurrentAccount::where('customer_id', $customerId)
            ->with([
                'invoice:id,number,type,is_fiscal',
                'reservation:id,vehicle_id',
                'reservation.vehicle:id,plate,brand,model',
                'serviceOrder:id,vehicle_id',
                'serviceOrder.vehicle:id,plate,brand,model',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $currentBalance = $movements->first()?->balance ?? 0;
        $openDebts      = $ccService->openDebts((int) $customerId);

        return response()->json([
            'customer_name'   => $customer->first_name . ' ' . $customer->last_name,
            'current_balance' => $currentBalance,
            'movements'       => $movements,
            // Cargos con saldo pendiente (pagos imputados FIFO) y su vencimiento
            'open_debts'      => $openDebts,
            'aging'           => $ccService->agingSummary($openDebts),
            'due_days'        => CurrentAccountService::DUE_DAYS,
        ]);
    }

    // GET /current-accounts/aging — clientes con deuda, del más urgente al menos urgente
    public function aging(CurrentAccountService $ccService)
    {
        $rows = $ccService->agingByCustomer();

        $customers = Customer::whereIn('id', array_keys($rows))
            ->get(['id', 'first_name', 'last_name', 'phone', 'email'])
            ->keyBy('id');

        $priority = ['vencido' => 0, 'vence_hoy' => 1, 'por_vencer' => 2, 'al_dia' => 3];

        $data = collect($rows)
            ->map(fn ($r, $id) => [
                'customer'   => $customers[$id] ?? null,
                'aging'      => $r['aging'],
                'open_debts' => $r['open_debts'],
            ])
            ->filter(fn ($r) => $r['customer'] !== null)
            ->sortBy([
                fn ($a, $b) => $priority[$a['aging']['status']] <=> $priority[$b['aging']['status']],
                fn ($a, $b) => $b['aging']['max_days'] <=> $a['aging']['max_days'],
            ])
            ->values();

        return response()->json([
            'data'   => $data,
            'totals' => [
                'total'     => round($data->sum('aging.total'), 2),
                'overdue'   => round($data->sum('aging.overdue'), 2),
                'due_soon'  => round($data->sum('aging.due_soon') + $data->sum('aging.due_today'), 2),
            ],
            'due_days'  => CurrentAccountService::DUE_DAYS,
            'warn_days' => CurrentAccountService::WARN_DAYS,
        ]);
    }

    // GET /current-accounts/aging/count — para el badge del menú
    public function agingCount(CurrentAccountService $ccService)
    {
        $statuses = collect($ccService->agingByCustomer())->pluck('aging.status');

        return response()->json([
            'overdue'  => $statuses->filter(fn ($s) => $s === 'vencido')->count(),
            'due_soon' => $statuses->filter(fn ($s) => in_array($s, ['vence_hoy', 'por_vencer']))->count(),
        ]);
    }

    // POST /customers/{id}/current-account/pay  — registra un HABER (pago recibido)
    public function storePayment(Request $request, $customerId)
    {
        $request->validate([
            'amount'       => 'required|numeric|min:0.01',
            'concept'      => 'nullable|string|max:255',
            'payment_date' => 'nullable|date',
            'notes'        => 'nullable|string|max:1000',
        ]);

        Customer::findOrFail($customerId);

        return DB::transaction(function () use ($request, $customerId) {
            $lastBalance = CurrentAccount::where('customer_id', $customerId)
                ->orderBy('id', 'desc')
                ->value('balance') ?? 0;

            $newBalance = $lastBalance - $request->amount;

            $payment = CurrentAccount::create([
                'customer_id'  => $customerId,
                'concept'      => $request->concept ?: 'Pago / Recibo a cuenta',
                'debit'        => 0,
                'credit'       => $request->amount,
                'balance'      => $newBalance,
                'payment_date' => $request->payment_date,
                'status'       => 'pagado',
                'notes'        => $request->notes,
            ]);

            return response()->json(['message' => 'Pago registrado con éxito', 'payment' => $payment], 201);
        });
    }

    // POST /customers/{id}/current-account/charge  — registra un DEBE (cargo manual)
    public function storeConcept(Request $request, $customerId)
    {
        $request->validate([
            'amount'           => 'required|numeric|min:0.01',
            'concept'          => 'required|string|max:255',
            'reservation_id'   => 'nullable|exists:reservations,id',
            'service_order_id' => 'nullable|exists:service_orders,id',
            'payment_date'     => 'nullable|date',
            'notes'            => 'nullable|string|max:1000',
        ]);

        Customer::findOrFail($customerId);

        return DB::transaction(function () use ($request, $customerId) {
            $lastBalance = CurrentAccount::where('customer_id', $customerId)
                ->orderBy('id', 'desc')
                ->value('balance') ?? 0;

            $newBalance = $lastBalance + $request->amount;

            $charge = CurrentAccount::create([
                'customer_id'      => $customerId,
                'reservation_id'   => $request->reservation_id,
                'service_order_id' => $request->service_order_id,
                'concept'          => $request->concept,
                'debit'            => $request->amount,
                'credit'           => 0,
                'balance'          => $newBalance,
                'payment_date'     => $request->payment_date,
                'status'           => 'pendiente',
                'notes'            => $request->notes,
            ]);

            return response()->json(['message' => 'Cargo registrado con éxito', 'charge' => $charge], 201);
        });
    }

    // DELETE /customers/{id}/current-account/{movementId}
    public function destroy($customerId, $movementId, CurrentAccountService $ccService)
    {
        $movement = CurrentAccount::where('customer_id', $customerId)
            ->findOrFail($movementId);

        if ($movement->isAutoGenerated()) {
            return response()->json([
                'message' => 'Este movimiento es generado automáticamente. Para eliminarlo, anulá o eliminá la operación de origen.',
            ], 422);
        }

        $movement->delete();
        $ccService->recalculate((int) $customerId);

        return response()->json(['message' => 'Movimiento eliminado']);
    }
}
