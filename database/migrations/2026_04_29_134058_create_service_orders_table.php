<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // Ej: OS-00001
            
            // Relaciones principales
            $table->foreignId('customer_id')->constrained();
            // Asumo que tu tabla de vehículos se llama 'vehicles'
            $table->foreignId('vehicle_id')->constrained(); 
            // Por si viene de un turno previo
            $table->foreignId('reservation_id')->nullable()->constrained(); 
            // El empleado/técnico que hace el trabajo
            $table->foreignId('technician_id')->nullable()->constrained('users'); 
            
            // Clasificación y Estado
            $table->enum('status', ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'])->default('pending');
            $table->enum('type', ['particular', 'insurance'])->default('particular');
            
            // Datos del Seguro (Solo se usan si type == 'insurance')
            $table->string('insurance_company')->nullable();
            $table->string('policy_number')->nullable();
            $table->string('claim_number')->nullable();
            
            // Datos del Vehículo al ingresar
            $table->integer('mileage')->nullable(); // Kilometraje
            $table->text('notes')->nullable(); // Observaciones generales
            
            // Totales contables
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_orders');
    }
};