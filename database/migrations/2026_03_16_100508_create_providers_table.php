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
    Schema::create('providers', function (Blueprint $table) {
        $table->id();
        $table->string('cuit')->unique(); // Nro sin guiones - Unique [cite: 2]
        $table->foreignId('tax_responsibility_id')->constrained('tax_responsibilities'); // Tipo_responsable [cite: 2]
        $table->string('business_name'); // RazonSocial [cite: 2]
        $table->string('iibb')->nullable(); // IIBB [cite: 2]
        $table->foreignId('business_unit_id')->constrained('business_units'); // Unidad de Negocio [cite: 2]
        
        // --- LO NUEVO PARA EL TALLER ---
        $table->decimal('temporary_increase', 5, 2)->default(0); // Para clavarle un +6% preventivo hasta que llegue la lista nueva
        
        $table->timestamps();
        $table->softDeletes(); // Para no borrar proveedores definitivamente si tienen facturas [cite: 2, 3]
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('providers');
    }
};
