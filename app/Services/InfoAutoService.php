<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class InfoAutoService
{
    protected $baseUrl = 'https://api.infoauto.com.ar/cars';
    protected $user = 'aptassoni@gmail.com';
    protected $pass = 'oPOeKOtj2s2BRFRR';

    // Headers para simular ser un navegador
    protected $headers = [
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept' => 'application/json',
    ];

    public function getToken()
    {
        // Cacheamos el token un poco menos de 1 hora (50 min)
        if (Cache::has('infoauto_token')) {
            return Cache::get('infoauto_token');
        }
        return $this->login();
    }

    protected function login()
    {
        try {
            $response = Http::withHeaders($this->headers)
                ->withBasicAuth($this->user, $this->pass)
                ->withoutVerifying()
                ->post("{$this->baseUrl}/auth/login");

            if ($response->successful()) {
                $token = $response->json()['access_token'];
                Cache::put('infoauto_token', $token, now()->addMinutes(50));
                return $token;
            }
        } catch (\Exception $e) {
            Log::error("InfoAuto Login Error: " . $e->getMessage());
            return null;
        }

        return null;
    }

    // Le cambié el nombre a "getPrecioEnVivo" para que sepas que este va directo a la API
    public function getPrecioEnVivo($codia)
    {
        // =================================================================
        // 🛡️ CAPA 1: CACHÉ DE PRECIOS (AHORRO DE DINERO)
        // =================================================================
        // Si ya pedimos este precio hoy, no lo volvemos a pedir.
        // La clave es única por código de auto (ej: 'price_01523').
        $cacheKey = "infoauto_price_{$codia}";

        if (Cache::has($cacheKey)) {
            // Logueamos en 'debug' para saber que se usó la memoria (GRATIS)
            Log::debug("💰 AHORRO: Usando precio en memoria para: {$codia}");
            return Cache::get($cacheKey);
        }

        // =================================================================
        // 🚦 SI LLEGAMOS ACÁ, VAMOS A GASTAR CRÉDITO
        // =================================================================
        
        $token = $this->getToken();

        if (!$token) {
            return null; 
        }

        // 🚨 ALARMA DE GASTO 🚨
        // Esto escribirá en tu log cada vez que InfoAuto te cobre
        Log::alert("💸 PAGANDO: Saliendo a InfoAuto API por el auto: {$codia}");

        $url = "{$this->baseUrl}/pub/models/{$codia}/prices/";

        try {
            $response = Http::withHeaders($this->headers)
                ->withToken($token)
                ->withoutVerifying()
                ->get($url);

            // Reintento por token vencido
            if ($response->status() === 401) {
                Cache::forget('infoauto_token');
                $token = $this->login();
                if ($token) {
                    Log::alert("💸 PAGANDO (Reintento): Saliendo a InfoAuto API por el auto: {$codia}");
                    $response = Http::withHeaders($this->headers)
                        ->withToken($token)
                        ->withoutVerifying()
                        ->get($url);
                }
            }

            if ($response->successful()) {
                $datos = $response->json();

                // =============================================================
                // 💾 GUARDAMOS EN CACHÉ POR 24 HORAS
                // =============================================================
                // Si el usuario vuelve a consultar este auto mañana, pagamos de nuevo.
                // Pero si lo consulta hoy 50 veces, pagamos solo 1.
                Cache::put($cacheKey, $datos, now()->addHours(24));

                return $datos;
            }

            // Errores de cliente (404, 403, etc)
            Log::warning("InfoAuto falló para {$codia}: Status " . $response->status());
            return null;

        } catch (\Exception $e) {
            Log::error("InfoAuto Conexión Error: " . $e->getMessage());
            return null;
        }
    }
}