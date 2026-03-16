<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // Listar productos (con filtros y paginación)
    public function index(Request $request)
    {
        $query = Product::with(['businessUnit', 'iva', 'accountingAccount', 'provider']);

        // Filtro por tipo (producto o servicio)
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filtro por unidad de negocio
        if ($request->filled('business_unit_id')) {
            $query->where('business_unit_id', $request->business_unit_id);
        }

        // Búsqueda por descripción o código
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'LIKE', "%{$search}%")
                  ->orWhere('manufacturer_code', 'LIKE', "%{$search}%");
            });
        }

        $products = $query->orderBy('description', 'asc')->paginate(20);

        return response()->json($products);
    }

    // Crear un nuevo producto o servicio
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:product,service',
            'business_unit_id' => 'required|exists:business_units,id',
            'description' => 'required|string|max:255',
            'manufacturer_code' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'cost' => 'required|numeric|min:0',
            'multiplier_factor' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'iva_id' => 'required|exists:ivas,id',
            'accounting_account_id' => 'required|exists:accounting_accounts,id',
            'provider_id' => 'nullable|exists:providers,id',
            // Si es producto, pedimos cantidad. Si es servicio, lo dejamos pasar vacio.
            'quantity' => 'required_if:type,product|nullable|integer|min:0',
            'reorder_point' => 'required_if:type,product|nullable|integer|min:0',
        ]);

        $product = Product::create($validated);

        return response()->json([
            'message' => 'Creado correctamente',
            'product' => $product
        ], 201);
    }

    // 👈 NUEVO: Mostrar un producto específico para editarlo
    public function show($id)
    {
        $product = Product::findOrFail($id);
        
        return response()->json($product);
    }

    // 👈 NUEVO: Actualizar un producto existente
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Reutilizamos tus mismas reglas de validación
        $validated = $request->validate([
            'type' => 'required|in:product,service',
            'business_unit_id' => 'required|exists:business_units,id',
            'description' => 'required|string|max:255',
            'manufacturer_code' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'cost' => 'required|numeric|min:0',
            'multiplier_factor' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'iva_id' => 'required|exists:ivas,id',
            'accounting_account_id' => 'required|exists:accounting_accounts,id',
            'provider_id' => 'nullable|exists:providers,id',
            'quantity' => 'required_if:type,product|nullable|integer|min:0',
            'reorder_point' => 'required_if:type,product|nullable|integer|min:0',
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Actualizado correctamente',
            'product' => $product
        ]);
    }
}