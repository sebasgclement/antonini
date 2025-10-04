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

            // Relaciones
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('used_vehicle_id')->nullable()->constrained('vehicles')->onDelete('set null');

            // Datos principales
            $table->date('date')->default(now());
            $table->decimal('price', 12, 2);
            $table->decimal('deposit', 12, 2)->nullable();
            $table->string('payment_method', 50)->nullable(); // efectivo, cheque, financiado, etc.
            $table->text('payment_details')->nullable();       // detalle de cheques, créditos
            $table->text('comments')->nullable();
            $table->enum('status', ['pendiente', 'confirmada', 'anulada'])->default('pendiente');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
