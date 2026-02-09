<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use App\Services\InfoAutoService;

Route::get('/', function () {
    return view('welcome');
});



Route::get('/debug-infoauto', function (InfoAutoService $service) {
    // 1. Conseguimos token
    $token = $service->getAccessToken();

    // 2. Buscamos un grupo real que sepamos que existe (ej: Toyota Corolla o similar)
    // Usaremos IDs hardcodeados de ejemplo. Si estos fallan, probá con otros de tu DB.
    // Marca 5 (Ford), Grupo 1 (Fiesta) - O el que tengas a mano.
    // O mejor, buscamos el primer grupo de la base de datos para usar sus IDs reales:
    $group = \App\Models\InfoAutoGroup::first(); 
    
    if (!$group) return "No hay grupos en la base de datos para probar.";

    // Recuperamos el ID original (recordá el truco matemático)
    $originalGroupId = $group->id % 1000000; 

    $url = "https://api.infoauto.com.ar/cars/pub/brands/{$group->brand_id}/groups/{$originalGroupId}/models/";

    $response = Http::withToken($token)->get($url);

    // 3. Imprimimos la respuesta CRUDA para ver la estructura
    return $response->json();
});

Route::get('/prueba-infoauto', function (InfoAutoService $service) {
    try {
        // Probamos con el Fiat Palio (1056)
        $resultado = $service->getModelPrices(1056);
        
        return response()->json([
            'estado' => 'EXITO',
            'datos' => $resultado
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'estado' => 'ERROR',
            'mensaje' => $e->getMessage()
        ], 500);
    }
});