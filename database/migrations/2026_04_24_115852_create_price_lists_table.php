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
    Schema::create('price_lists', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // Ej: "Pilkington - Federación Patronal"
        $table->unsignedBigInteger('provider_id')->nullable(); // Para saber de qué proveedor es
        $table->timestamps();
        $table->softDeletes();

        $table->foreign('provider_id')->references('id')->on('providers');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_lists');
    }
};
