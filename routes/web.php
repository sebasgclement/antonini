<?php

use Illuminate\Support\Facades\Route;
use App\Models\InfoAutoLog;
use Carbon\Carbon;

Route::get('/', function () {
    return view('welcome');
});

// ==============================================================================
// 🔒 ZONA SEGURA (Solo Admins Logueados)
// ==============================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {

    // 📊 PANEL DE CONTROL DE CONSUMO
    // URL: http://localhost:8080/mi-consumo
    Route::get('/mi-consumo', function () {
        // 1. Calculamos consumo de HOY
        $hoyCount = InfoAutoLog::whereDate('created_at', Carbon::today())->count();
        
        // 2. Calculamos consumo del MES ACTUAL
        $mesCount = InfoAutoLog::whereMonth('created_at', Carbon::now()->month)
                               ->whereYear('created_at', Carbon::now()->year)
                               ->count();

        // 3. Traemos los últimos 20 movimientos
        $ultimos = InfoAutoLog::latest()->take(20)->get();

        // 4. Vista HTML
        $html = "
        <div style='font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
            <h1 style='color: #333;'>🕵️‍♂️ Monitor de Costos InfoAuto</h1>
            
            <div style='display: flex; gap: 20px; margin-bottom: 30px;'>
                <div style='background: #f8f9fa; padding: 20px; flex: 1; border-radius: 8px; text-align: center;'>
                    <h3 style='margin: 0; color: #666;'>Consumo HOY</h3>
                    <p style='font-size: 3rem; margin: 10px 0; color: " . ($hoyCount > 0 ? '#d9534f' : '#5cb85c') . "; font-weight: bold;'>
                        {$hoyCount}
                    </p>
                    <small>consultas</small>
                </div>
                
                <div style='background: #e9ecef; padding: 20px; flex: 1; border-radius: 8px; text-align: center;'>
                    <h3 style='margin: 0; color: #666;'>Consumo MES</h3>
                    <p style='font-size: 3rem; margin: 10px 0; color: #333; font-weight: bold;'>
                        {$mesCount}
                    </p>
                    <small>consultas</small>
                </div>
            </div>

            <h3>📝 Últimos 20 movimientos:</h3>
            <table style='width: 100%; border-collapse: collapse; text-align: left;'>
                <thead>
                    <tr style='background: #eee;'>
                        <th style='padding: 10px;'>Hora</th>
                        <th style='padding: 10px;'>Acción / Auto</th>
                        <th style='padding: 10px;'>Estado</th>
                    </tr>
                </thead>
                <tbody>";

        foreach ($ultimos as $log) {
            $color = $log->status_code >= 200 && $log->status_code < 300 ? 'green' : 'red';
            $html .= "
                    <tr style='border-bottom: 1px solid #eee;'>
                        <td style='padding: 10px;'>{$log->created_at->format('d/m H:i:s')}</td>
                        <td style='padding: 10px;'>{$log->endpoint}</td>
                        <td style='padding: 10px; color: {$color}; font-weight: bold;'>{$log->status_code}</td>
                    </tr>";
        }

        $html .= "
                </tbody>
            </table>
            <div style='margin-top: 20px; text-align: center;'>
                <a href='/mi-consumo' style='background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🔄 Actualizar</a>
            </div>
        </div>";

        return $html;
    });

});