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
    protected $description = 'Sincroniza con Camuflaje TOTAL (Headers + UserAgent)';

    public function handle(InfoAutoService $service)
    {
        ini_set('memory_limit', '-1');
        set_time_limit(0);

        $this->info('🚀 Sincronizando (INTENTO FINAL CON HEADERS)...');

        // --- FASE 1: CATALOGO ---
        try {
            $data = $service->downloadCatalog();
            foreach ($data as $brandData) {
                if (!isset($brandData['id'])) continue;
                $brand = InfoAutoBrand::updateOrCreate(['id' => $brandData['id']], ['name' => $brandData['name'] ?? 'Sin Nombre']);
                
                if (isset($brandData['groups']) && is_array($brandData['groups'])) {
                    foreach ($brandData['groups'] as $groupData) {
                        $uniqueGroupId = ($brand->id * 1000000) + $groupData['id'];
                        InfoAutoGroup::updateOrCreate(['id' => $uniqueGroupId], ['brand_id' => $brand->id, 'name' => $groupData['name'] ?? 'General']);
                    }
                }
            }
            $this->info("✅ Marcas OK.");
        } catch (\Exception $e) {
            $this->error("Error catalogo: " . $e->getMessage());
            return;
        }
        
        // --- FASE 2: PRECIOS ---
        $this->info('📥 Bajando Precios (Simulando navegación real)...');
        $token = $service->getAccessToken();
        $groups = InfoAutoGroup::all();
        $bar = $this->output->createProgressBar($groups->count());
        
        // CABECERAS COMPLETAS DE NAVEGADOR
        $headers = [
            'Referer' => 'https://www.infoauto.com.ar/',
            'Origin' => 'https://www.infoauto.com.ar',
            'Accept' => 'application/json, text/plain, */*',
            'Accept-Language' => 'es-419,es;q=0.9,en;q=0.8',
            'Connection' => 'keep-alive',
            'Sec-Fetch-Dest' => 'empty',
            'Sec-Fetch-Mode' => 'cors',
            'Sec-Fetch-Site' => 'same-site',
        ];

        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        foreach ($groups as $group) {
            try {
                $originalGroupId = $group->id % 1000000;
                
                // Pedido de lista de modelos
                $res = Http::withToken($token)
                    ->withHeaders($headers) // 👈 Agregamos Headers
                    ->withUserAgent($userAgent)
                    ->withoutVerifying()
                    ->timeout(15)
                    ->get("https://api.infoauto.com.ar/cars/pub/brands/{$group->brand_id}/groups/{$originalGroupId}/models/");

                if ($res->failed()) { $bar->advance(); continue; }

                $list = $res->json()['data'] ?? $res->json();

                if (is_array($list)) {
                    foreach ($list as $item) {
                        if (!isset($item['codia'])) continue;
                        $pricesPayload = [];

                        if (isset($item['prices']) && $item['prices'] === true) {
                            try {
                                usleep(500000); // 0.5 segundos de pausa (Más lento = Más seguro)
                                
                                $resP = Http::withToken($token)
                                    ->withHeaders($headers) // 👈 Agregamos Headers aquí también
                                    ->withUserAgent($userAgent)
                                    ->withoutVerifying()
                                    ->timeout(10)
                                    ->get("https://api.infoauto.com.ar/cars/pub/models/{$item['codia']}/prices/");
                                
                                if ($resP->successful()) {
                                    $pricesPayload = $resP->json();
                                } else {
                                    // Si falla, mostramos el código pero seguimos intentando
                                    // $this->error("E{$resP->status()}"); 
                                }
                            } catch (\Exception $e) {}
                        }

                        InfoAutoModel::updateOrCreate(
                            ['codia' => $item['codia']],
                            [
                                'group_id' => $group->id,
                                'brand_id' => $group->brand_id,
                                'description' => $item['description'] ?? 'Desc',
                                'photo_url' => $item['photo_url'] ?? null,
                                'list_price' => $item['list_price'] ?? false,
                                'features' => $item['features'] ?? [],
                                'prices' => $pricesPayload
                            ]
                        );
                    }
                }
            } catch (\Exception $e) {}
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();
        $this->info("🏁 FIN.");
    }
}