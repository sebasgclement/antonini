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
        
        // Discriminador: ¿Es un producto físico o un servicio (ej: Polarizado, Mano de Obra)? 
        $table->enum('type', ['product', 'service'])->default('product');
        
        $table->string('manufacturer_code')->nullable(); // cod de Fabricante (Acá puede ir el código interno de Sekurit o Malatesta) 
        
        // --- LO NUEVO PARA CRISTALES ---
        $table->string('eurocode')->nullable(); // Código universal europeo de cristales
        $table->string('nags')->nullable(); // Código americano (vi que algunos de tus excel lo usan)
        
        $table->string('category')->nullable(); // Categoria -> alfa (Ej: Parabrisas, Luneta, Puerta) [cite: 17]
        $table->foreignId('business_unit_id')->constrained('business_units'); // Unidad de negocio a la que pertenece [cite: 17]
        
        $table->string('description'); // Descripcion -> alfa
        
        // Precios y Costos
        $table->decimal('cost', 12, 2)->default(0); // Costo -> sacado del Excel [cite: 17]
        $table->decimal('multiplier_factor', 8, 4)->default(1); // Factor de multiplicacion -> decimal [cite: 17]
        $table->decimal('sale_price', 12, 2)->default(0); // Valor de Venta [cite: 18]
        $table->date('last_price_update')->nullable(); // Fundamental para saber qué tan viejo es el precio del Excel
        
        // Relaciones Contables e Impuestos
        $table->foreignId('iva_id')->constrained('ivas'); // IVA -> id_iva [cite: 18, 19]
        $table->foreignId('accounting_account_id')->constrained('accounting_accounts'); // Cuenta Contable [cite: 19, 20]
        $table->foreignId('provider_id')->nullable()->constrained('providers'); // Proveedor (puede ser nulo si es servicio propio) [cite: 20, 21]
        
        // --- EL MANEJO DEL STOCK "BLANCO / NEGRO" ---
        // Reemplazamos el 'quantity' genérico por dos columnas separadas
        $table->integer('stock_official')->default(0); // Stock en Blanco (Facturado)
        $table->integer('stock_internal')->default(0); // Stock en Negro (Remito X)
        
        $table->integer('reorder_point')->nullable(); // PuntodePedido [cite: 22, 23]

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
