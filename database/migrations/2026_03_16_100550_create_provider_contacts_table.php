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
    Schema::create('provider_contacts', function (Blueprint $table) {
        $table->id();
        $table->foreignId('provider_id')->constrained('providers')->onDelete('cascade');
        $table->string('full_name'); // Nombre Apellido [cite: 2]
        $table->string('phone')->nullable(); // Movil [cite: 2]
        $table->string('email')->nullable(); // mail [cite: 2]
        $table->string('sector')->nullable(); // Sector [cite: 2]
        $table->text('observations')->nullable(); // observaciones [cite: 2]
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provider_contacts');
    }
};
