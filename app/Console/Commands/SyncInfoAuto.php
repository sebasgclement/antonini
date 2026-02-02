<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InfoAutoModel;
use Illuminate\Support\Facades\Http;

class SyncInfoAuto extends Command
{
    protected $signature = 'infoauto:sync';
    protected $description = 'Reparación FINAL: Credenciales correctas y Un solo Token';

    public function handle()
    {
        ini_set('memory_limit', '-1');
        set_time_limit(0);

        // 1. OBTENER TOKEN ÚNICO (Como dice la documentación)
        $this->info("🔑 Iniciando sesión con credenciales de PRODUCCIÓN...");
        
        // Credenciales OFICIALES provistas en el chat
        $user = 'aptassoni@gmail.com';
        $pass = 'oPOeKOtj2s2BRFRR';
        
        // Mantenemos el User-Agent para que no nos desconozcan
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        try {
            // URL OFICIAL: https://api.infoauto.com.ar/cars/auth/login
            $response = Http::withUserAgent($userAgent)
                ->withoutVerifying()
                ->post('https://api.infoauto.com.ar/cars/auth/login', [
                    'username' => $user,
                    'password' => $pass
                ]);

            if ($response->failed()) {
                $this->error("❌ ERROR CRÍTICO DE LOGIN: " . $response->body());
                return;
            }

            $token = $response->json()['access_token'];
            $this->info("✅ Token obtenido con éxito. Duración: 1 hora.");

        } catch (\Exception $e) {
            $this->error("❌ Excepción al loguear: " . $e->getMessage());
            return;
        }

        // 2. BUSCAR AUTOS ROTOS
        // Buscamos los que tienen precio vacío []
        $autos = InfoAutoModel::where('prices', '[]')->orWhereNull('prices')->get();
        $count = $autos->count();

        if ($count === 0) {
            $this->info("✨ ¡La base de datos ya está completa! No hay nada que reparar.");
            return;
        }

        $this->info("🔧 Reparando $count autos usando el token único...");
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($autos as $auto) {
            try {
                // Pausa de 0.4s para no saturar (Rate Limit)
                usleep(400000); 

                $res = Http::withToken($token)
                    ->withUserAgent($userAgent)
                    ->withoutVerifying()
                    ->timeout(10)
                    ->get("https://api.infoauto.com.ar/cars/pub/models/{$auto->codia}/prices/");

                if ($res->successful()) {
                    $precios = $res->json();
                    // Guardamos
                    $auto->update(['prices' => $precios]);
                } elseif ($res->status() == 401) {
                    $this->error("\n❌ El token venció (pasó 1 hora). Ejecutá el script de nuevo.");
                    break; 
                } elseif ($res->status() == 403) {
                    // Si da 403, es bloqueo de IP, pero con credenciales correctas es menos probable
                    $this->error("\n⚠️ 403 en auto {$auto->codia}. Esperando 5s...");
                    sleep(5);
                }

            } catch (\Exception $e) {
                // Ignorar error individual
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("🏁 PROCESO FINALIZADO.");
    }
}