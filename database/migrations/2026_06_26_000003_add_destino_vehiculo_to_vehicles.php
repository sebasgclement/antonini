<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->enum('destino_vehiculo', ['STOCK_COMERCIAL', 'TALLER_CLIENTE'])
                  ->default('STOCK_COMERCIAL');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn('destino_vehiculo');
        });
    }
};
