<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccountingAccount;

class AccountingAccountSeeder extends Seeder
{
    public function run()
    {
        // 1. Definimos el Plan de Cuentas extraído de tu PDF
        $plan = [
            // NIVEL 1 
            ['code' => '1.0.0.00.000', 'name' => 'ACTIVO'],
            ['code' => '2.0.0.00.000', 'name' => 'PASIVO'],
            ['code' => '3.0.0.00.000', 'name' => 'PATRIMONIO NETO'],
            ['code' => '4.0.0.00.000', 'name' => 'RESULTADOS'],

            // NIVEL 2 - ACTIVO 
            ['code' => '1.1.0.00.000', 'name' => 'ACTIVO CORRIENTE'],
            ['code' => '1.2.0.00.000', 'name' => 'ACTIVO NO CORRIENTE'],

            // NIVEL 3 - DISPONIBILIDADES 
            ['code' => '1.1.1.00.000', 'name' => 'CAJA Y BANCOS'],
            
            // NIVEL 4 
            ['code' => '1.1.1.01.000', 'name' => 'Caja'],
            ['code' => '1.1.1.02.000', 'name' => 'Bancos'],

            // NIVEL 5 - CUENTAS IMPUTABLES (Donde se carga el dinero) 
            ['code' => '1.1.1.02.001', 'name' => 'Banco Credicoop Cta.Cte.'],
            ['code' => '1.1.1.02.002', 'name' => 'Nuevo Banco de Santa Fe Cta.Cte.'],
            
            // PASIVO [cite: 5]
            ['code' => '2.1.0.00.000', 'name' => 'PASIVOS CORRIENTES'],
            ['code' => '2.1.1.00.000', 'name' => 'DEUDAS COMERCIALES'],
            ['code' => '2.1.1.01.000', 'name' => 'Proveedores'],
        ];

        foreach ($plan as $item) {
            $level = $this->calculateLevel($item['code']);
            $parentId = $this->findParentId($item['code']);

            AccountingAccount::create([
                'code'          => $item['code'],
                'name'          => $item['name'],
                'parent_id'     => $parentId,
                'level'         => $level,
                'is_selectable' => ($level === 5), // Solo el último nivel es seleccionable para asientos
            ]);
        }
    }

    // Determina el nivel basado en los puntos (ej: 1.1.1.01.000)
    private function calculateLevel($code) {
        if (str_ends_with($code, '.0.0.00.000')) return 1;
        if (str_ends_with($code, '.0.00.000')) return 2;
        if (str_ends_with($code, '.00.000')) return 3;
        if (str_ends_with($code, '.000')) return 4;
        return 5;
    }

    // Lógica para encontrar al padre según la numeración
    private function findParentId($code) {
        // Ejemplo: Si entra 1.1.1.02.001, busca al que sea 1.1.1.02.000
        // Si es 1.0.0.00.000, no tiene padre (null)
        $parts = explode('.', $code);
        
        // Aquí podrías implementar una lógica de búsqueda por string 
        // o simplemente dejarlo manual si el plan no es gigante.
        // Por ahora, para tu MVP, te recomiendo cargarlos en orden 
        // y buscar el registro previo que coincida con el prefijo.
        
        // Búsqueda simplificada:
        return AccountingAccount::where('code', '!=', $code)
            ->where('code', 'LIKE', substr($code, 0, 3) . '%')
            ->orderBy('level', 'desc')
            ->first()?->id;
    }
}