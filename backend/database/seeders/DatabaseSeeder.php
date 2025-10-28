<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
{
    // Usuario de prueba
    User::factory()->create([
        'name'  => 'Test User',
        'email' => 'test@example.com',
    ]);

    // Ejecutar todos los seeders
    $this->call([
        RoleSeeder::class,
        CustomerSeeder::class,
        VehicleSeeder::class,
        VehicleExpenseSeeder::class,
        AdminUserSeeder::class,
    ]);
}

}
