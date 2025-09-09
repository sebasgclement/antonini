<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AdminUserSeeder extends Seeder {
  public function run(): void {
    $user = User::firstOrCreate(
      ['email'=>'admin@antonini.local'],
      ['name'=>'Admin Antonini','password'=>Hash::make('secret123')]
    );
    DB::table('role_user')->updateOrInsert(
      ['user_id'=>$user->id,'role_id'=>1],
      ['user_id'=>$user->id,'role_id'=>1]
    );
  }
}

