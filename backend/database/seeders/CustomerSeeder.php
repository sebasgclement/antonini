<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        // Cliente 1: Consumidor Final (para ventas rápidas)
        Customer::create([
            'user_id'    => 1, // Creado por Admin
            'seller_id'  => 1, // Asignado a Admin
            'first_name' => 'Consumidor',
            'last_name'  => 'Final',
            'doc_type'   => 'DNI',
            'doc_number' => '00000000',
            'email'      => 'cf@antonini.local',
            'phone'      => '0000000000',
            'address'    => 'Mostrador',
            'city'       => 'Rafaela',
            // 'province' => 'Santa Fe',
            //'status'     => 'activo',
        ]);

        // Cliente 2: Juan Pérez (Ejemplo real)
        Customer::create([
            'user_id'    => 1,
            'seller_id'  => 1,
            'first_name' => 'Juan',
            'last_name'  => 'Pérez',
            'doc_type'   => 'DNI',
            'doc_number' => '20123456',
            'email'      => 'juan.perez@email.com',
            'phone'      => '3492555555',
            'address'    => 'Av. Santa Fe 123',
            'city'       => 'Rafaela',
            // 'province' => 'Santa Fe', 
            //'status'     => 'activo',
            'notes'      => 'Cliente interesado en camionetas.',
        ]);
    }
}