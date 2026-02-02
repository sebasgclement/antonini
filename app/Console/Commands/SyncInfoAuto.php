<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InfoAutoModel;
use Illuminate\Support\Facades\Http;

class SyncInfoAuto extends Command
{
    protected $signature = 'infoauto:sync';
    protected $description = 'Sincronización FINAL: Login Nuevo + URL Local (/pub)';

    public function handle()
    {
        ini_set('memory_limit', '-1');
        set_time_limit(0);

        $this->info("🔄 Iniciando sincronización con lógica LOCAL...");

        // 1. LOGIN (Usamos el que confirmamos que anda: Basic Auth)
        $user = 'aptassoni@gmail.com';
        $pass = 'oPOeKOtj2s2BRFRR';
        
        $this->info("🔑 Logueando...");
        $response = Http::withBasicAuth($user, $pass)
            ->withoutVerifying()
            ->post('https://api.infoauto.com.ar/cars/auth/login');

        $token = $response->json()['access_token'] ?? null;

        if (!$token) {
            $this->error("❌ Error de Login: " . $response->body());
            return;
        }

        // 2. BUSCAR AUTOS SIN PRECIO
        $autos = InfoAutoModel::where('prices', '[]')->orWhereNull('prices')->get();
        $count = $autos->count();
        $this->info("🚀 Procesando $count autos con URL LEGACY (/cars/pub/models)...");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($autos as $auto) {
            try {
                usleep(150000); // Pausa leve

                // ⚠️ ESTA ES LA URL DE TU SCRIPT LOCAL QUE FUNCIONABA
                // https://api.infoauto.com.ar/cars/pub/models/{codia}/prices/
                $url = "https://api.infoauto.com.ar/cars/pub/models/{$auto->codia}/prices/";

                $res = Http::withToken($token)
                    ->withoutVerifying()
                    ->timeout(8)
                    ->get($url);

                if ($res->successful()) {
                    $prices = $res->json();
                    
                    // Solo guardamos si NO está vacío
                    if (!empty($prices)) {
                        $auto->prices = $prices;
                        $auto->save();
                    }
                } elseif ($res->status() == 401) {
                    $this->error("❌ Token vencido.");
                    break;
                }

            } catch (\Exception $e) {
                // Silencio
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("🏁 FIN. Si esto no carga precios, el problema es de InfoAuto.");
    }
}