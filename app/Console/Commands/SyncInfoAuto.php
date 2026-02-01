<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\InfoAutoService;
use App\Models\InfoAutoBrand;
use App\Models\InfoAutoGroup;
use App\Models\InfoAutoModel;
use Illuminate\Support\Facades\Http;

class SyncInfoAuto extends Command
{
    protected $signature = 'infoauto:sync'; 
    protected $description = 'Sincroniza Marcas, Grupos, MODELOS y sus PRECIOS reales';

    public function handle(InfoAutoService $service)
    {
        // Configuraciones para scripts largos
        ini_set('memory_limit', '-1');
        set_time_limit(0);

        $this->info('🚀 Iniciando sincronización completa...');

        // ---------------------------------------------------------
        // FASE 1: MARCAS Y GRUPOS
        // ---------------------------------------------------------
        $this->info('📥 [1/2] Bajando Marcas y Grupos...');
        try {
            $data = $service->downloadCatalog();
        } catch (\Exception $e) {
            $this->error("💥 Error fatal descargando catálogo: " . $e->getMessage());
            return;
        }

        $bar = $this->output->createProgressBar(count($data));
        $bar->start();

        foreach ($data as $brandData) {
            if (!isset($brandData['id'])) continue;

            $brand = InfoAutoBrand::updateOrCreate(
                ['id' => $brandData['id']],
                ['name' => $brandData['name'] ?? 'Sin Nombre']
            );

            if (isset($brandData['groups']) && is_array($brandData['groups'])) {
                foreach ($brandData['groups'] as $groupData) {
                    
                    // ID compuesto para evitar colisiones
                    $uniqueGroupId = ($brand->id * 1000000) + $groupData['id'];

                    InfoAutoGroup::updateOrCreate(
                        ['id' => $uniqueGroupId],
                        [
                            'brand_id' => $brand->id,
                            'name' => $groupData['name'] ?? 'General'
                        ]
                    );
                }
            }
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();
        $this->info("✅ Grupos actualizados.");
        
        // ---------------------------------------------------------
        // FASE 2: MODELOS Y PRECIOS
        // ---------------------------------------------------------
        $this->info('📥 [2/2] Bajando Modelos y buscando PRECIOS (Esto tomará tiempo)...');

        $token = $service->getAccessToken();
        $groups = InfoAutoGroup::all();
        
        $barModels = $this->output->createProgressBar($groups->count());
        $barModels->start();
        
        $savedModels = 0;
        $errores = 0;

        foreach ($groups as $group) {
            try {
                // Recuperar ID original para la API
                $originalGroupId = $group->id % 1000000;

                // URL para obtener la lista de modelos del grupo
                $url = "https://api.infoauto.com.ar/cars/pub/brands/{$group->brand_id}/groups/{$originalGroupId}/models/";
                
                // Pausa muy breve para el listado general
                usleep(50000); 
                $res = Http::withToken($token)->timeout(10)->get($url);

                if ($res->failed()) {
                     $barModels->advance();
                     continue; 
                }

                $json = $res->json();
                $list = $json['data'] ?? $json; // A veces viene en data, a veces directo

                if (is_array($list)) {
                    foreach ($list as $item) {
                        if (!isset($item['codia'])) continue;

                        $pricesPayload = [];

                        // --- LÓGICA DE PRECIOS ---
                        // Si la API dice que tiene precios, los buscamos individualmente
                        if (isset($item['prices']) && $item['prices'] === true) {
                            try {
                                // Pausa de 0.1s para respetar rate limits de InfoAuto
                                usleep(100000); 

                                $codia = $item['codia'];
                                $urlPrecios = "https://api.infoauto.com.ar/cars/pub/models/{$codia}/prices/";
                                
                                $resPrice = Http::withToken($token)->timeout(5)->get($urlPrecios);
                                
                                if ($resPrice->successful()) {
                                    // Obtenemos el array real: [{year:2010, price:500}, ...]
                                    $pricesPayload = $resPrice->json();
                                }
                            } catch (\Exception $e) {
                                // Si falla el precio, seguimos igual, guardamos el auto sin precio
                                // para no detener todo el proceso.
                            }
                        }

                        // --- GUARDADO EN BASE DE DATOS ---
                        InfoAutoModel::updateOrCreate(
                            ['codia' => $item['codia']],
                            [
                                'group_id'    => $group->id,
                                'brand_id'    => $group->brand_id,
                                'description' => $item['description'] ?? 'Sin descripción',
                                'photo_url'   => $item['photo_url'] ?? null,
                                'list_price'  => $item['list_price'] ?? false,
                                'features'    => json_encode($item['features'] ?? []),
                                
                                // AQUI guardamos los precios reales que acabamos de bajar
                                'prices'      => json_encode($pricesPayload) 
                            ]
                        );
                        $savedModels++;
                    }
                }
            } catch (\Exception $e) {
                $errores++;
            }
            $barModels->advance();
        }

        $barModels->finish();
        $this->newLine(2);
        $this->info("🏁 FIN. Modelos procesados: {$savedModels}. Errores de grupo: {$errores}");
        $this->comment("Si ves modelos sin precio, volvé a correr el comando; actualizará los faltantes.");
    }
}