<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $vehicles = [
            // === 1. TOYOTA HILUX (Disponible - CONSIGNADO) ===
            [
                'plate'           => 'AD234XS',
                'brand'           => 'Toyota',
                'model'           => 'Hilux SRX 2.8 4x4 AT',
                'year'            => 2021,
                'vin'             => '8AJFX23G800293847',
                'color'           => 'Blanco Perlado',
                'km'              => 45000,
                'fuel_level'      => 50,
                'fuel_type'       => 'diesel', // ✅ Agregado nuevo campo
                'ownership'       => 'consignado',
                'customer_id'     => 2, // Juan Pérez (dueño anterior)
                'seller_id'       => 1, // Vendedor asignado
                // 'currency'     => 'USD', ❌ ESTO YA NO VA EN VEHÍCULOS
                'reference_price' => 38000, // Precios puros
                'take_price'      => 35000,
                'price'           => 39500,
                'status'          => 'disponible',
                'check_spare'     => true,
                'check_jack'      => true,
                'check_tools'     => true,
                'check_docs'      => true,
                'notes'           => 'Impecable estado. Services oficiales.',
            ],
            
            // === 2. FIAT CRONOS (Vendido - PROPIO) ===
            [
                'plate'           => 'AG111ZZ',
                'brand'           => 'Fiat',
                'model'           => 'Cronos Drive 1.3',
                'year'            => 2023,
                'vin'             => '8AWFI123456789777',
                'color'           => 'Rojo Montecarlo',
                'km'              => 5000,
                'fuel_level'      => 100,
                'fuel_type'       => 'nafta',
                'ownership'       => 'propio',
                'customer_id'     => null,
                'seller_id'       => 1,
                // 'currency'     => 'ARS', ❌ CHAU
                'reference_price' => 18500000,
                'take_price'      => 17000000,
                'price'           => 19000000,
                'status'          => 'vendido', // Ojo, esto requeriría sold_at
                'sold_at'         => now(),     // ✅ Agregamos fecha de venta
                'check_spare'     => true,
                'check_jack'      => true,
                'notes'           => 'Unidad de flota propia.',
            ],
        ];

        foreach ($vehicles as $data) {
            Vehicle::create($data);
        }
    }
}