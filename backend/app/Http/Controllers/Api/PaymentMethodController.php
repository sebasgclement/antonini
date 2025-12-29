<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    // =========================
    // GET /payment-methods
    // =========================
    public function index()
    {
        $methods = PaymentMethod::orderBy('id')->get();
        return response()->json([
            'ok' => true,
            'data' => $methods,
        ]);
    }

    // =========================
    // GET /payment-methods/{id}
    // =========================
    public function show(PaymentMethod $paymentMethod)
    {
        return response()->json([
            'ok' => true,
            'data' => $paymentMethod,
        ]);
    }

    // =========================
    // POST /payment-methods
    // =========================
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100|unique:payment_methods,name',
            'type' => 'required|in:cash,bank,check,card,credit_bank',
            'requires_details' => 'boolean',
        ]);

        $method = PaymentMethod::create($data);

        return response()->json([
            'ok' => true,
            'message' => 'Método de pago creado correctamente',
            'data' => $method,
        ], 201);
    }

    // =========================
    // PUT /payment-methods/{id}
    // =========================
    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:100|unique:payment_methods,name,' . $paymentMethod->id,
            'type' => 'sometimes|in:cash,bank,check,card,credit_bank',
            'requires_details' => 'boolean',
        ]);

        $paymentMethod->update($data);

        return response()->json([
            'ok' => true,
            'message' => 'Método de pago actualizado correctamente',
            'data' => $paymentMethod,
        ]);
    }

    // =========================
    // DELETE /payment-methods/{id}
    // =========================
    public function destroy(PaymentMethod $paymentMethod)
    {
        $paymentMethod->delete();

        return response()->json([
            'ok' => true,
            'message' => 'Método de pago eliminado correctamente',
        ]);
    }
}
