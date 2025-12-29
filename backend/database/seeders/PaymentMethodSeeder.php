<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentMethod;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiamos tabla (opcional)
        // PaymentMethod::truncate();

        $methods = [
            // === EFECTIVO ===
            ['name' => 'Efectivo Pesos', 'type' => 'cash', 'requires_details' => false],
            ['name' => 'Efectivo Dólares', 'type' => 'cash', 'requires_details' => false],
            
            // === DIGITAL / BANCOS ===
            ['name' => 'Transferencia Bancaria', 'type' => 'bank', 'requires_details' => true],
            ['name' => 'MercadoPago', 'type' => 'app', 'requires_details' => true],
            
            // === CHEQUES (Muy común en el rubro) ===
            ['name' => 'Cheque Propio', 'type' => 'check', 'requires_details' => true],
            ['name' => 'Cheque Terceros', 'type' => 'check', 'requires_details' => true],
            
            // === TARJETAS ===
            ['name' => 'Tarjeta Débito', 'type' => 'card', 'requires_details' => true],
            ['name' => 'Tarjeta Crédito', 'type' => 'card', 'requires_details' => true],
            
            // === FINANCIACIÓN ===
            ['name' => 'Crédito Prendario', 'type' => 'credit_bank', 'requires_details' => true],
        ];

        foreach ($methods as $m) {
            PaymentMethod::firstOrCreate(['name' => $m['name']], $m);
        }
    }
}