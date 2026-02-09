<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class InfoAutoService
{
    protected $baseUrl = 'https://api.infoauto.com.ar/cars';
    protected $user = 'aptassoni@gmail.com';
    protected $pass = ''; // <--- ACORDATE DE PONER LA CONTRASEÑA NUEVA ACÁ

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
        $token = $this->getToken();

        if (!$token) {
            return null; // Si no hay token (login falló), devolvemos null sin romper nada
        }

        $url = "{$this->baseUrl}/pub/models/{$codia}/prices/";

        try {
            $response = Http::withHeaders($this->headers)
                ->withToken($token)
                ->withoutVerifying()
                ->get($url);

            // Si el token venció (401), reintentamos una vez más
            if ($response->status() === 401) {
                Cache::forget('infoauto_token');
                $token = $this->login();
                
                if ($token) {
                    $response = Http::withHeaders($this->headers)
                        ->withToken($token)
                        ->withoutVerifying()
                        ->get($url);
                }
            }

            if ($response->successful()) {
                return $response->json();
            }

            // ACÁ ESTÁ EL CAMBIO CLAVE:
            // Si da 403 (Cupo Agotado) o 404 (No existe), devolvemos NULL.
            // No tiramos Exception para no romper la vista del usuario.
            return null;

        } catch (\Exception $e) {
            // Si falla la conexión (internet, dns, etc), logueamos y devolvemos null
            Log::error("InfoAuto Conexión Error: " . $e->getMessage());
            return null;
        }
    }
}