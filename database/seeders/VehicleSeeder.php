<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $vehicles = [
            [
                'plate'           => 'ABC123',
                'brand'           => 'Toyota',
                'model'           => 'Corolla',
                'year'            => 2018,
                'vin'             => '1HGBH41JXMN109186',
                'color'           => 'Gris',
                'km'              => 85000,
                'fuel_level'      => 60,
                'ownership'       => 'propio',
                'customer_id'     => null, // propio → no asociado a cliente
                'reference_price' => 1200000,
                'price'           => 1150000,
                'status'          => 'disponible',
                'check_spare'     => true,
                'check_jack'      => true,
                'check_docs'      => true,
                'notes'           => 'Revisión técnica al día',
            ],
            [
                'plate'           => 'XYZ987',
                'brand'           => 'Ford',
                'model'           => 'Fiesta',
                'year'            => 2016,
                'vin'             => '2FAGP9CW6GH106789',
                'color'           => 'Rojo',
                'km'              => 120000,
                'fuel_level'      => 40,
                'ownership'       => 'consignado',
                'customer_id'     => 1, // asocia con cliente Juan Pérez del CustomerSeeder
                'reference_price' => 800000,
                'price'           => 780000,
                'status'          => 'vendido',
                'check_spare'     => false,
                'check_jack'      => true,
                'check_docs'      => true,
                'notes'           => 'Único dueño, servicio al día',
            ],
            [
                'plate'           => 'JKL456',
                'brand'           => 'Chevrolet',
                'model'           => 'Onix',
                'year'            => 2020,
                'vin'             => '9BG1Z1ED0LB123456',
                'color'           => 'Negro',
                'km'              => 30000,
                'fuel_level'      => 80,
                'ownership'       => 'propio',
                'customer_id'     => null,
                'reference_price' => 1500000,
                'price'           => 1490000,
                'status'          => 'reservado',
                'check_spare'     => true,
                'check_jack'      => false,
                'check_docs'      => true,
                'notes'           => 'Incluye garantía extendida',
            ],
        ];

        foreach ($vehicles as $v) {
            Vehicle::create($v);
        }
    }
}
