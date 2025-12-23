<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;
use App\Models\VehicleExpense;

class VehicleExpenseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buscamos los vehículos NUEVOS por las patentes que definimos antes
        $hilux  = Vehicle::where('plate', 'AE123CD')->first(); // La Hilux SRX
        $gol    = Vehicle::where('plate', 'OSP456')->first(); // El Gol con el detalle
        $ranger = Vehicle::where('plate', 'AD555XX')->first(); // La Ranger Reservada
        $cronos = Vehicle::where('plate', 'AG111ZZ')->first(); // El Cronos casi nuevo

        // 2. Cargamos gastos realistas

        // Gastos de la HILUX (Service oficial es caro)
        if ($hilux) {
            VehicleExpense::create([
                'vehicle_id'  => $hilux->id,
                'description' => 'Service Oficial 40.000km (Toyota)',
                'amount'      => 350000, // Precio realista service oficial
                'date'        => now()->subMonths(1),
            ]);
            VehicleExpense::create([
                'vehicle_id'  => $hilux->id,
                'description' => 'Limpieza de tapizados e interior',
                'amount'      => 45000,
                'date'        => now()->subWeeks(2),
            ]);
        }

        // Gastos del GOL (Tenía un detalle en paragolpe, lo reparamos)
        if ($gol) {
            VehicleExpense::create([
                'vehicle_id'  => $gol->id,
                'description' => 'Reparación de paragolpe trasero (Chapería)',
                'amount'      => 120000,
                'date'        => now()->subDays(5),
            ]);
            VehicleExpense::create([
                'vehicle_id'  => $gol->id,
                'description' => 'Verificación Policial',
                'amount'      => 25000, // Costo aprox trámite
                'date'        => now()->subDays(10),
            ]);
        }

        // Gastos de la RANGER (Solo mantenimiento básico)
        if ($ranger) {
            VehicleExpense::create([
                'vehicle_id'  => $ranger->id,
                'description' => 'Batería Nueva (Moura)',
                'amount'      => 180000,
                'date'        => now()->subMonth(),
            ]);
        }
        
        // Gastos del CRONOS (Pocos gastos, es nuevo)
        if ($cronos) {
            VehicleExpense::create([
                'vehicle_id'  => $cronos->id,
                'description' => 'Lavado Premium (Ingreso)',
                'amount'      => 15000,
                'date'        => now()->subDays(2),
            ]);
        }
    }
}