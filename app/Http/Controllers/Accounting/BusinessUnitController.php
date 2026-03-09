<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\BusinessUnit;
use Illuminate\Http\Request;

class BusinessUnitController extends Controller
{
    public function index()
    {
        // Traemos todas las unidades de negocio
        return response()->json(BusinessUnit::orderBy('name')->get());
    }

    public function store(Request $request)
{
    $validated = $request->validate([
        'name'           => 'required|string|max:255',
        'reason_social'  => 'required|string|max:255',
        'cuit'           => 'required|string|max:20',
        'tax_condition'  => 'nullable|string',
        'iibb'           => 'nullable|string',
        'address'        => 'nullable|string',
        'city'           => 'nullable|string',
        'province'       => 'nullable|string',
        'zip_code'       => 'nullable|string',
        'start_date'     => 'nullable|date',  
        'logo'           => 'nullable|string',
    ]);

    // Esto ahora lleva todos los campos, incluso los null
    $unit = BusinessUnit::create($validated);

    return response()->json($unit, 201);
}
}