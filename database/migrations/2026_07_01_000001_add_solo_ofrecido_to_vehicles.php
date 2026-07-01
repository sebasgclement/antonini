<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Modificar el ENUM para agregar SOLO_OFRECIDO
        DB::statement("ALTER TABLE vehicles MODIFY COLUMN destino_vehiculo ENUM('STOCK_COMERCIAL', 'TALLER_CLIENTE', 'SOLO_OFRECIDO') DEFAULT 'STOCK_COMERCIAL'");

        // Campo para el precio pretendido por el propietario
        Schema::table('vehicles', function (Blueprint $table) {
            $table->decimal('client_asking_price', 12, 2)->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn('client_asking_price');
        });

        DB::statement("ALTER TABLE vehicles MODIFY COLUMN destino_vehiculo ENUM('STOCK_COMERCIAL', 'TALLER_CLIENTE') DEFAULT 'STOCK_COMERCIAL'");
    }
};
