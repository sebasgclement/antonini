<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('reservations', function (Blueprint $table) {
            // 💰 Costos y Moneda
            // Gastos de Transferencia (Lo que cobra el registro/gestor - Salida de dinero)
            $table->decimal('transfer_cost', 15, 2)->nullable()->default(0)->after('price'); 
            
            // Gastos Administrativos (Honorarios de la agencia - Ganancia extra)
            $table->decimal('administrative_cost', 15, 2)->nullable()->default(0)->after('transfer_cost'); 

            $table->string('currency', 3)->default('ARS')->after('administrative_cost'); // ARS o USD
            $table->decimal('exchange_rate', 15, 2)->nullable()->after('currency'); // Cotización

            // 👥 Segundo Titular / Cónyuge
            $table->string('second_buyer_name')->nullable()->after('customer_id');
            $table->string('second_buyer_dni')->nullable()->after('second_buyer_name');
            $table->string('second_buyer_phone')->nullable()->after('second_buyer_dni');
            
            // 📋 Checklist del Usado (Documentación entregada)
            $table->json('used_vehicle_checklist')->nullable()->after('used_vehicle_id');
        });
    }

    public function down()
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn([
                'transfer_cost', 
                'administrative_cost',
                'currency', 
                'exchange_rate', 
                'second_buyer_name', 
                'second_buyer_dni', 
                'second_buyer_phone',
                'used_vehicle_checklist'
            ]);
        });
    }
};