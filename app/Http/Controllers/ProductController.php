<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductPrice; // <-- IMPORTANTE: Agregamos esto
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    // Listar productos (con filtros y paginación)
    public function index(Request $request)
    {
        // IMPORTANTE: Le decimos select('products.*') para que no pierda las columnas base 
        // cuando le inyectemos el precio personalizado más abajo.
        $query = Product::with(['businessUnit', 'iva', 'accountingAccount', 'provider'])
                        ->select('products.*');

        // Filtro por tipo (producto o servicio)
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filtro por unidad de negocio
        if ($request->filled('business_unit_id')) {
            $query->where('business_unit_id', $request->business_unit_id);
        }

        // Filtro por proveedor
        if ($request->filled('provider_id')) {
            $query->where('provider_id', $request->provider_id);
        }

        // --- MAGIA: FILTRO POR LISTA DE PRECIOS ---
        if ($request->filled('price_list_id')) {
            $priceListId = $request->price_list_id;

            // Obligamos a que SOLO traiga productos de esta lista
            $query->whereExists(function ($q) use ($priceListId) {
                $q->select(DB::raw(1))
                  ->from('product_prices')
                  ->whereColumn('product_prices.product_id', 'products.id')
                  ->where('product_prices.price_list_id', $priceListId);
            });

            // Traemos ese precio en específico
            $query->addSelect([
                'custom_price' => ProductPrice::select('price')
                    ->whereColumn('product_id', 'products.id')
                    ->where('price_list_id', $priceListId)
                    ->take(1)
            ]);
        } else {
            // NUEVO: Si no se filtró por lista, traemos por defecto el precio 
            // de la lista más antigua (que generalmente es el Precio Base de la Lista 1)
            // para evitar que el catálogo muestre $0.
            $query->addSelect([
                'custom_price' => ProductPrice::select('price')
                    ->whereColumn('product_id', 'products.id')
                    ->orderBy('price_list_id', 'asc') 
                    ->take(1)
            ]);
        }
        // ------------------------------------------
        // ------------------------------------------

        // Búsqueda por descripción o código
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'LIKE', "%{$search}%")
                  ->orWhere('manufacturer_code', 'LIKE', "%{$search}%")
                  ->orWhere('eurocode', 'LIKE', "%{$search}%")
                  ->orWhere('nags', 'LIKE', "%{$search}%");
            });
        }

        // Si piden "all", devolvemos todo sin paginar
        if ($request->boolean('all')) {
            $products = $query->orderBy('description', 'asc')->get();
            return response()->json($products);
        }

        // Paginación
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

    public function show($id)
    {
        $product = Product::findOrFail($id);
        
        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

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