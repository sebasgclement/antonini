<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            
            // Datos básicos
            $table->string('brand');
            $table->string('model');
            $table->integer('year')->nullable();
            $table->string('plate')->unique();   // patente
            $table->string('vin')->nullable();   // chasis
            $table->string('color')->nullable();
            $table->integer('km')->nullable();
            $table->integer('fuel_level')->nullable();
            $table->string('fuel_type', 50)->nullable(); // Aquí daba el error antes

            // Estado y Propiedad
            $table->enum('ownership', ['propio','consignado'])->default('consignado');
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            
            // Vendedor y Tiempos
            $table->foreignId('seller_id')->nullable()->constrained('users');
            $table->timestamp('sold_at')->nullable();
            $table->enum('status', ['disponible','reservado','vendido'])->default('disponible');

            // Precios
            $table->decimal('reference_price', 12, 2)->nullable();
            $table->decimal('take_price', 12, 2)->nullable();
            $table->decimal('price', 12, 2)->nullable();

            // Checklist
            $table->boolean('check_spare')->default(false);
            $table->boolean('check_jack')->default(false);
            $table->boolean('check_tools')->default(false);
            $table->boolean('check_docs')->default(false);
            $table->text('notes')->nullable();

            // Fotos (Exterior)
            $table->string('photo_front')->nullable();
            $table->string('photo_back')->nullable();
            $table->string('photo_left')->nullable();
            $table->string('photo_right')->nullable();
            
            // Fotos (Interior)
            $table->string('photo_interior_front')->nullable();
            $table->string('photo_interior_back')->nullable();
            $table->string('photo_trunk')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};