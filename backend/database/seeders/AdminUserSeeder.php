<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        
        $user = User::firstOrCreate(
            ['email' => 'admin@antonini.local'],
            ['name' => 'Admin Antonini', 'password' => 'secret123'] // se hashea por el cast
        );

        
        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole && !$user->roles()->where('roles.id', $adminRole->id)->exists()) {
            $user->roles()->attach($adminRole->id);
        }
    }
}
