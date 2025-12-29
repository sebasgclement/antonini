<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role; // Asegurate de tener esto si usás roles
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Usamos los datos REALES de producción
        $user = User::updateOrCreate(
            ['email' => 'admin@antoniniautomotores.com.ar'], // El email real
            [
                'name'     => 'Admin Antonini',
                // Acá ponemos la contraseña real que usás
                'password' => Hash::make('TuContraseñaSegura123'), 
            ]
        );

        // --- (Acá abajo sigue la lógica de roles que ya tenías) ---
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