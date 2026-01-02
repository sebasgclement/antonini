<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('vehicles', function (Blueprint $table) {
        // Al pasar a string, ya no importa si es 'ofrecido' o cualquier otra cosa
        $table->string('status')->default('disponible')->change();
    });
}

public function down(): void
{
    Schema::table('vehicles', function (Blueprint $table) {
        $table->enum('status', ['disponible', 'reservado', 'vendido'])->default('disponible')->change();
    });
}
};