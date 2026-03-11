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
        $token = $this->getToken();
        if (!$token) return null;

        $codia = trim($codia);
        $resultado = [
            'usados' => [],
            'cero_km' => null
        ];

        // 1. Usados: LA URL EXACTA DE TU POSTMAN (Con la barra al final)
        $urlUsados = "https://api.infoauto.com.ar/cars/pub/models/{$codia}/prices/"; 
        
        $respUsados = \Illuminate\Support\Facades\Http::withHeaders($this->headers)
            ->withToken($token)
            ->withoutVerifying()
            ->get($urlUsados);

        if ($respUsados->successful()) {
            $dataUsados = $respUsados->json();
            $resultado['usados'] = isset($dataUsados['data']) ? $dataUsados['data'] : (is_array($dataUsados) ? $dataUsados : []);
        } else {
            \Illuminate\Support\Facades\Log::error("InfoAuto 404 en Usados CODIA {$codia}");
        }

        // 2. 0KM: Estructura idéntica (Con la barra al final)
        $urlCeroKm = "https://api.infoauto.com.ar/cars/pub/models/{$codia}/list_price/";
        
        $respCeroKm = \Illuminate\Support\Facades\Http::withHeaders($this->headers)
            ->withToken($token)
            ->withoutVerifying()
            ->get($urlCeroKm);

        if ($respCeroKm->successful()) {
            $dataCeroKm = $respCeroKm->json();
            $resultado['cero_km'] = isset($dataCeroKm['data']) ? $dataCeroKm['data'] : $dataCeroKm;
        }

        return $resultado;
    }
}
