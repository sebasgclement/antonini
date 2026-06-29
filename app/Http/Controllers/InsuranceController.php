<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\InsurancePayment;
use App\Models\ServiceOrder;
use Illuminate\Http\Request;

class InsuranceController extends Controller
{
    public function siniestros(Request $request)
    {
        $query = ServiceOrder::with(['vehicle', 'customer', 'insurer', 'insurancePayments'])
            ->where('type', 'insurance')
            ->orderByDesc('created_at');

        if ($request->filled('insurer_id')) {
            $query->where('insurer_id', $request->insurer_id);
        }

        $orders = $query->get()->map(fn ($o) => $this->formatSiniestro($o));

        if ($request->filled('status')) {
            $orders = $orders->filter(fn ($o) => $o['insurance_status'] === $request->status)->values();
        }

        return response()->json(['data' => $orders]);
    }

    public function overdueCount()
    {
        $count = ServiceOrder::with('insurancePayments')
            ->where('type', 'insurance')
            ->whereNotNull('insurance_due_date')
            ->where('insurance_due_date', '<', now()->toDateString())
            ->get()
            ->filter(fn ($o) => (float) $o->total > (float) $o->insurancePayments->sum('amount'))
            ->count();

        return response()->json(['count' => $count]);
    }

    public function insurers()
    {
        $insurers = Customer::where('is_insurer', true)
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'phone', 'email']);

        return response()->json(['data' => $insurers]);
    }

    public function storeInsurer(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'phone'      => 'nullable|string|max:50',
            'email'      => 'nullable|email|max:255',
        ]);

        $data['is_insurer'] = true;
        $insurer = Customer::create($data);

        return response()->json(['message' => 'Aseguradora registrada', 'data' => $insurer], 201);
    }

    public function storePayment(Request $request, ServiceOrder $order)
    {
        $data = $request->validate([
            'amount'       => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'notes'        => 'nullable|string',
        ]);

        $payment = $order->insurancePayments()->create($data);

        return response()->json(['message' => 'Pago registrado', 'data' => $payment], 201);
    }

    public function deletePayment(ServiceOrder $order, InsurancePayment $payment)
    {
        if ($payment->service_order_id !== $order->id) {
            return response()->json(['message' => 'No encontrado'], 404);
        }

        $payment->delete();

        return response()->json(['message' => 'Pago eliminado']);
    }

    private function formatSiniestro(ServiceOrder $order): array
    {
        $paidTotal = (float) $order->insurancePayments->sum('amount');
        $balance   = (float) $order->total - $paidTotal;
        $dueDate   = $order->insurance_due_date; // string Y-m-d or null

        if ($balance <= 0) {
            $status = 'pagado';
        } elseif ($dueDate && $dueDate < now()->toDateString()) {
            $status = 'vencido';
        } else {
            $status = 'pendiente';
        }

        return [
            ...$order->toArray(),
            'paid_total'       => $paidTotal,
            'balance'          => max(0, $balance),
            'insurance_status' => $status,
        ];
    }
}
