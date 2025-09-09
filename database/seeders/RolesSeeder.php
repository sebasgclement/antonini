<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder {
  public function run(): void {
    DB::table('roles')->upsert([
      ['id'=>1,'name'=>'ADMIN','description'=>'Administrador'],
      ['id'=>2,'name'=>'VENDEDOR','description'=>'Vendedor'],
    ], ['id']);
  }
}

