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

        $this->info('🚀 Iniciando sincronización (MODO CAMUFLAJE)...');

        // FASE 1: MARCAS Y GRUPOS
        $this->info('📥 [1/2] Bajando Marcas y Grupos...');
        try {
            $data = $service->downloadCatalog();
        } catch (\Exception $e) {
            $this->error("💥 Error fatal: " . $e->getMessage());
            return;
        }

        // Procesamos Marcas y Grupos rápido
        foreach ($data as $brandData) {
            if (!isset($brandData['id'])) continue;
            $brand = InfoAutoBrand::updateOrCreate(
                ['id' => $brandData['id']],
                ['name' => $brandData['name'] ?? 'Sin Nombre']
            );
            if (isset($brandData['groups']) && is_array($brandData['groups'])) {
                foreach ($brandData['groups'] as $groupData) {
                    $uniqueGroupId = ($brand->id * 1000000) + $groupData['id'];
                    InfoAutoGroup::updateOrCreate(
                        ['id' => $uniqueGroupId],
                        ['brand_id' => $brand->id, 'name' => $groupData['name'] ?? 'General']
                    );
                }
            }
        }
        $this->info("✅ Estructura base actualizada.");
        
        // FASE 2: MODELOS Y PRECIOS
        $this->info('📥 [2/2] Bajando Modelos y Precios...');

        $token = $service->getAccessToken();
        $groups = InfoAutoGroup::all();
        
        $barModels = $this->output->createProgressBar($groups->count());
        $barModels->start();
        
        // Browser falso para evitar bloqueos
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        foreach ($groups as $group) {
            try {
                $originalGroupId = $group->id % 1000000;
                $url = "https://api.infoauto.com.ar/cars/pub/brands/{$group->brand_id}/groups/{$originalGroupId}/models/";
                
                // Pausa anti-bloqueo
                usleep(100000); 

                $res = Http::withToken($token)
                    ->withUserAgent($userAgent) // 👈 CLAVE: Nos disfrazamos de Chrome
                    ->withoutVerifying()
                    ->timeout(15)
                    ->get($url);

                if ($res->failed()) {
                     $barModels->advance();
                     continue; 
                }

                $list = $res->json()['data'] ?? $res->json();

                if (is_array($list)) {
                    foreach ($list as $item) {
                        if (!isset($item['codia'])) continue;

                        $pricesPayload = [];

                        // Solo buscamos precio si la API dice que tiene
                        if (isset($item['prices']) && $item['prices'] === true) {
                            try {
                                usleep(200000); // Pausa de 0.2s entre autos (Vital para que no baneen)

                                $codia = $item['codia'];
                                $urlPrecios = "https://api.infoauto.com.ar/cars/pub/models/{$codia}/prices/";
                                
                                $resPrice = Http::withToken($token)
                                    ->withUserAgent($userAgent) // 👈 CLAVE AQUÍ TAMBIÉN
                                    ->withoutVerifying()
                                    ->timeout(10)
                                    ->get($urlPrecios);
                                
                                if ($resPrice->successful()) {
                                    $pricesPayload = $resPrice->json();
                                } else {
                                    // SI FALLA, TE AVISA POR QUÉ
                                    $this->newLine();
                                    $this->error("⚠️ Error {$resPrice->status()} al bajar precio del auto $codia");
                                    if ($resPrice->status() == 403 || $resPrice->status() == 429) {
                                        $this->error("⛔ EL SERVIDOR NOS ESTÁ BLOQUEANDO. Esperando 5 segundos...");
                                        sleep(5);
                                    }
                                }
                            } catch (\Exception $e) {
                                // Error silencioso para seguir
                            }
                        }

                        InfoAutoModel::updateOrCreate(
                            ['codia' => $item['codia']],
                            [
                                'group_id'    => $group->id,
                                'brand_id'    => $group->brand_id,
                                'description' => $item['description'] ?? 'Sin descripción',
                                'photo_url'   => $item['photo_url'] ?? null,
                                'list_price'  => $item['list_price'] ?? false,
                                'features'    => $item['features'] ?? [],
                                'prices'      => $pricesPayload // Array limpio
                            ]
                        );
                    }
                }
            } catch (\Exception $e) {
                // Error de grupo
            }
            $barModels->advance();
        }

        $barModels->finish();
        $this->newLine();
        $this->info("🏁 FIN DEL PROCESO.");
    }
}