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
        $table->string('cuit')->unique(); // Nro sin guiones - Unique 
        $table->foreignId('tax_responsibility_id')->constrained('tax_responsibilities'); // Tipo_responsable 
        $table->string('business_name'); // RazonSocial 
        $table->string('iibb')->nullable(); // IIBB 
        $table->foreignId('business_unit_id')->constrained('business_units'); // Unidad de Negocio 
        $table->timestamps();
        $table->softDeletes(); // Para no borrar proveedores definitivamente si tienen facturas
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
