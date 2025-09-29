<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        Customer::create([
            'first_name' => 'Juan',
            'last_name'  => 'Pérez',
            'doc_type'   => 'DNI',
            'doc_number' => '30111222',
            'email'      => 'juan@example.com',
            'phone'      => '3411234567',
        ]);

        Customer::create([
            'first_name' => 'María',
            'last_name'  => 'García',
            'doc_type'   => 'DNI',
            'doc_number' => '29888444',
            'email'      => 'maria@example.com',
            'phone'      => '3419876543',
        ]);
    }
}
