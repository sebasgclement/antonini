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
    Schema::create('pos_units', function (Blueprint $table) {
        $table->id();
        // Relación con la Unidad de Negocio
        $table->foreignId('business_unit_id')->constrained('business_units')->onDelete('cascade');
        $table->integer('number'); // Ej: 1, 2, 5
        $table->string('description')->nullable(); // Ej: "Sucursal Rafaela"
        $table->timestamps();
        $table->softDeletes();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_units');
    }
};
