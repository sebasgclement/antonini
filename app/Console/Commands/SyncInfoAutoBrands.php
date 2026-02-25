<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InfoAutoBrand;
use App\Models\InfoAutoGroup;
use App\Services\InfoAutoService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncInfoAutoBrands extends Command
{
    protected $signature = 'infoauto:sync-brands';
    protected $description = 'Descarga y sincroniza el catálogo de Marcas y Grupos de InfoAuto';

    public function handle(InfoAutoService $infoAutoService)
    {
        $this->info("Iniciando sincronización de Marcas y Grupos desde InfoAuto...");

        $token = $infoAutoService->getToken();
        if (!$token) {
            $this->error("Error: No se pudo obtener el token de autenticación.");
            return Command::FAILURE;
        }

        $url = "https://api.infoauto.com.ar/cars/pub/brands/download/";

        try {
            $response = Http::withToken($token)
                ->withHeaders(['Accept-Encoding' => 'gzip'])
                ->withoutVerifying()
                ->get($url);

            if ($response->successful()) {
                $brandsData = $response->json();
                $countBrands = 0;
                $countGroups = 0;

                \DB::beginTransaction();

                foreach ($brandsData as $b) {
                    $brand = InfoAutoBrand::updateOrCreate(
                        ['id' => $b['id']],
                        ['name' => $b['name']]
                    );
                    $countBrands++;

                    if (isset($b['groups']) && is_array($b['groups'])) {
                        foreach ($b['groups'] as $g) {
                            // Dentro de SyncInfoAutoBrands.php

InfoAutoGroup::updateOrCreate(
    [
        'infoauto_id' => $g['id'],
        'brand_id'    => $brand->id
    ],
    [
        'name'        => $g['name'] ?? null,
        'prices_from' => $g['prices_from'] ?? null,
        'prices_to'   => $g['prices_to'] ?? null,
        'summary'     => $g['summary'] ?? null,
    ]
);



                            $countGroups++;
                        }
                    }
                }

                \DB::commit();

                $this->info("¡Éxito! Se sincronizaron {$countBrands} marcas y {$countGroups} grupos.");
                Log::info("Sincronización InfoAuto exitosa: {$countBrands} marcas, {$countGroups} grupos.");
                return Command::SUCCESS;
            } else {
                $this->error("La API de InfoAuto devolvió un error: " . $response->status());
                Log::error("InfoAuto Sync Error: " . $response->body());
                return Command::FAILURE;
            }
        } catch (\Exception $e) {
            \DB::rollBack();
            $this->error("Ocurrió una excepción: " . $e->getMessage());
            Log::error("InfoAuto Sync Exception: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
