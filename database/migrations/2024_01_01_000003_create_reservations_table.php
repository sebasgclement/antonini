<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('reservations', function (Blueprint $table) {
        $table->id();

        // === RELACIONES ===
        $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
        $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
        $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('used_vehicle_id')->nullable()->constrained('vehicles')->onDelete('set null');

        // === DATOS DE LA OPERACIÓN ===
        $table->dateTime('date')->default(now());
        $table->decimal('price', 12, 2); // Precio de venta
        
        $table->string('currency')->default('ARS'); // Moneda
        $table->decimal('exchange_rate', 12, 2)->default(1); // Cotización

        // === SEGUNDO COMPRADOR (Co-Titular) ===
        $table->string('second_buyer_name')->nullable();
        $table->string('second_buyer_dni')->nullable();
        $table->string('second_buyer_phone')->nullable();

        // === TOMA DE USADO ===
        $table->decimal('used_vehicle_price', 12, 2)->nullable(); // A cuánto tomamos el usado
        $table->json('used_vehicle_checklist')->nullable(); // Estado del usado

        // === COSTOS ADICIONALES ===
        $table->decimal('transfer_cost', 12, 2)->nullable();      // Transferencia
        $table->decimal('administrative_cost', 12, 2)->nullable(); // Honorarios
        $table->decimal('workshop_expenses', 12, 2)->nullable();   // Gastos de taller

        // === FORMA DE PAGO ===
        $table->decimal('deposit', 12, 2)->nullable();      // Seña
        $table->decimal('credit_bank', 12, 2)->nullable();  // Crédito prendario
        $table->decimal('balance', 12, 2)->nullable();      // Saldo a pagar

        // Campos Legacy (compatibilidad con server)
        $table->string('payment_method', 50)->nullable(); 
        $table->text('payment_details')->nullable();      

        // === ESTADO Y OTROS ===
        $table->text('comments')->nullable();
        // Agregamos 'vendido' por si acaso el server lo usa, sino dejalo como estaba
        $table->enum('status', ['pendiente', 'confirmada', 'anulada', 'vendido'])->default('pendiente');

        $table->timestamps();
    });
}

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
