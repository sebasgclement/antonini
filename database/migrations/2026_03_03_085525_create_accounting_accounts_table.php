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
        Schema::create('accounting_accounts', function (Blueprint $table) {
    $table->id();
    $table->string('code'); // Ej: 1.1.1.01.000
    $table->string('name'); // Ej: Caja
    // Relación jerárquica
    $table->unsignedBigInteger('parent_id')->nullable();
    // Metadatos contables
    $table->integer('level'); // Para saber si es nivel 1, 2, 3, 4 o 5
    $table->boolean('is_selectable')->default(false); // Solo las cuentas de último nivel reciben asientos
    $table->timestamps();

    $table->foreign('parent_id')->references('id')->on('accounting_accounts');
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounting_accounts');
    }
};
