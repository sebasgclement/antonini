<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('customers', function (Blueprint $table) {
            // Agregamos los campos que faltaban para el perfil completo
            $table->string('cuit')->nullable()->after('doc_number');
            $table->string('marital_status')->nullable()->default('soltero')->after('cuit'); // 'soltero', 'casado', etc.
            $table->string('alt_phone')->nullable()->after('phone');
            $table->string('address')->nullable()->after('email');
            $table->string('city')->nullable()->after('address');
            $table->text('notes')->nullable()->after('city');
        });
    }

    public function down()
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['cuit', 'marital_status', 'alt_phone', 'address', 'city', 'notes']);
        });
    }
};