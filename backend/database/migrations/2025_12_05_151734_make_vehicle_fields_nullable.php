<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // Hacemos nullables los campos para que acepten vacíos
            $table->string('plate')->nullable()->change();
            $table->string('vin')->nullable()->change();
            
            // Ojo: Asegurate que 'chassis' y 'motor' existan en tu tabla original.
            // Si no existen, borrá estas dos líneas para que no de error.
            if (Schema::hasColumn('vehicles', 'chassis')) {
                $table->string('chassis')->nullable()->change();
            }
            if (Schema::hasColumn('vehicles', 'motor')) {
                $table->string('motor')->nullable()->change();
            }

            $table->decimal('reference_price', 15, 2)->nullable()->change();
            $table->decimal('take_price', 15, 2)->nullable()->change();
            $table->decimal('price', 15, 2)->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // Volvemos a hacerlos OBLIGATORIOS (nullable false)
            // Esto es necesario si alguna vez hacés un rollback (php artisan migrate:rollback)
            
            $table->string('plate')->nullable(false)->change();
            $table->string('vin')->nullable(false)->change();
            
            if (Schema::hasColumn('vehicles', 'chassis')) {
                $table->string('chassis')->nullable(false)->change();
            }
            if (Schema::hasColumn('vehicles', 'motor')) {
                $table->string('motor')->nullable(false)->change();
            }

            $table->decimal('reference_price', 15, 2)->nullable(false)->change();
            $table->decimal('take_price', 15, 2)->nullable(false)->change();
            $table->decimal('price', 15, 2)->nullable(false)->change();
        });
    }
};