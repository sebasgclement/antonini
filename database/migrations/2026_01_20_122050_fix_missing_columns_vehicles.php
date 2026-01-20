<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // Solo agrega la columna si NO existe
            if (!Schema::hasColumn('vehicles', 'check_key_copy')) {
                $table->boolean('check_key_copy')->default(0)->after('check_docs'); 
            }
            // Agregá esta también por las dudas, que suele ir junto
            if (!Schema::hasColumn('vehicles', 'check_manual')) {
                $table->boolean('check_manual')->default(0);
            }
        });
    }

    public function down()
    {
        // En el rollback, borramos las columnas si existen
        Schema::table('vehicles', function (Blueprint $table) {
            if (Schema::hasColumn('vehicles', 'check_key_copy')) {
                $table->dropColumn('check_key_copy');
            }
            if (Schema::hasColumn('vehicles', 'check_manual')) {
                $table->dropColumn('check_manual');
            }
        });
    }
};