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
        Schema::table('vehicles', function (Blueprint $table) {
            // 🆕 Campos opcionales para fotos del vehículo
            $table->string('photo_front')->nullable()->after('notes');
            $table->string('photo_back')->nullable()->after('photo_front');
            $table->string('photo_left')->nullable()->after('photo_back');
            $table->string('photo_right')->nullable()->after('photo_left');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // 🔁 Eliminar los campos si se revierte la migración
            $table->dropColumn(['photo_front', 'photo_back', 'photo_left', 'photo_right']);
        });
    }
};
