<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\InfoAutoBrand;
use App\Models\InfoAutoGroup;
use App\Services\InfoAutoService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class InfoAutoController extends Controller
{
    protected $infoAutoService;

    public function __construct(InfoAutoService $infoAutoService)
    {
        $this->infoAutoService = $infoAutoService;
    }

    // 1. Marcas: Usamos InfoAutoBrand (la que tenés vinculada)
    public function getBrands()
    {
        return InfoAutoBrand::with('groups')->orderBy('name', 'asc')->get();
    }

    // 2. Modelos: Aquí estaba el fallo. 
    // Usamos el 'infoauto_id' del grupo para pegarle a la API [cite: 19, 20]
    public function getModels($brandId, $groupId)
    {
        $token = $this->infoAutoService->getToken();
        if (!$token) return response()->json([]);

        // Buscamos el grupo en TU base local para sacar el ID real de InfoAuto
        $group = InfoAutoGroup::where('id', $groupId)->first();
        if (!$group) return response()->json([]);

        // URL estructurada según manual: Marca -> Grupo -> Modelos [cite: 12, 64]
        $url = "https://api.infoauto.com.ar/cars/pub/brands/{$brandId}/groups/{$group->infoauto_id}/models/?page_size=100";

        $response = Http::withToken($token)
            ->withHeaders(['Accept-Encoding' => 'gzip'])
            ->withoutVerifying()
            ->get($url);

        if ($response->successful()) {
            $json = $response->json();
            // Retornamos 'data' que es donde vienen los modelos con su CODIA [cite: 26, 32]
            return response()->json($json['data'] ?? $json);
        }

        return response()->json([]);
    }

    // 3. Precios: Unificamos Usados y 0km para que no se corte en 2018
    public function getPrice($codia)
    {
        try {
            $data = $this->infoAutoService->getPrecioEnVivo($codia);
            
            if (!$data) {
                return response()->json(['precios' => [], 'error' => 'No hay data']);
            }

            $preciosFormateados = [];

            // A. Usados
            if (isset($data['usados']) && is_array($data['usados'])) {
                foreach ($data['usados'] as $item) {
                    if (isset($item['year']) && isset($item['price'])) {
                        $preciosFormateados[] = [
                            'year' => (int)$item['year'],
                            'price' => (float)$item['price']
                        ];
                    }
                }
            }

            // B. 0KM
            if (!empty($data['cero_km'])) {
                $precioCeroKm = is_array($data['cero_km']) && isset($data['cero_km']['list_price']) 
                                ? $data['cero_km']['list_price'] 
                                : (is_numeric($data['cero_km']) ? $data['cero_km'] : 0);

                if ($precioCeroKm > 0) {
                    $preciosFormateados[] = [
                        'year' => (int)date('Y'),
                        'price' => (float)$precioCeroKm
                    ];
                }
            }

            usort($preciosFormateados, function($a, $b) {
                return $b['year'] <=> $a['year'];
            });

            // ENVIAMOS EL SECRETO AL FRONTEND
            return response()->json([
                'precios' => $preciosFormateados,
                'debug' => $data['debug_info'] ?? 'sin_datos_de_debug'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'precios' => [],
                'debug' => 'Fallo crítico: ' . $e->getMessage()
            ]);
        }
    }
}