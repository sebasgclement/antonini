<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class InfoAutoService
{
    protected $baseUrl = 'https://api.infoauto.com.ar/cars';
    protected $user = 'aptassoni@gmail.com'; // tu usuario
    protected $pass = 'oPOeKOtj2s2BRFRR';   // tu contraseña

    protected $headers = [
        'User-Agent' => 'AntoniniApp/1.0',
        'Accept'     => 'application/json',
    ];

    public function getToken()
    {
        if (Cache::has('infoauto_access_token')) {
            return Cache::get('infoauto_access_token');
        }

        if (Cache::has('infoauto_refresh_token')) {
            Log::info("InfoAuto: Renovando Access Token usando Refresh Token...");
            $newToken = $this->refreshToken(Cache::get('infoauto_refresh_token'));
            if ($newToken) {
                return $newToken;
            }
        }

        Log::info("InfoAuto: Tokens vencidos o inexistentes. Haciendo login completo...");
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
                $data = $response->json();

                Cache::put('infoauto_access_token', $data['access_token'], now()->addMinutes(55));
                if (isset($data['refresh_token'])) {
                    Cache::put('infoauto_refresh_token', $data['refresh_token'], now()->addHours(23));
                }

                return $data['access_token'];
            }

            Log::error("InfoAuto Login Error: " . $response->body());
        } catch (\Exception $e) {
            Log::error("InfoAuto Login Exception: " . $e->getMessage());
        }

        return null;
    }

    protected function refreshToken($refreshToken)
    {
        try {
            $response = Http::withHeaders($this->headers)
                ->withToken($refreshToken)
                ->withoutVerifying()
                ->post("{$this->baseUrl}/auth/refresh");

            if ($response->successful()) {
                $data = $response->json();

                Cache::put('infoauto_access_token', $data['access_token'], now()->addMinutes(55));
                if (isset($data['refresh_token'])) {
                    Cache::put('infoauto_refresh_token', $data['refresh_token'], now()->addHours(23));
                }

                return $data['access_token'];
            }

            Log::error("InfoAuto Refresh Error: " . $response->body());
        } catch (\Exception $e) {
            Log::error("InfoAuto Refresh Exception: " . $e->getMessage());
        }

        return null;
    }

    public function getPrecioEnVivo($codia)
    {
        $cacheKey = "infoauto_price_{$codia}";

        if (Cache::has($cacheKey)) {
            Log::debug("AHORRO: Usando precio cacheado para CODIA {$codia}");
            return Cache::get($cacheKey);
        }

        $token = $this->getToken();
        if (!$token) {
            return null;
        }

        Log::info("Consulta puntual a InfoAuto API por CODIA {$codia}");

        $url = "{$this->baseUrl}/pub/models/{$codia}/prices/";

        try {
            $response = Http::withHeaders($this->headers)
                ->withToken($token)
                ->withoutVerifying()
                ->get($url);

            if ($response->status() === 401) {
                Cache::forget('infoauto_access_token');
                Cache::forget('infoauto_refresh_token');
                $token = $this->getToken();

                if ($token) {
                    $response = Http::withHeaders($this->headers)
                        ->withToken($token)
                        ->withoutVerifying()
                        ->get($url);
                }
            }

            if ($response->successful()) {
    $json = $response->json();

    // Si la respuesta es un array de precios, lo usamos directamente
    if (isset($json[0]['year']) && isset($json[0]['price'])) {
        $precioData = [
            'list_price' => null,
            'prices'     => $json
        ];
    } else {
        // Caso alternativo: estructura con data
        $datos = $json['data'] ?? $json;
        $precioData = [
            'list_price' => $datos['list_price'] ?? null,
            'prices'     => $datos['prices'] ?? []
        ];
    }

    Cache::put($cacheKey, $precioData, now()->addHours(1));
    return $precioData;
}


            Log::warning("InfoAuto Precio falló para CODIA {$codia}: Status " . $response->status());
        } catch (\Exception $e) {
            Log::error("InfoAuto Conexión Error: " . $e->getMessage());
        }

        return null;
    }
}
