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

    /**
     * Obtiene el Token de acceso (Cacheado por 50 min)
     */
    public function getAccessToken()
    {
        return Cache::remember('infoauto_access_token', 3000, function () {
            $response = Http::withBasicAuth($this->user, $this->pass)
                ->post("{$this->baseUrl}/auth/login");

            if ($response->failed()) {
                Log::error("InfoAuto Login Falló: " . $response->body());
                throw new \Exception("No se pudo loguear en InfoAuto");
            }

            return $response->json()['access_token'];
        });
    }

    /**
     * ESTE ES EL MÉTODO QUE TE FALTABA
     * Descarga la estructura completa de Marcas y Grupos
     */
    public function downloadCatalog()
    {
        $token = $this->getAccessToken();

        // La documentación pide explícitamente gzip
        $response = Http::withToken($token)
            ->withHeaders(['Accept-Encoding' => 'gzip'])
            ->get("{$this->baseUrl}/pub/brands/download/");

        if ($response->failed()) {
            Log::error("Fallo descarga catálogo: " . $response->body());
            throw new \Exception("Error al descargar catálogo: " . $response->status());
        }

        $json = $response->json();
        
        // A veces viene directo el array, a veces dentro de 'data'
        return $json['data'] ?? $json;
    }

    /**
     * Busca modelos individuales (usado por el comando para bajar detalle)
     */
    public function getModels($brandId, $groupId)
    {
        $token = $this->getAccessToken();
        $url = "{$this->baseUrl}/pub/brands/{$brandId}/groups/{$groupId}/models/";

        try {
            $response = Http::withToken($token)->timeout(10)->get($url);
            
            if ($response->failed()) {
                return [];
            }

            $data = $response->json();
            return $data['data'] ?? $data;

        } catch (\Exception $e) {
            return [];
        }
    }
}