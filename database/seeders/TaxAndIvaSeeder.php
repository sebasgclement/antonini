<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TaxAndIvaSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Cargar Responsabilidades Fiscales (Tax Responsibilities)
        $taxResponsibilities = [
            ['description' => 'Responsable Inscripto'],
            ['description' => 'Monotributista'],
            ['description' => 'Exento'],
            ['description' => 'Consumidor Final'],
            ['description' => 'Responsable No Inscripto'],
        ];

        foreach ($taxResponsibilities as $tr) {
            DB::table('tax_responsibilities')->updateOrInsert(['description' => $tr['description']], $tr);
        }

        // 2. Cargar Alícuotas de IVA
        $ivas = [
            ['percentage' => 21.00],
            ['percentage' => 10.50],
            ['percentage' => 27.00],
            ['percentage' => 0.00],
        ];

        foreach ($ivas as $iva) {
            DB::table('ivas')->updateOrInsert(['percentage' => $iva['percentage']], $iva);
        }
    }
}