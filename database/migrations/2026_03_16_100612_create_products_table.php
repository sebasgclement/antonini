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
    Schema::create('products', function (Blueprint $table) {
        $table->id(); // Cod de Producto -> id auto incremental 
        
        // Discriminador: ¿Es un producto físico o un servicio (ej: Polarizado, Gestoría)? [cite: 5, 12]
        $table->enum('type', ['product', 'service'])->default('product'); 
        
        $table->string('manufacturer_code')->nullable(); // cod de Fabricante -> alfanumerico 
        $table->string('category')->nullable(); // Categoria -> alfa 
        $table->foreignId('business_unit_id')->constrained('business_units'); // Unidad de negocio a la que pertenece 
        
        $table->string('description'); // Descripcion -> alfa 
        
        // Precios y Costos
        $table->decimal('cost', 12, 2)->default(0); // Costo -> decimal 
        $table->decimal('multiplier_factor', 8, 4)->default(1); // Factor de multiplicacion -> decimal 
        $table->decimal('sale_price', 12, 2)->default(0); // Valor de Venta 
        
        // Relaciones Contables e Impuestos
        $table->foreignId('iva_id')->constrained('ivas'); // IVA -> id_iva 
        $table->foreignId('accounting_account_id')->constrained('accounting_accounts'); // Cuenta Contable 
        $table->foreignId('provider_id')->nullable()->constrained('providers'); // Proveedor (puede ser nulo si es servicio propio) 
        
        // Stock (Nullable porque los servicios no tienen stock) 
        $table->integer('quantity')->nullable(); // Cantidad 
        $table->integer('reorder_point')->nullable(); // PuntodePedido 

        $table->timestamps();
        $table->softDeletes();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
