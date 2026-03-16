<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Iva;
use App\Models\TaxResponsibility;
use App\Models\Product;
// Asegurate de que estos namespaces coincidan con tus modelos
use App\Models\BusinessUnit; 
use App\Models\AccountingAccount;

class InitialCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // 1. CONDICIONES DE IVA (AFIP)
        // ==========================================
        $taxResponsibilities = [
            'IVA Responsable Inscripto',
            'IVA Responsable No Inscripto',
            'IVA no Alcanzado',
            'IVA Exento',
            'Responsable Monotributo',
            'Consumidor Final',
            'Proveedor del Exterior',
            'Cliente del Exterior',
            'Monotributista Social'
        ];

        foreach ($taxResponsibilities as $desc) {
            TaxResponsibility::firstOrCreate(['description' => $desc]);
        }

        // ==========================================
        // 2. ALÍCUOTAS DE IVA
        // ==========================================
        $ivas = [
            ['percentage' => 0.00],
            ['percentage' => 10.50],
            ['percentage' => 21.00],
            ['percentage' => 27.00],
        ];

        foreach ($ivas as $iva) {
            Iva::firstOrCreate(['percentage' => $iva['percentage']]);
        }

        // ==========================================
        // 3. DEPENDENCIAS CONTABLES Y DE NEGOCIO
        // ==========================================
        // Creamos una Unidad de Negocio genérica (Datos obligatorios según migración)
        $businessUnit = BusinessUnit::firstOrCreate(
            ['cuit' => '30123456789'], // Usamos el CUIT como clave única para no duplicar
            [
                'name' => 'General / Casa Central',
                'reason_social' => 'Antonini Automotores S.A.',
                'tax_condition' => 'IVA Responsable Inscripto',
                'start_date' => '2020-01-01',
                'iibb' => '901-123456-1',
                'address' => 'Bv. Santa Fe 100',
                'zip_code' => '2300',
                'city' => 'Rafaela',
                'province' => 'Santa Fe'
            ]
        );

        // Creamos una Cuenta Contable genérica (Nivel 5, seleccionable)
        $account = AccountingAccount::firstOrCreate(
            ['code' => '4.1.1.01.000'],
            [
                'name' => 'Ventas y Servicios Generales',
                'level' => 5,
                'is_selectable' => true
            ]
        );

        // Obtenemos el ID del IVA del 21% para asignarlo por defecto
        $iva21 = Iva::where('percentage', 21.00)->first();

        // ==========================================
        // 4. CATÁLOGO DEL PDF (SERVICIOS Y PRODUCTOS)
        // ==========================================
        
        $servicios = [
            'COLOCACION DE PARABRISAS', 'COLOCACION DE LUNETA', 'COLOCACION DE VIDRIO DE PUERTA DELANTERO DERECHO',
            'COLOCACION DE VIDRIO DE PUERTA DELANTERO IZQUIERDO', 'COLOCACION DE VIDRIO DE PUERTA TRASERO DERECHO',
            'COLOCACION DE VIDRIO DE PUERTA TRASERO IZQUIERDO', 'COLOCACION DE ALETA', 'COLOCACION DE ESPEJO RETROVISOR INTERNO',
            'COLOCACION DE ESPEJO DERECHO', 'COLOCACION DE ESPEJO IZQUIERDO', 'CAMBIO DE BURLETE DE PARABRISAS',
            'CAMBIO DE BURLETE DE LUNETA', 'CAMBIO DE BURLETE DE PUERTA', 'LAVADO COMPLETO CON MOTOR Y ACONDICIONAMIENTO DE PLASTICOS',
            'LAVADO COMPLETO', 'LAVADO DE MOTOR', 'LIMPIEZA DE INTERIORES FULL', 'LIMPIEZA DE INTERIOR BASICA',
            'LAVADO COMPLETO SOLO EXTERIOR', 'PULIDO DE OPTICAS', 'TRATAMIENTO DE VIDRIO LIQUIDO', 'LAVADO Y ENCERADO EN 0 KM',
            'ABRILLANTADO DE CARROCERIA', 'REPARACION DE LEVANTA CRISTALES', 'REPARACION DE PARABRISAS', 'GRABADO DE CRISTALES',
            'CAMBIO DE ACEITE Y FILTROS', 'DESPLOTEO DE UNIDADES', 'POLARIZADO', 'POLARIZADO COMPLETO', 'PULIDO DE CARROCERIA',
            'PINTADO DE LLANTAS', 'REPINTADO DE PIEZAS', 'COLOCACION DE ESTRIBOS', 'COLOCACION DE ENGANCHES', 'PULIDO DE CRISTALES',
            'CAMBIO DE AMORTIGUADORES', 'PPF EN PATENTES', 'ABRILLANTADO DE MOTOS', 'TRATAMIENTO DE VIDRIO LIQUIDO EN MOTOS',
            'LIMPIEZA AL DETALLE DE MOTOS', 'PULIDO DE OPTICA DE MOTOS', 'COLOCACION DE ACCESORIOS', 'COLOCACION DE ESCOBILLAS DELANTERAS',
            'COLOCACION DE ESCOBILLAS TRASERAS', 'SERVICIO DE GESTORIA', 'PREPARACION PARA LA VENTA DE USADOS'
        ];

        $productos = [
            'PARABRISAS', 'LUNETA', 'VIDRIO DE PUERTA DELANTERO DERECHO', 'VIDRIO DE PUERTA DELANTERO IZQUIERDO',
            'VIDRIO DE PUERTA TRASERO DERECHO', 'VIDRIO DE PUERTA TRASERO IZQUIERDO', 'ALETA', 'ESPEJO RETROVISOR INTERNO',
            'ESPEJO RETROVISOR DERECHO', 'ESPEJO RETROVISOR IZQUIERDO', 'BURLETES VARIOS', 'LAVAPARABRISAS CONCENTRADO',
            'ESCOBILLAS DELANTERAS', 'ESCOBILLAS LUNETA', 'SELLADOR PARA CRISTALES', 'VENTA DE VEHICULOS 0KM',
            'VENTA DE VEHICULOS USADOS', 'VENTA DE MONOPATIN', 'VENTA DE BICICLETAS ELECTRICAS'
        ];

        // Sembrar Servicios
        foreach ($servicios as $servicio) {
            Product::firstOrCreate(
                ['description' => $servicio],
                [
                    'type' => 'service',
                    'cost' => 0,
                    'multiplier_factor' => 1,
                    'sale_price' => 0,
                    'iva_id' => $iva21->id,
                    'business_unit_id' => $businessUnit->id,
                    'accounting_account_id' => $account->id,
                ]
            );
        }

        // Sembrar Productos Físicos
        foreach ($productos as $producto) {
            Product::firstOrCreate(
                ['description' => $producto],
                [
                    'type' => 'product',
                    'cost' => 0,
                    'multiplier_factor' => 1,
                    'sale_price' => 0,
                    'quantity' => 0,           // Stock inicial en cero
                    'reorder_point' => 5,      // Punto de pedido genérico
                    'iva_id' => $iva21->id,
                    'business_unit_id' => $businessUnit->id,
                    'accounting_account_id' => $account->id,
                ]
            );
        }

        $this->command->info('¡Catálogo, IVAs y Responsabilidades sembrados con éxito!');
    }
}
