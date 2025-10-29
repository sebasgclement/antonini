<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VehicleController extends Controller
{
    // GET /vehicles
    public function index(Request $req)
    {
        $q = Vehicle::query()->with('customer');

        if ($search = $req->get('search')) {
            $q->where(function ($sub) use ($search) {
                $sub->where('brand', 'like', "%$search%")
                    ->orWhere('model', 'like', "%$search%")
                    ->orWhere('plate', 'like', "%$search%")
                    ->orWhere('vin', 'like', "%$search%");
            });
        }

        $vehicles = $q->latest()->paginate(10);

        return response()->json(['ok' => true, 'data' => $vehicles]);
    }

    // GET /vehicles/{id}
    public function show(Vehicle $vehicle)
    {
        // 🔹 Añadir URLs absolutas a las fotos
        foreach (['front', 'back', 'left', 'right'] as $side) {
            $key = "photo_{$side}";
            $vehicle->{$key . '_url'} = $vehicle->{$key}
                ? asset('storage/' . $vehicle->{$key})
                : null;
        }

        return response()->json([
            'ok' => true,
            'data' => $vehicle->load('customer', 'expenses'),
        ]);
    }

    // POST /vehicles
public function store(Request $req)
{
    $data = $req->validate([
        'brand' => 'required|string',
        'model' => 'required|string',
        'year' => 'nullable|integer',
        'plate' => 'required|string|unique:vehicles,plate',
        'vin' => 'nullable|string',
        'color' => 'nullable|string',
        'km' => 'nullable|integer',
        'fuel_type' => 'nullable|string|max:50', // ✅ nuevo campo
        'ownership' => 'required|in:propio,consignado',
        'customer_id' => 'nullable|exists:customers,id',
        'reference_price' => 'nullable|numeric',
        'price' => 'nullable|numeric',
        'status' => 'in:disponible,reservado,vendido',
        'check_spare' => 'boolean',
        'check_jack' => 'boolean',
        'check_docs' => 'boolean',
        'notes' => 'nullable|string',

        'photo_front' => 'nullable|image|max:4096',
        'photo_back' => 'nullable|image|max:4096',
        'photo_left' => 'nullable|image|max:4096',
        'photo_right' => 'nullable|image|max:4096',
    ]);

    // Guardar imágenes
    foreach (['front', 'back', 'left', 'right'] as $side) {
        $key = "photo_{$side}";
        if ($req->hasFile($key)) {
            $data[$key] = $req->file($key)->store('vehicles', 'public');
        }
    }

    $vehicle = Vehicle::create($data);

    return response()->json([
        'ok' => true,
        'data' => $vehicle->load('customer'),
    ], 201);
}


// PUT /vehicles/{id}
public function update(Request $req, Vehicle $vehicle)
{
    $data = $req->validate([
        'brand' => 'sometimes|string',
        'model' => 'sometimes|string',
        'year' => 'nullable|integer',
        'plate' => 'sometimes|string|unique:vehicles,plate,' . $vehicle->id,
        'vin' => 'nullable|string',
        'color' => 'nullable|string',
        'km' => 'nullable|integer',
        'fuel_type' => 'nullable|string|max:50', // ✅ reemplaza fuel_level
        'ownership' => 'in:propio,consignado',
        'customer_id' => 'nullable|exists:customers,id',
        'reference_price' => 'nullable|numeric',
        'price' => 'nullable|numeric',
        'status' => 'in:disponible,reservado,vendido',
        'check_spare' => 'boolean',
        'check_jack' => 'boolean',
        'check_docs' => 'boolean',
        'notes' => 'nullable|string',

        'photo_front' => 'nullable|image|max:4096',
        'photo_back' => 'nullable|image|max:4096',
        'photo_left' => 'nullable|image|max:4096',
        'photo_right' => 'nullable|image|max:4096',
    ]);

    // 🧩 Si intenta devolver el vehículo (reservado → disponible)
    if (($req->status ?? null) === 'disponible' && $vehicle->status === 'reservado') {
        $pendientes = $vehicle->expenses()->where('status', 'no_pagado')->count();

        if ($pendientes > 0) {
            return response()->json([
                'ok' => false,
                'message' => "No se puede devolver el vehículo: hay $pendientes gasto(s) de taller sin pagar.",
            ], 422);
        }
    }

    // 📸 Manejo de imágenes (igual que antes)
    foreach (['front', 'back', 'left', 'right'] as $side) {
        $key = "photo_{$side}";
        if ($req->has("delete_photo_{$side}")) {
            Storage::disk('public')->delete($vehicle->{$key});
            $vehicle->{$key} = null;
        }

        if ($req->hasFile($key)) {
            if ($vehicle->{$key}) {
                Storage::disk('public')->delete($vehicle->{$key});
            }
            $data[$key] = $req->file($key)->store('vehicles', 'public');
        }
    }

    $vehicle->update($data);

    return response()->json([
        'ok' => true,
        'data' => $vehicle->load('customer', 'expenses'),
    ]);
}



    // DELETE /vehicles/{id}
    public function destroy(Vehicle $vehicle)
    {
        // 🧹 Eliminar fotos si existen
        foreach (['front', 'back', 'left', 'right'] as $side) {
            $key = "photo_{$side}";
            if ($vehicle->{$key}) {
                Storage::disk('public')->delete($vehicle->{$key});
            }
        }

        $vehicle->delete();

        return response()->json(['ok' => true]);
    }
}
