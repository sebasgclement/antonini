<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::create('provider_addresses', function (Blueprint $table) {
        $table->id();
        $table->foreignId('provider_id')->constrained('providers')->onDelete('cascade');
        $table->string('street'); // Calle [cite: 2]
        $table->integer('number')->nullable(); // Nro [cite: 2]
        $table->integer('floor')->nullable(); // Piso [cite: 2]
        $table->string('apartment', 10)->nullable(); // Dpto [cite: 2]
        $table->string('zip_code'); // CP [cite: 2]
        $table->foreignId('province_id')->constrained('provinces'); // IdProvincia [cite: 2]
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provider_addresses');
    }
};
