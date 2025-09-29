<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;
use App\Models\VehicleExpense;

class VehicleExpenseSeeder extends Seeder
{
    public function run(): void
    {
        // Buscar vehículos por patente
        $corolla = Vehicle::where('plate', 'ABC123')->first();
        $fiesta  = Vehicle::where('plate', 'XYZ987')->first();
        $onix    = Vehicle::where('plate', 'JKL456')->first();

        if ($corolla) {
            VehicleExpense::create([
                'vehicle_id'  => $corolla->id,
                'description' => 'Cambio de aceite y filtros',
                'amount'      => 25000,
                'date'        => now()->subMonths(2),
            ]);
            VehicleExpense::create([
                'vehicle_id'  => $corolla->id,
                'description' => 'Cambio de neumáticos',
                'amount'      => 180000,
                'date'        => now()->subMonth(),
            ]);
        }

        if ($fiesta) {
            VehicleExpense::create([
                'vehicle_id'  => $fiesta->id,
                'description' => 'Reparación de frenos',
                'amount'      => 45000,
                'date'        => now()->subMonths(3),
            ]);
        }

        if ($onix) {
            VehicleExpense::create([
                'vehicle_id'  => $onix->id,
                'description' => 'Pintura y detalles',
                'amount'      => 120000,
                'date'        => now()->subWeeks(3),
            ]);
        }
    }
}
