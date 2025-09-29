<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Crea o actualiza el usuario admin
        $user = User::updateOrCreate(
            ['email' => 'admin@antonini.local'],
            [
                'name'     => 'Admin Antonini',
                'password' => Hash::make('secret123'),
            ]
        );

        // Busca el rol por name
        $adminRole = Role::where('name', 'Admin')->first();

        // Lo crea si no existe
        if (!$adminRole) {
            $adminRole = Role::create([
                'name'        => 'Admin',
                'description' => 'Rol de administrador con acceso total',
            ]);
        }

        // Vincula el rol al usuario si todavía no lo tiene
        if (!$user->roles()->where('roles.id', $adminRole->id)->exists()) {
            $user->roles()->attach($adminRole->id);
        }
    }
}
