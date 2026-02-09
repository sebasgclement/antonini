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
    Schema::create('info_auto_logs', function (Blueprint $table) {
        $table->id();
        $table->string('endpoint'); // Qué url pedimos (ej: /brands)
        $table->string('method')->default('GET'); // GET, POST, etc
        $table->integer('status_code')->nullable(); // Si respondió 200 o 500
        $table->timestamps(); // Acá se guarda la FECHA y HORA exacta
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('info_auto_logs');
    }
};
