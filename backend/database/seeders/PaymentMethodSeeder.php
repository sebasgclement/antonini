<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentMethod;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['name' => 'Efectivo', 'type' => 'cash', 'requires_details' => false],
            ['name' => 'Transferencia Bancaria', 'type' => 'bank', 'requires_details' => true],
            ['name' => 'Cheque', 'type' => 'check', 'requires_details' => true],
            ['name' => 'Tarjeta Débito', 'type' => 'card', 'requires_details' => true],
            ['name' => 'Tarjeta Crédito', 'type' => 'card', 'requires_details' => true],
            ['name' => 'Crédito Banco Nación', 'type' => 'credit_bank', 'requires_details' => true],
        ];

        foreach ($methods as $m) {
            PaymentMethod::firstOrCreate(['name' => $m['name']], $m);
        }
    }
}
