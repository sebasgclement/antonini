<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\InfoAutoBrand;
use App\Models\InfoAutoModel; // <--- Importante: Agregamos el modelo
use Illuminate\Support\Facades\Log;

class InfoAutoController extends Controller
{
    public function getBrands()
    {
        // Esto muestra las marcas y sus grupos desde TU base de datos
        // Los grupos vendrán con los IDs "compuestos" (ej: 1250004)
        $brands = InfoAutoBrand::with(['groups' => function($query) {
            $query->orderBy('name', 'asc');
        }])
        ->orderBy('name', 'asc')
        ->get();

        return response()->json($brands);
    }

    public function getModels($brandId, $groupId)
    {
        // Log para ver qué está pidiendo el front
        Log::info("Consulta local DB: Brand {$brandId}, Group {$groupId}");

        // --- CONSULTA SQL LOCAL ---
        // Buscamos en la tabla que se está llenando ahora mismo.
        // Nota: El $groupId que llega aquí DEBE ser el ID "largo" (ej: 5000001)
        // que el frontend obtuvo al llamar a getBrands().
        
        $models = InfoAutoModel::where('brand_id', $brandId)
                    ->where('group_id', $groupId)
                    ->orderBy('description', 'asc') // Ordenamos alfabéticamente
                    ->get();
        
        // Si no hay modelos, devolvemos array vacío (JSON válido)
        return response()->json($models);
    }
}