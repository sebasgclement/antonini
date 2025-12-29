<?php
// app/Http/Controllers/Api/VehicleExpenseController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleExpense;
use Illuminate\Http\Request;

class VehicleExpenseController extends Controller
{
    public function index(Vehicle $vehicle)
    {
        return response()->json([
            'ok' => true,
            'data' => $vehicle->expenses()->orderByDesc('date')->get(),
        ]);
    }

    public function store(Request $req, Vehicle $vehicle)
    {
        $data = $req->validate([
            'description' => 'required|string',
            'amount'      => 'required|numeric|min:0',
            'date'        => 'required|date',
            'status'      => 'in:pagado,no_pagado', // ✅ nuevo
        ]);

        if (!isset($data['status'])) {
            $data['status'] = 'no_pagado';
        }

        $expense = $vehicle->expenses()->create($data);

        return response()->json(['ok' => true, 'data' => $expense], 201);
    }

    public function update(Request $req, Vehicle $vehicle, VehicleExpense $expense)
    {
        if ($expense->vehicle_id !== $vehicle->id) {
            return response()->json(['ok' => false, 'message' => 'El gasto no pertenece a este vehículo'], 403);
        }

        $data = $req->validate([
            'status' => 'required|in:pagado,no_pagado',
        ]);

        $expense->update($data);

        return response()->json(['ok' => true, 'data' => $expense]);
    }

    public function destroy(Vehicle $vehicle, VehicleExpense $expense)
    {
        if ($expense->vehicle_id !== $vehicle->id) {
            return response()->json(['ok'=>false,'message'=>'El gasto no pertenece a este vehículo'],403);
        }
        $expense->delete();
        return response()->json(['ok'=>true]);
    }
}

