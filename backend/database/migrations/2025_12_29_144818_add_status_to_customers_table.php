<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('customers', function (Blueprint $table) {
        // Agregamos la columna que falta, definiendo un valor por defecto
        if (!Schema::hasColumn('customers', 'status')) {
            $table->string('status')->default('active')->after('last_name');
        }
    });
}

public function down(): void
{
    Schema::table('customers', function (Blueprint $table) {
        $table->dropColumn('status');
    });
}
};
