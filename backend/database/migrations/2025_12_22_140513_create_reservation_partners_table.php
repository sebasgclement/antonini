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
        // En la función up()
    Schema::create('reservation_partners', function (Blueprint $table) {
    $table->id();
    // Relación con la reserva
    $table->foreignId('reservation_id')->constrained()->onDelete('cascade');
    
    // Datos del socio
    $table->string('full_name');
    $table->string('dni')->nullable();
    $table->string('phone')->nullable();
    
    // Ruta del archivo (la foto)
    $table->string('document_photo_path')->nullable(); 
    
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservation_partners');
    }
};
