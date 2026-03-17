<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CurrentAccount;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

class CurrentAccountController extends Controller
{
    // 1. TRAER EL HISTORIAL DEL CLIENTE
    public function index($customerId)
    {
        // Validamos que el cliente exista
        $customer = Customer::findOrFail($customerId);

        // Traemos todos sus movimientos, ordenados del más nuevo al más viejo
        $movements = CurrentAccount::where('customer_id', $customerId)
                                   ->with('invoice') // Traemos la info de la factura por si la necesitamos
                                   ->orderBy('created_at', 'desc')
                                   ->get();

        // El saldo actual es el balance del último movimiento (el primero en nuestra lista ordenada por desc)
        $currentBalance = $movements->first() ? $movements->first()->balance : 0;

        return response()->json([
            'customer_name'   => $customer->first_name . ' ' . $customer->last_name,
            'current_balance' => $currentBalance,
            'movements'       => $movements
        ]);
    }

    // 2. REGISTRAR UN PAGO (RECIBO)
    public function storePayment(Request $request, $customerId)
    {
        $request->validate([
            'amount'  => 'required|numeric|min:0.01',
            'concept' => 'nullable|string|max:255',
        ]);

        $customer = Customer::findOrFail($customerId);

        try {
            return DB::transaction(function () use ($request, $customerId) {
                
                // Buscamos el último saldo
                $lastMovement = CurrentAccount::where('customer_id', $customerId)
                                              ->orderBy('id', 'desc')
                                              ->first();
                
                $previousBalance = $lastMovement ? $lastMovement->balance : 0;
                
                // Como nos están PAGANDO, la deuda BAJA (-)
                // Ej: Debía $1000. Pagó $600. Nuevo Saldo = $1000 - $600 = $400.
                $newBalance = $previousBalance - $request->amount;

                // Creamos el movimiento
                $payment = CurrentAccount::create([
                    'customer_id' => $customerId,
                    'invoice_id'  => null, // Es un pago suelto, no una factura
                    'concept'     => $request->concept ?: 'Pago / Recibo a cuenta',
                    'debit'       => 0, // No suma deuda
                    'credit'      => $request->amount, // HABER: Lo que nos pagó
                    'balance'     => $newBalance,
                ]);

                return response()->json([
                    'message' => '✅ Pago registrado con éxito',
                    'payment' => $payment
                ], 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'message' => '❌ Error al registrar el pago',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}