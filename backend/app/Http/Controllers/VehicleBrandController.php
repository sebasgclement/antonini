<?php

// app/Http/Controllers/VehicleBrandController.php
namespace App\Http\Controllers;

use App\Models\VehicleBrand;
use Illuminate\Http\Request;

class VehicleBrandController extends Controller
{
    public function index()
    {
        return response()->json(VehicleBrand::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100|unique:vehicle_brands,name']);
        $brand = VehicleBrand::create(['name' => $request->name]);
        return response()->json($brand, 201);
    }

    public function update(Request $request, VehicleBrand $brand)
    {
        $request->validate(['name' => 'required|string|max:100|unique:vehicle_brands,name,' . $brand->id]);
        $brand->update(['name' => $request->name]);
        return response()->json($brand);
    }

    public function destroy(VehicleBrand $brand)
    {
        $brand->update(['active' => false]); // baja lógica
        return response()->json(['ok' => true]);
    }
}
