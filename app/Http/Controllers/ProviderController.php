<?php

namespace App\Http\Controllers;

use App\Models\Provider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProviderController extends Controller
{
    // Listar todos los proveedores con sus datos
    public function index(Request $request)
    {
        // Traemos el proveedor con todo su árbol de relaciones
        $providers = Provider::with([
            'taxResponsibility', 
            'businessUnit', 
            'addresses.province', // Traemos la dirección y el nombre de la provincia
            'contacts'
        ])->paginate(20);

        return response()->json($providers);
    }

    // Crear un Proveedor (con sus direcciones y contactos opcionales)
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Datos del Proveedor
            'cuit' => 'required|string|unique:providers,cuit',
            'tax_responsibility_id' => 'required|exists:tax_responsibilities,id',
            'business_name' => 'required|string|max:255',
            'iibb' => 'nullable|string|max:255',
            'business_unit_id' => 'required|exists:business_units,id',
            
            // Arrays de direcciones y contactos (opcionales al crear)
            'addresses' => 'nullable|array',
            'addresses.*.street' => 'required|string',
            'addresses.*.number' => 'nullable|integer',
            'addresses.*.floor' => 'nullable|integer',
            'addresses.*.apartment' => 'nullable|string|max:10',
            'addresses.*.zip_code' => 'required|string',
            'addresses.*.province_id' => 'required|exists:provinces,id',

            'contacts' => 'nullable|array',
            'contacts.*.full_name' => 'required|string',
            'contacts.*.phone' => 'nullable|string',
            'contacts.*.email' => 'nullable|email',
            'contacts.*.sector' => 'nullable|string',
            'contacts.*.observations' => 'nullable|string',
        ]);

        // Usamos una transacción para asegurar que todo se guarde bien o nada se guarde
        return DB::transaction(function () use ($validated) {
            
            // 1. Creamos el proveedor base
            $provider = Provider::create([
                'cuit' => $validated['cuit'],
                'tax_responsibility_id' => $validated['tax_responsibility_id'],
                'business_name' => $validated['business_name'],
                'iibb' => $validated['iibb'] ?? null,
                'business_unit_id' => $validated['business_unit_id'],
            ]);

            // 2. Le adjuntamos las direcciones si vinieron en el request
            if (!empty($validated['addresses'])) {
                $provider->addresses()->createMany($validated['addresses']);
            }

            // 3. Le adjuntamos los contactos si vinieron
            if (!empty($validated['contacts'])) {
                $provider->contacts()->createMany($validated['contacts']);
            }

            return response()->json([
                'message' => 'Proveedor creado con éxito',
                // Devolvemos el proveedor recién creado con sus relaciones
                'provider' => $provider->load('addresses.province', 'contacts') 
            ], 201);
        });
    }
}
