<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InfoAutoModel;
use App\Services\InfoAutoService;

class SyncInfoAuto extends Command
{
    protected $signature = 'infoauto:safe-sync';
    protected $description = 'Sincronización 1 a 1 (Modo Seguro)';

    protected $service;

    public function __construct(InfoAutoService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    public function handle()
    {
        ini_set('memory_limit', '-1');
        set_time_limit(0);

        $this->info("🐜 Iniciando Sincronización Uno a Uno (Modo Hormiga)...");

        // Buscamos autos que tengan CODIA cargado
        $codias = InfoAutoModel::whereNotNull('codia')
            ->where('codia', '!=', 0)
            ->pluck('codia')
            ->unique();

        $total = $codias->count();
        $this->info("🚗 Total de vehículos: {$total}");
        
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        foreach ($codias as $codia) {
            try {
                // Llamamos al método nuevo que busca precios
                $resultado = $this->service->getModelPrices($codia);

                // Tu código viejo decía que a veces viene en 'data' y a veces directo
                // Lo normalizamos acá:
                $precios = $resultado['data'] ?? $resultado ?? [];

                if (!empty($precios)) {
                    InfoAutoModel::where('codia', $codia)
                        ->update([
                            'prices'     => json_encode($precios),
                            'updated_at' => now()
                        ]);
                }

            } catch (\Exception $e) {
                // Si falla uno, no cortamos todo, solo mostramos error y seguimos
                // (Salvo que sea un 403 de bloqueo real)
                if (str_contains($e->getMessage(), '403')) {
                    $this->error("\n⛔ BLOQUEO DETECTADO. Deteniendo.");
                    return 1;
                }
                // Si es otro error, lo ignoramos y seguimos con el siguiente auto
            }

            $bar->advance();
            
            // PAUSA DE SEGURIDAD: Medio segundo entre pedido y pedido
            // Esto evita el Error 429 (Too Many Requests)
            usleep(500000); // 500ms
        }

        $bar->finish();
        $this->newLine();
        $this->info("✅ Sincronización Finalizada.");
        return 0;
    }
}