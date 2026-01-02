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
        // parent_id: para que un evento "futuro" sepa de qué acción "presente" nació
        $table->unsignedBigInteger('parent_id')->nullable()->after('id');
        // is_schedule: para separar paja de trigo (historial vs agenda)
        $table->boolean('is_schedule')->default(false)->after('description');

        // Índice para que la base vuele al buscar hijos
        $table->foreign('parent_id')->references('id')->on('customer_events')->onDelete('cascade');
    });
}

public function down(): void
{
    Schema::table('customer_events', function (Blueprint $table) {
        $table->dropForeign(['parent_id']);
        $table->dropColumn(['parent_id', 'is_schedule']);
    });
}
};
