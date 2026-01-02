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
        // 1. Definimos qué usuario crear según el entorno
        if (app()->isProduction()) {
            $email = 'admin@antoniniautomotores.com.ar';
            $password = 'TuContraseñaSeguraReal'; // La que use el jefe
            $name = 'Admin Antonini';
        } else {
            $email = 'admin@antonini.local';
            $password = 'secret123'; // La que tenés en el front (isDev)
            $name = 'Admin Dev Local';
        }

        // 2. Creamos o actualizamos el usuario
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'     => $name,
                'password' => Hash::make($password),
            ]
        );

        // 3. Lógica de Roles (se mantiene igual)
        $adminRole = Role::where('name', 'Admin')->first();
        if (!$adminRole) {
            $adminRole = Role::create([
                'name'        => 'Admin',
                'description' => 'Rol de administrador con acceso total',
            ]);
        }

        if (!$user->roles()->where('roles.id', $adminRole->id)->exists()) {
            $user->roles()->attach($adminRole->id);
        }
    }
}