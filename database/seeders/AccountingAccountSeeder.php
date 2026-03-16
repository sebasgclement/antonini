<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccountingAccount;
use Illuminate\Support\Facades\Schema;

class AccountingAccountSeeder extends Seeder
{
    public function run()
    {
        Schema::disableForeignKeyConstraints();
        AccountingAccount::query()->delete();
        Schema::enableForeignKeyConstraints();

        // --- 1. ACTIVO ---
        $activo = AccountingAccount::create(['code' => '1.0.0.00.000', 'name' => 'ACTIVO', 'level' => 1, 'is_selectable' => false]);
        $activoC = AccountingAccount::create(['code' => '1.1.0.00.000', 'name' => 'ACTIVO CORRIENTE', 'level' => 2, 'parent_id' => $activo->id, 'is_selectable' => false]);
        
        $cajaYBancos = AccountingAccount::create(['code' => '1.1.1.00.000', 'name' => 'CAJA Y BANCOS', 'level' => 3, 'parent_id' => $activoC->id, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '1.1.1.01.000', 'name' => 'Caja', 'level' => 4, 'parent_id' => $cajaYBancos->id, 'is_selectable' => true]);
        $bancos = AccountingAccount::create(['code' => '1.1.1.02.000', 'name' => 'Bancos', 'level' => 4, 'parent_id' => $cajaYBancos->id, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '1.1.1.02.001', 'name' => 'Banco Credicoop Cta.Cte.', 'level' => 5, 'parent_id' => $bancos->id, 'is_selectable' => true]);
        AccountingAccount::create(['code' => '1.1.1.02.002', 'name' => 'Nuevo Banco de Santa Fe Cta.Cte.', 'level' => 5, 'parent_id' => $bancos->id, 'is_selectable' => true]);

        // 👈 NUEVO: BIENES DE CAMBIO (Mercaderías)
        $bienesCambio = AccountingAccount::create(['code' => '1.1.2.00.000', 'name' => 'BIENES DE CAMBIO', 'level' => 3, 'parent_id' => $activoC->id, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '1.1.2.01.000', 'name' => 'Mercaderías', 'level' => 4, 'parent_id' => $bienesCambio->id, 'is_selectable' => true]);
        AccountingAccount::create(['code' => '1.1.2.02.000', 'name' => 'Insumos y Repuestos', 'level' => 4, 'parent_id' => $bienesCambio->id, 'is_selectable' => true]);

        // --- 2. PASIVO ---
        $pasivo = AccountingAccount::create(['code' => '2.0.0.00.000', 'name' => 'PASIVO', 'level' => 1, 'is_selectable' => false]);
        $pasivoC = AccountingAccount::create(['code' => '2.1.0.00.000', 'name' => 'PASIVO CORRIENTE', 'level' => 2, 'parent_id' => $pasivo->id, 'is_selectable' => false]);
        $deudasCom = AccountingAccount::create(['code' => '2.1.1.00.000', 'name' => 'CUENTAS POR PAGAR', 'level' => 3, 'parent_id' => $pasivoC->id, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '2.1.1.01.000', 'name' => 'Proveedores', 'level' => 4, 'parent_id' => $deudasCom->id, 'is_selectable' => true]);

        // --- 3. PATRIMONIO NETO ---
        $pn = AccountingAccount::create(['code' => '3.0.0.00.000', 'name' => 'PATRIMONIO NETO', 'level' => 1, 'is_selectable' => false]);
        $cap = AccountingAccount::create(['code' => '3.1.0.00.000', 'name' => 'CAPITAL SUSCRIPTO', 'level' => 2, 'parent_id' => $pn->id, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '3.1.1.00.000', 'name' => 'Capital Social', 'level' => 3, 'parent_id' => $cap->id, 'is_selectable' => true]);
        $res = AccountingAccount::create(['code' => '3.2.0.00.000', 'name' => 'RESULTADOS', 'level' => 2, 'parent_id' => $pn->id, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '3.2.1.00.000', 'name' => 'Resultados del Ejercicio', 'level' => 3, 'parent_id' => $res->id, 'is_selectable' => true]);

        // --- 4. RESULTADOS (INGRESOS Y GASTOS) ---
        $resultados = AccountingAccount::create(['code' => '4.0.0.00.000', 'name' => 'RESULTADOS', 'level' => 1, 'is_selectable' => false]);
        
        // INGRESOS
        $ingresos = AccountingAccount::create(['code' => '4.1.0.00.000', 'name' => 'INGRESOS', 'level' => 2, 'parent_id' => $resultados->id, 'is_selectable' => false]);
        $ventas = AccountingAccount::create(['code' => '4.1.1.00.000', 'name' => 'VENTAS', 'level' => 3, 'parent_id' => $ingresos->id, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '4.1.1.01.000', 'name' => 'Ventas de Mercaderías', 'level' => 4, 'parent_id' => $ventas->id, 'is_selectable' => true]);
        AccountingAccount::create(['code' => '4.1.1.02.000', 'name' => 'Ventas de Servicios', 'level' => 4, 'parent_id' => $ventas->id, 'is_selectable' => true]); // Agregué esta también por si las dudas

        // GASTOS
        $gastos = AccountingAccount::create(['code' => '4.2.0.00.000', 'name' => 'GASTOS', 'level' => 2, 'parent_id' => $resultados->id, 'is_selectable' => false]);
        $costos = AccountingAccount::create(['code' => '4.2.1.00.000', 'name' => 'COSTO DE VENTAS', 'level' => 3, 'parent_id' => $gastos->id, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '4.2.1.01.000', 'name' => 'Costo de Mercaderías Vendidas', 'level' => 4, 'parent_id' => $costos->id, 'is_selectable' => true]);
        
        $gastosCom = AccountingAccount::create(['code' => '4.2.2.00.000', 'name' => 'GASTOS DE COMERCIALIZACION', 'level' => 3, 'parent_id' => $gastos->id, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '4.2.2.05.000', 'name' => 'Energía Eléctrica', 'level' => 4, 'parent_id' => $gastosCom->id, 'is_selectable' => true]);
        AccountingAccount::create(['code' => '4.2.2.06.000', 'name' => 'Alquileres', 'level' => 4, 'parent_id' => $gastosCom->id, 'is_selectable' => true]);
        AccountingAccount::create(['code' => '4.2.2.11.000', 'name' => 'Gastos Posnet', 'level' => 4, 'parent_id' => $gastosCom->id, 'is_selectable' => true]);

        // --- 5. CUENTAS DE ORDEN ---
        $orden = AccountingAccount::create(['code' => '5.0.0.00.000', 'name' => 'CUENTAS DE ORDEN', 'level' => 1, 'is_selectable' => false]);
        AccountingAccount::create(['code' => '5.1.0.00.000', 'name' => 'Valores Recibidos en Caución', 'level' => 2, 'parent_id' => $orden->id, 'is_selectable' => true]);
    }

    private function calculateLevel($code) {
        if (str_ends_with($code, '.0.0.00.000')) return 1;
        if (str_ends_with($code, '.0.00.000')) return 2;
        if (str_ends_with($code, '.00.000')) return 3;
        if (str_ends_with($code, '.000')) return 4;
        return 5;
    }

    private function findParentId($code) {
        return AccountingAccount::where('code', '!=', $code)
            ->where('code', 'LIKE', substr($code, 0, 3) . '%')
            ->orderBy('level', 'desc')
            ->first()?->id;
    }
}