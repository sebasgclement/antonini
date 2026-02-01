<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InfoAutoModel;
use App\Services\InfoAutoService;
use Illuminate\Support\Facades\Http;

class RetryMissingPrices extends Command
{
    protected $signature = 'infoauto:retry-missing';
    protected $description = 'Reintenta descargar precios solo para los modelos que están vacíos';

    public function handle(InfoAutoService $service)
    {
        // Buscamos modelos que tengan el array de precios vacío
        // Y que NO sean marcados como "solo precio de lista" (para no perder tiempo)
        $models = InfoAutoModel::where('prices', '[]')
                    ->orWhereNull('prices')
                    ->orderBy('id', 'desc') // Empezamos por los últimos (los más nuevos)
                    ->get();

        $count = $models->count();
        $this->info("🔍 Encontré {$count} modelos sin precios. Intentando recuperarlos...");

        $bar = $this->output->createProgressBar($count);
        $token = $service->getAccessToken();
        $recovered = 0;

        foreach ($models as $model) {
            try {
                $url = "https://api.infoauto.com.ar/cars/pub/models/{$model->codia}/prices/";
                $response = Http::withToken($token)->timeout(5)->get($url);

                if ($response->successful()) {
                    $prices = $response->json();
                    
                    // Si la API devuelve datos reales, actualizamos
                    if (!empty($prices)) {
                        $model->update(['prices' => $prices]);
                        $recovered++;
                        // Forzamos un log pequeño para ver que avanza
                        $this->line(" ✅ Recuperado: {$model->description}");
                    }
                }
                
                // Pausa pequeña para no saturar
                usleep(200000); // 0.2 segundos

            } catch (\Exception $e) {
                // Si falla, seguimos de largo
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("🏁 Proceso terminado. Se recuperaron precios de {$recovered} autos.");
    }
}