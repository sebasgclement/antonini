<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        // Vehicle::truncate(); // Descomentar si querés limpiar antes de cargar

        $vehicles = [
            // === 1. TOYOTA HILUX (La joya de la agencia - PROPIO - USD) ===
            [
                'plate'           => 'AE123CD', // Patente Mercosur nueva
                'brand'           => 'Toyota',
                'model'           => 'Hilux SRX 4x4',
                'year'            => 2021,
                'vin'             => '8AJFA123456789012',
                'color'           => 'Blanco Perlado',
                'km'              => 45000,
                'fuel_level'      => 80,
                'ownership'       => 'propio',
                'customer_id'     => null, 
                'currency'        => 'USD',
                'reference_price' => 38000,
                'price'           => 37500, // Precio venta
                'status'          => 'disponible',
                'check_spare'     => true,
                'check_jack'      => true,
                'check_docs'      => true,
                'notes'           => 'Impecable, cubiertas nuevas. Servicios oficiales.',
            ],

            // === 2. VW GOL TREND (El caballito de batalla - CONSIGNADO - ARS) ===
            [
                'plate'           => 'OSP456', // Patente vieja
                'brand'           => 'Volkswagen',
                'model'           => 'Gol Trend MSI',
                'year'            => 2015,
                'vin'             => '9BWAB05U123456789',
                'color'           => 'Rojo Flash',
                'km'              => 110000,
                'fuel_level'      => 25,
                'ownership'       => 'consignado',
                'customer_id'     => 1, // Pertenece a Juan Pérez
                'currency'        => 'ARS',
                'reference_price' => 9500000,
                'price'           => 9200000,
                'status'          => 'disponible',
                'check_spare'     => true,
                'check_jack'      => true,
                'check_docs'      => false, // Falta algún papel (para probar alertas)
                'notes'           => 'Detalle en paragolpe trasero. Dueño escucha ofertas.',
            ],

            // === 3. FORD RANGER (Reservada - PROPIO - USD) ===
            [
                'plate'           => 'AD555XX',
                'brand'           => 'Ford',
                'model'           => 'Ranger Limited',
                'year'            => 2020,
                'vin'             => '8AFDR123456789000',
                'color'           => 'Azul',
                'km'              => 60000,
                'fuel_level'      => 50,
                'ownership'       => 'propio',
                'customer_id'     => null,
                'currency'        => 'USD',
                'reference_price' => 32000,
                'price'           => 31000,
                'status'          => 'reservado', // Ya no se puede vender
                'check_spare'     => true,
                'check_jack'      => true,
                'check_docs'      => true,
                'notes'           => 'Seña ingresada por el cliente el Martes.',
            ],

            // === 4. PEUGEOT 208 (Auto moderno - CONSIGNADO - ARS) ===
            [
                'plate'           => 'AF999BB',
                'brand'           => 'Peugeot',
                'model'           => '208 Feline',
                'year'            => 2022,
                'vin'             => '8AD20812345678999',
                'color'           => 'Gris Aluminium',
                'km'              => 15000,
                'fuel_level'      => 90,
                'ownership'       => 'consignado',
                'customer_id'     => 2, // Pertenece a María Gómez
                'currency'        => 'ARS',
                'reference_price' => 22000000,
                'price'           => 21500000,
                'status'          => 'disponible',
                'check_spare'     => true,
                'check_jack'      => true,
                'check_docs'      => true,
                'notes'           => 'Igual a nuevo. En garantía.',
            ],

            // === 5. TOYOTA COROLLA (Vendido - Para historial) ===
            [
                'plate'           => 'AB123CC',
                'brand'           => 'Toyota',
                'model'           => 'Corolla SEG',
                'year'            => 2017,
                'vin'             => '8AJCO123456789888',
                'color'           => 'Negro',
                'km'              => 85000,
                'fuel_level'      => 40,
                'ownership'       => 'propio',
                'customer_id'     => null,
                'currency'        => 'USD',
                'reference_price' => 16000,
                'price'           => 15500,
                'status'          => 'vendido',
                'check_spare'     => true,
                'check_jack'      => true,
                'check_docs'      => true,
                'notes'           => 'Entregado la semana pasada.',
            ],
            
            // === 6. FIAT CRONOS (Económico - PROPIO - ARS) ===
            [
                'plate'           => 'AG111ZZ',
                'brand'           => 'Fiat',
                'model'           => 'Cronos Drive 1.3',
                'year'            => 2023,
                'vin'             => '8AWFI123456789777',
                'color'           => 'Rojo Montecarlo',
                'km'              => 5000,
                'fuel_level'      => 100,
                'ownership'       => 'propio',
                'customer_id'     => null,
                'currency'        => 'ARS',
                'reference_price' => 18500000,
                'price'           => 18000000,
                'status'          => 'disponible',
                'check_spare'     => true,
                'check_jack'      => true,
                'check_docs'      => true,
                'notes'           => 'Unidad de test drive, igual a 0km.',
            ]
        ];

        foreach ($vehicles as $v) {
            Vehicle::create($v);
        }
    }
}