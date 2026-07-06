<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin',    'description' => 'Rol de administrador con acceso total'],
            ['name' => 'Vendedor', 'description' => 'Rol de vendedor con acceso limitado'],
        ];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], ['description' => $role['description']]);
        }
    }
}
