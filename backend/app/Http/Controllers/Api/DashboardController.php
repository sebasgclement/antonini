<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DashboardController extends Controller
{
    public function getDolar()
    {
        // Opción A: Valor fijo por ahora para que no de error
        // return response()->json(['blue' => 1200, 'oficial' => 980]);

        // Opción B: Consumir una API real (ej: DolarAPI)
        try {
            $response = Http::get('https://dolarapi.com/v1/dolares/blue');
            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (\Exception $e) {
            // Fallo silencioso
        }

        return response()->json(['compra' => 1200, 'venta' => 1220]);
    }
}