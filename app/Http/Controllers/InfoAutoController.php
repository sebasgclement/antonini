<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\InfoAutoBrand;
use App\Models\InfoAutoModel;
use App\Services\InfoAutoService; // Importamos el servicio nuevo
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class InfoAutoController extends Controller
{
    protected $infoAutoService;

    // Inyectamos el servicio en el constructor
    public function __construct(InfoAutoService $infoAutoService)
    {
        $this->infoAutoService = $infoAutoService;
    }

    // ---------------------------------------------------------
    // 1. MARCAS Y GRUPOS (Esto sigue igual, lee de TU base de datos)
    // ---------------------------------------------------------
    public function getBrands()
    {
        // No gasta cupo API. Lee de tu tabla local.
        $brands = InfoAutoBrand::with(['groups' => function($query) {
            $query->orderBy('name', 'asc');
        }])
        ->orderBy('name', 'asc')
        ->get();

        return response()->json($brands);
    }

    // ---------------------------------------------------------
    // 2. MODELOS (Esto sigue igual, lee de TU base de datos)
    // ---------------------------------------------------------
    public function getModels($brandId, $groupId)
{
    // 1. Primero buscamos en NUESTRA base de datos local
    $models = InfoAutoModel::where('brand_id', $brandId)
                           ->where('group_id', $groupId)
                           ->orderBy('description', 'asc')
                           ->get();

    // ✅ SI YA TENEMOS DATOS, LOS DEVOLVEMOS (Rápido y GRATIS)
    if ($models->count() > 0) {
        return response()->json($models);
    }

    // 🛑 SI ESTÁ VACÍO, VAMOS A BUSCARLOS A LA API (Solo esta vez)
    // Esto cumple con InfoAuto: "Consultas puntuales a demanda del usuario"
    
    // Necesitamos el token (podés usar tu servicio o lógica directa acá)
    $token = $this->infoAutoService->getToken();
    
    // OJO: InfoAuto usa IDs numéricos, asegurate que brandId y groupId sean los de la API
    $url = "https://api.infoauto.com.ar/cars/pub/brands/{$brandId}/groups/{$groupId}/models/";

    try {
        $response = Http::withToken($token)->withoutVerifying()->get($url);
        
        if ($response->successful()) {
            $datosApi = $response->json();
            $nuevosModelos = [];

            foreach ($datosApi as $m) {
                // Guardamos en local para la próxima
                $nuevo = InfoAutoModel::create([
                    'codia'       => $m['codia'],
                    'description' => $m['description'],
                    'brand_id'    => $brandId,
                    'group_id'    => $groupId,
                    'prices'      => null, // Empieza sin precio
                    'features'    => json_encode($m['features'] ?? [])
                ]);
                $nuevosModelos[] = $nuevo;
            }

            return response()->json($nuevosModelos);
        }
    } catch (\Exception $e) {
        \Log::error("Error bajando modelos on-demand: " . $e->getMessage());
    }

    return response()->json([], 500);
}

    // ---------------------------------------------------------
    // 3. PRECIO (¡NUEVO! Este es el que conecta con la API)
    // ---------------------------------------------------------
    public function getPrice($codia)
    {
        // Validamos que el CODIA exista en nuestra base local primero (opcional pero recomendado)
        $localModel = InfoAutoModel::where('codia', $codia)->first();

        if (!$localModel) {
            return response()->json(['error' => 'Modelo no encontrado en base local'], 404);
        }

        // --- MAGIA DE CACHÉ ---
        // Antes de gastar un crédito de la API, nos fijamos si ya pedimos este precio hace poco.
        // Guardamos el precio por 60 minutos (3600 segundos).
        // Si 10 usuarios piden el mismo auto, solo gastamos 1 crédito.
        
        $precioData = Cache::remember("precio_live_{$codia}", 3600, function () use ($codia) {
            Log::info("Consulta API InfoAuto En Vivo: CODIA {$codia}");
            return $this->infoAutoService->getPrecioEnVivo($codia);
        });

        // Preparamos la respuesta
        return response()->json([
            'modelo' => $localModel,   // Datos fijos (nombre, foto) desde BD local
            'precios' => $precioData   // Datos frescos (precio lista, usados) desde API
        ]);
    }
}