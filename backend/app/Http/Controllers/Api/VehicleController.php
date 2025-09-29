<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;   // 👈 Importá el base Controller
use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    // GET /vehicles
    public function index(Request $req)
    {
        $q = Vehicle::query()->with('customer');

        if ($search = $req->get('search')) {
            $q->where(function($sub) use ($search) {
                $sub->where('brand', 'like', "%$search%")
                    ->orWhere('model', 'like', "%$search%")
                    ->orWhere('plate', 'like', "%$search%")
                    ->orWhere('vin', 'like', "%$search%");
            });
        }

        $vehicles = $q->paginate(10);

        return response()->json([
            'ok'   => true,
            'data' => $vehicles
        ]);
    }

    // GET /vehicles/{id}
    public function show(Vehicle $vehicle)
    {
        return response()->json([
            'ok'   => true,
            'data' => $vehicle->load('customer', 'expenses')
        ]);
    }

    // POST /vehicles
    public function store(Request $req)
    {
        $data = $req->validate([
            'brand'           => 'required|string',
            'model'           => 'required|string',
            'year'            => 'nullable|integer',
            'plate'           => 'required|string|unique:vehicles,plate',
            'vin'             => 'nullable|string',
            'color'           => 'nullable|string',
            'km'              => 'nullable|integer',
            'fuel_level'      => 'nullable|integer|min:0|max:100',
            'ownership'       => 'required|in:propio,consignado',
            'customer_id'     => 'nullable|exists:customers,id',
            'reference_price' => 'nullable|numeric',
            'price'           => 'nullable|numeric',
            'status'          => 'in:disponible,reservado,vendido',
            'check_spare'     => 'boolean',
            'check_jack'      => 'boolean',
            'check_docs'      => 'boolean',
            'notes'           => 'nullable|string',
        ]);

        $vehicle = Vehicle::create($data);

        return response()->json([
            'ok'   => true,
            'data' => $vehicle->load('customer')
        ], 201);
    }

    // PUT /vehicles/{id}
    public function update(Request $req, Vehicle $vehicle)
    {
        $data = $req->validate([
            'brand'           => 'sometimes|string',
            'model'           => 'sometimes|string',
            'year'            => 'nullable|integer',
            'plate'           => 'sometimes|string|unique:vehicles,plate,' . $vehicle->id,
            'vin'             => 'nullable|string',
            'color'           => 'nullable|string',
            'km'              => 'nullable|integer',
            'fuel_level'      => 'nullable|integer|min:0|max:100',
            'ownership'       => 'in:propio,consignado',
            'customer_id'     => 'nullable|exists:customers,id',
            'reference_price' => 'nullable|numeric',
            'price'           => 'nullable|numeric',
            'status'          => 'in:disponible,reservado,vendido',
            'check_spare'     => 'boolean',
            'check_jack'      => 'boolean',
            'check_docs'      => 'boolean',
            'notes'           => 'nullable|string',
        ]);

        $vehicle->update($data);

        return response()->json([
            'ok'   => true,
            'data' => $vehicle->load('customer')
        ]);
    }

    // DELETE /vehicles/{id}
    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return response()->json([
            'ok' => true
        ]);
    }
}
