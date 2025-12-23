<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Llamamos solo a los seeders de datos reales para la demo
        $this->call([
            CustomerSeeder::class,       // 1. Clientes (necesario para asignar dueños)
            VehicleSeeder::class,        // 2. Vehículos (Hilux, Gol, etc.)
            VehicleExpenseSeeder::class, // 3. Gastos asociados a esos vehículos
            PaymentMethodSeeder::class,  // 4. Métodos de pago actualizados
        ]);
    }
}