<?php

namespace App\Http\Controllers;

use App\Models\PriceList;
use Illuminate\Http\Request;

class PriceListController extends Controller
{
    // Trae las listas (filtradas por proveedor si se lo pasamos)
    public function index(Request $request)
    {
        $query = PriceList::query();
        
        if ($request->has('provider_id') && $request->provider_id != '') {
            
            $query->where('provider_id', $request->provider_id)
                  ->orWhereNull('provider_id');
        }

        return response()->json($query->get());
    }

    // Crea una nueva lista
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'provider_id' => 'nullable|exists:providers,id'
        ]);

        $priceList = PriceList::create($validated);

        return response()->json([
            'message' => 'Lista creada con éxito', 
            'data' => $priceList
        ], 201);
    }
}