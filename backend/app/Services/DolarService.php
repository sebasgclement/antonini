<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class DolarService
{
    public function getBlue()
    {
        // Cacheamos por 15 minutos (900 segundos)
        return Cache::remember('dolar_blue_rate', 900, function () {
            try {
                // Opción A: DolarAPI (La mejor hoy)
                $response = Http::withoutVerifying() // Solo si estás en local
                    ->get('https://dolarapi.com/v1/dolares/blue');

                if ($response->successful()) {
                    return $response->json(); 
                    // Retorna: { "compra": 980, "venta": 1000, ... }
                }
            } catch (\Exception $e) {
                // Si falla, devolvemos null o un valor de emergencia
                return null;
            }
            return null;
        });
    }
}