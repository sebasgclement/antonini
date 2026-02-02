<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InfoAutoModel;
use Illuminate\Support\Facades\Http;

class SyncInfoAuto extends Command
{
    protected $signature = 'infoauto:sync';
    protected $description = 'Reparación FINAL: Login con Basic Auth';

    public function handle()
    {
        ini_set('memory_limit', '-1');
        set_time_limit(0);

        // 1. OBTENER TOKEN ÚNICO (Usando Basic Auth)
        $this->info("🔑 Autenticando con Basic Auth (aptassoni@gmail.com)...");
        
        $user = 'aptassoni@gmail.com';
        $pass = 'oPOeKOtj2s2BRFRR';
        
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        try {
            // CAMBIO CLAVE: Usamos withBasicAuth en lugar de enviar array
            $response = Http::withBasicAuth($user, $pass)
                ->withUserAgent($userAgent)
                ->withoutVerifying()
                ->post('https://api.infoauto.com.ar/cars/auth/login');

            if ($response->failed()) {
                $this->error("❌ ERROR LOGIN: " . $response->body());
                // Intento de respaldo: A veces Basic Auth requiere enviar grant_type en el body aunque use headers
                $this->info("🔄 Probando método alternativo...");
                 $response = Http::asForm()->withBasicAuth($user, $pass)
                    ->withUserAgent($userAgent)
                    ->withoutVerifying()
                    ->post('https://api.infoauto.com.ar/cars/auth/login', ['grant_type' => 'client_credentials']);
                
                 if ($response->failed()) {
                     $this->error("❌ DEFINITIVAMENTE NO ENTRA: " . $response->body());
                     return;
                 }
            }

            $token = $response->json()['access_token'] ?? null;
            
            if (!$token) {
                 $this->error("❌ Respuesta rara (No hay token): " . $response->body());
                 return;
            }

            $this->info("✅ ¡Token obtenido! Iniciando descarga de precios...");

        } catch (\Exception $e) {
            $this->error("❌ Excepción: " . $e->getMessage());
            return;
        }

        // 2. BUSCAR AUTOS SIN PRECIO
        $autos = InfoAutoModel::where('prices', '[]')->orWhereNull('prices')->get();
        $count = $autos->count();

        if ($count === 0) {
            $this->info("✨ Base de datos completa.");
            return;
        }

        $this->info("🔧 Reparando $count autos...");
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($autos as $auto) {
            try {
                usleep(200000); // 0.2s pausas

                $res = Http::withToken($token)
                    ->withUserAgent($userAgent)
                    ->withoutVerifying()
                    ->timeout(10)
                    ->get("https://api.infoauto.com.ar/cars/pub/models/{$auto->codia}/prices/");

                if ($res->successful()) {
                    $auto->update(['prices' => $res->json()]);
                } elseif ($res->status() == 401) {
                    $this->error("\n❌ Token vencido.");
                    break; 
                }

            } catch (\Exception $e) {}
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("🏁 FIN.");
    }
}