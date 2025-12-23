<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiamos la tabla primero para evitar duplicados en pruebas
        // Customer::truncate(); 

        $customers = [
            [
                'first_name' => 'Juan',
                'last_name'  => 'Pérez',
                'doc_number' => '20123456', // DNI
                'email'      => 'juan.perez@email.com',
                'phone'      => '3492555555',
                'address'    => 'Av. Santa Fe 123',
                'city'       => 'Rafaela',
                'province'   => 'Santa Fe',
            ],
            [
                'first_name' => 'María',
                'last_name'  => 'Gómez',
                'doc_number' => '25987654',
                'email'      => 'maria.gomez@email.com',
                'phone'      => '3492444444',
                'address'    => 'Bv. Roca 500',
                'city'       => 'Rafaela',
                'province'   => 'Santa Fe',
            ],
            [
                'first_name' => 'Roberto',
                'last_name'  => 'Sánchez',
                'doc_number' => '18456789',
                'email'      => 'roberto.s@email.com',
                'phone'      => '3492333333',
                'address'    => 'Mitre 200',
                'city'       => 'Sunchales',
                'province'   => 'Santa Fe',
            ],
        ];

        foreach ($customers as $c) {
            Customer::create($c);
        }
    }
}