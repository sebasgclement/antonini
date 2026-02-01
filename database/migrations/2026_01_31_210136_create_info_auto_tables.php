<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Crear Marcas
        Schema::create('info_auto_brands', function (Blueprint $table) {
            $table->id(); 
            $table->string('name');
            $table->string('logo_url')->nullable();
            $table->boolean('has_list_price')->default(false);
            $table->timestamps();
        });

        // 2. Crear Grupos
        Schema::create('info_auto_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained('info_auto_brands')->onDelete('cascade');
            $table->string('name');
            $table->integer('prices_from')->nullable();
            $table->integer('prices_to')->nullable();
            $table->text('summary')->nullable();
            $table->timestamps();
        });

        // 3. Crear Modelos
        Schema::create('info_auto_models', function (Blueprint $table) {
            $table->id();
            $table->integer('codia')->unique()->index();
            
            // Relaciones
            $table->foreignId('group_id')->constrained('info_auto_groups')->onDelete('cascade');
            
            // Agregamos la restricción de foreign key para brand_id también (recomendado)
            $table->foreignId('brand_id')->constrained('info_auto_brands')->onDelete('cascade');
            
            // Datos extra
            $table->string('description');
            $table->text('photo_url')->nullable();
            
            // Precios (JSON) - ¡ESTO ES LO IMPORTANTE PARA QUE NO FALLE!
            $table->json('prices')->nullable(); 
            
            // Features (Equipamiento) - ¡FALTABA ESTA!
            $table->json('features')->nullable(); 

            $table->boolean('list_price')->default(false);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('info_auto_models');
        Schema::dropIfExists('info_auto_groups');
        Schema::dropIfExists('info_auto_brands');
    }
};