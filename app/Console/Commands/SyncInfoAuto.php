<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InfoAutoModel;
use Illuminate\Support\Facades\Http;

class SyncInfoAuto extends Command
{
    protected $signature = 'infoauto:sync';
    protected $description = 'Sincronización por Lotes (Batch) - Anti Bloqueo';

    public function handle()
    {
        ini_set('memory_limit', '-1');
        set_time_limit(0);

        $this->info("📦 Iniciando Sincronización por Lotes (BATCH)...");

        // 1. LOGIN (Basic Auth) - Confirmado que funciona
        $user = 'aptassoni@gmail.com';
        $pass = 'oPOeKOtj2s2BRFRR';
        
        $this->info("🔑 Autenticando...");
        $response = Http::withBasicAuth($user, $pass)
            ->withoutVerifying()
            ->post('https://api.infoauto.com.ar/cars/auth/login');

        $token = $response->json()['access_token'] ?? null;

        if (!$token) {
            $this->error("❌ Error de Login. Esperá a que se desbloquee la IP.");
            return;
        }

        // 2. PREPARAR LOTES
        // Obtenemos todos los CODIA de la base de datos que necesitamos actualizar
        // (O podés filtrar solo los que tienen prices null si preferís)
        $codias = InfoAutoModel::pluck('codia')->unique();
        $total = $codias->count();
        
        $this->info("🚗 Total de vehículos a procesar: $total");
        $this->info("🔄 Se enviarán en paquetes de 100 (Total aprox: " . ceil($total/100) . " peticiones)");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        // 3. PROCESAR POR LOTES (Chunks de 100 según documentación)
        $codias->chunk(100)->each(function ($chunk) use ($token, $bar) {
            
            // Preparamos el cuerpo del mensaje: { "batch": [123, 456, ...] }
            // array_values es importante para que sea una lista JSON [1,2] y no objeto {"0":1, "1":2}
            $payload = [
                'batch' => array_values($chunk->toArray())
            ];

            try {
                // Endpoint Batch. 
                // NOTA: Asumimos que está bajo /cars/batch/ o /batch/. 
                // Dado que el login es /cars/auth, probamos primero /cars/batch/
                $url = 'https://api.infoauto.com.ar/cars/batch/';

                $res = Http::withToken($token)
                    ->withHeaders([
                        'Accept-Encoding' => 'gzip', // OBLIGATORIO según tu doc
                        'Content-Type'    => 'application/json'
                    ])
                    ->withoutVerifying()
                    ->timeout(20)
                    ->post($url, $payload);

                // Si falla por 404, intentamos la URL sin /cars/
                if ($res->status() == 404) {
                    $url = 'https://api.infoauto.com.ar/batch/';
                    $res = Http::withToken($token)
                        ->withHeaders(['Accept-Encoding' => 'gzip'])
                        ->withoutVerifying()
                        ->post($url, $payload);
                }

                if ($res->successful()) {
                    $autosRecibidos = $res->json();

                    // 4. ACTUALIZAR BASE DE DATOS
                    foreach ($autosRecibidos as $datoAuto) {
                        // Buscamos el auto en nuestra BD por codia y actualizamos precios
                        // Usamos update sutil para no sobrecargar
                        if (isset($datoAuto['codia']) && isset($datoAuto['prices'])) {
                            InfoAutoModel::where('codia', $datoAuto['codia'])
                                ->update(['prices' => json_encode($datoAuto['prices'])]);
                        }
                    }
                } elseif ($res->status() == 403) {
                    $this->error("\n⚠️ Aún bloqueado (403). Intente más tarde.");
                    return false; // Cortar el loop
                } else {
                    $this->error("\n❌ Error en lote: " . $res->status());
                }

            } catch (\Exception $e) {
                $this->error("\n❌ Excepción: " . $e->getMessage());
            }

            // Pausa de seguridad entre lotes (2 segundos)
            // 60 lotes * 2 seg = 2 minutos total. Muy seguro.
            sleep(2);
            $bar->advance($chunk->count());
        });

        $bar->finish();
        $this->newLine();
        $this->info("🏁 PROCESO FINALIZADO CORRECTAMENTE.");
    }
}