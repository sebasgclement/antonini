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

    // 1. Marcas (desde DB sincronizada)
    public function getBrands()
    {
        $brands = InfoAutoBrand::orderBy('name', 'asc')->get();
        return response()->json($brands);
    }

    // 2. Grupos (desde DB sincronizada)
    public function getGroups($brandId)
    {
        $groups = InfoAutoGroup::where('brand_id', $brandId)
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($groups);
    }

    // 3. Modelos (consulta puntual en vivo por grupo)
    public function getModels($brandId, $groupId)
    {
        $token = $this->infoAutoService->getToken();
        if (!$token) {
            Log::error("No se pudo obtener el token de InfoAuto para Models");
            return response()->json([]);
        }

        // Buscar el grupo en tu BD para obtener el infoauto_id
        $group = InfoAutoGroup::where('id', $groupId)
                              ->where('brand_id', $brandId)
                              ->first();

        if (!$group) {
            return response()->json([]);
        }

        $url = "https://api.infoauto.com.ar/cars/pub/brands/{$brandId}/groups/{$group->infoauto_id}/models/?page_size=100";

        $response = Http::withToken($token)
            ->withHeaders(['Accept-Encoding' => 'gzip'])
            ->withoutVerifying()
            ->get($url);

        if ($response->successful()) {
            $json = $response->json();
            $models = $json['data'] ?? $json; // soporta respuesta con 'data'
            return response()->json($models);
        }

        Log::error("Error InfoAuto getModels: " . $response->body());
        return response()->json([]);
    }

    // 4. Precio (consulta puntual obligatoria por usuario)
    public function getPrice($codia)
    {
        $precioData = Cache::remember("precio_live_{$codia}", 3600, function () use ($codia) {
            Log::info("Consulta puntual a API InfoAuto por precio: CODIA {$codia}");
            return $this->infoAutoService->getPrecioEnVivo($codia);
        });

        return response()->json(['precios' => $precioData]);
    }
}
