<?php
// database/migrations/2025_09_11_000000_create_vehicles_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('vehicles', function (Blueprint $t) {
            $t->id();
            $t->string('brand');
            $t->string('model');
            $t->integer('year')->nullable();
            $t->string('plate')->unique();   // patente única
            $t->string('vin')->nullable();   // chasis
            $t->string('color')->nullable();
            $t->integer('km')->nullable();
            $t->integer('fuel_level')->nullable(); // porcentaje tanque

            $t->enum('ownership', ['propio','consignado'])->default('consignado');
            $t->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();

            $t->decimal('reference_price', 12, 2)->nullable();  // precio ACARA
            $t->decimal('price', 12, 2)->nullable();            // editable admin
            $t->enum('status', ['disponible','reservado','vendido'])->default('disponible');

            // checklist de recepción
            $t->boolean('check_spare')->default(false); // rueda de auxilio
            $t->boolean('check_jack')->default(false);  // crique
            $t->boolean('check_docs')->default(false);  // documentación
            $t->text('notes')->nullable();              // notas adicionales

            $t->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('vehicles');
    }
};
