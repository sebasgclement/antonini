<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('customer_events', function (Blueprint $table) {
        // Agregamos user_id, permitimos nulos (para eventos viejos) y creamos la relación
        $table->foreignId('user_id')
              ->nullable()
              ->after('customer_id') // Para que quede ordenado
              ->constrained('users')
              ->nullOnDelete();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
{
    Schema::table('customer_events', function (Blueprint $table) {
        $table->dropForeign(['user_id']);
        $table->dropColumn('user_id');
    });
}
};
