<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
    Schema::create('customers', function (Blueprint $t) {
        $t->id();

        // ⚠️ RELACIONES (Faltaban en tu original)
        // El usuario que lo cargó (puede ser nullable si importamos datos viejos)
        $t->foreignId('user_id')->nullable()->constrained(); 
        // El vendedor asignado actualmente (Lead owner)
        $t->foreignId('seller_id')->nullable()->constrained('users');
        // Hasta cuándo el vendedor es dueño exclusivo del cliente
        $t->dateTime('locked_until')->nullable();

        $t->string('first_name');
        $t->string('last_name');

        $t->string('doc_type', 10)->nullable();   // DNI / PAS
        $t->string('doc_number', 20)->nullable()->unique(); // 🔑 único
        $t->string('cuit', 20)->nullable()->unique();       // 🔑 único
        $t->string('email')->nullable()->unique();          // 🔑 único
        
        $t->string('marital_status')->nullable(); // (Agregado por si acaso lo usa el modelo)

        $t->string('phone', 40)->nullable();
        $t->string('alt_phone', 40)->nullable();
        $t->string('city', 80)->nullable();
        $t->string('address', 160)->nullable();
        $t->text('notes')->nullable();

        // ⚠️ FOTOS DNI (Lo que estaba en el parche)
        $t->string('dni_front')->nullable();
        $t->string('dni_back')->nullable();

        $t->timestamps();
    });
}

    public function down(): void {
        Schema::dropIfExists('customers');
    }
};
