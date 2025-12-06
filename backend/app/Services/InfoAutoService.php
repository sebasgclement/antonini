<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class InfoAutoService
{
    protected $baseUrl;
    protected $user;
    protected $pass;
    protected $verifySsl; // Variable para controlar la verificación SSL

    public function __construct()
    {
        $this->baseUrl = config('services.infoauto.url', env('INFOAUTO_BASE_URL'));
        $this->user = config('services.infoauto.user', env('INFOAUTO_USER'));
        $this->pass = config('services.infoauto.pass', env('INFOAUTO_PASS'));

        // En producción SÍ verificamos SSL. En local (XAMPP/Docker) NO, para evitar errores.
        $this->verifySsl = app()->environment('production');
    }

    private function getToken()
    {
        // Cacheamos el token por 50 minutos para no saturar la API
        return Cache::remember('infoauto_token', 3000, function () {
            
            try {
                // 1. Intentamos Loguearnos
                $response = Http::withOptions(['verify' => $this->verifySsl]) // <--- Dinámico
                    ->withHeaders([
                        'Content-Type' => 'application/json',
                        'Authorization' => 'Basic ' . base64_encode($this->user . ':' . $this->pass)
                    ])
                    ->post($this->baseUrl . '/auth/login');

            } catch (\Exception $e) {
                // Si explota la conexión (DNS, Internet, etc)
                Log::error("InfoAuto Conexión Fallida: " . $e->getMessage());
                throw new \Exception("Error de conexión con InfoAuto: " . $e->getMessage());
            }

            // 2. Verificamos si InfoAuto nos rechazó
            if ($response->failed()) {
                Log::error("InfoAuto Login Falló: " . $response->body());
                throw new \Exception('InfoAuto rechazó el login: ' . $response->status());
            }

            $data = $response->json();

            // 3. Verificamos que venga el token
            if (!isset($data['access_token'])) {
                Log::error("InfoAuto: Respuesta sin token", $data);
                throw new \Exception('La API no devolvió un access_token válido.');
            }

            return $data['access_token'];
        });
    }

    public function get($endpoint)
    {
        try {
            $token = $this->getToken();

            $response = Http::withOptions(['verify' => $this->verifySsl]) // <--- Dinámico
                ->withToken($token)
                ->get($this->baseUrl . '/pub/' . $endpoint);

            // Si el token venció (401), borramos cache y reintentamos UNA vez
            if ($response->status() === 401) {
                Cache::forget('infoauto_token');
                $token = $this->getToken(); // Pedimos uno nuevo
                
                $response = Http::withOptions(['verify' => $this->verifySsl])
                    ->withToken($token)
                    ->get($this->baseUrl . '/pub/' . $endpoint);
            }

            if ($response->failed()) {
                // Lanzamos error para que el controller o el log lo capturen
                throw new \Exception("InfoAuto Error en {$endpoint}: " . $response->status());
            }

            return $response->json();

        } catch (\Exception $e) {
            // Logueamos el error para no perder rastro
            Log::error($e->getMessage());
            // Devolvemos array vacío para que el frontend no explote con 500
            return []; 
        }
    }
    
    // --- Métodos Específicos ---

    public function getBrands() 
    { 
        return $this->get('brands'); 
    }

    public function getGroups($brandId) 
    { 
        return $this->get("brands/{$brandId}/groups"); 
    }

    /**
     * Obtiene los modelos filtrando por Marca y Grupo (Ruta Jerárquica)
     */
    public function getModels($brandId, $groupId)
    {
        return $this->get("brands/{$brandId}/groups/{$groupId}/models/");
    }

    /**
     * Trae el detalle del modelo e inyecta los precios manualmente
     * para que el frontend reciba todo junto.
     */
    public function getModelDetail($codia)
    {
        // 1. Pedimos la info básica
        $model = $this->get("models/{$codia}");

        // 2. Pedimos la lista de precios usados explícitamente
        $prices = $this->get("models/{$codia}/prices/");

        // 3. Fusionamos
        if (is_array($model)) {
            // Aseguramos que prices sea un array (a veces viene envuelto en 'data')
            $model['prices'] = $prices['data'] ?? $prices ?? [];
        }

        return $model;
    }
}