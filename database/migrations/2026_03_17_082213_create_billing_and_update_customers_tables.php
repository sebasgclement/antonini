<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        
        // 1. ACTUALIZAMOS CLIENTES (Solo agregamos el campo de IVA, sin romper nada)
        Schema::table('customers', function (Blueprint $t) {
            // Relación con tu tabla de responsabilidades fiscales (Monotributista, Inscripto, etc)
            $t->foreignId('tax_responsibility_id')->nullable()->constrained('tax_responsibilities');
        });

        // 2. TABLA DE FACTURAS / VENTAS
        Schema::create('invoices', function (Blueprint $t) {
            $t->id();
            $t->foreignId('customer_id')->constrained(); // A quién le facturamos
            $t->foreignId('business_unit_id')->constrained('business_units'); // Showroom o Taller
            $t->foreignId('user_id')->constrained(); // Qué usuario emitió la factura
            
            $t->string('type', 1); // A, B, C, X (Remito interno)
            $t->string('number')->nullable(); // Número de factura (Ej: 0001-00000023)
            
            $t->decimal('subtotal', 12, 2)->default(0);
            $t->decimal('iva_amount', 12, 2)->default(0);
            $t->decimal('total', 12, 2)->default(0);
            
            $t->text('notes')->nullable();
            $t->timestamps();
            $t->softDeletes();
        });

        // 3. DETALLE DE LA FACTURA (Qué llevó exactamente)
        Schema::create('invoice_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $t->foreignId('product_id')->nullable()->constrained('products'); // Qué producto (opcional si es un ítem manual)
            
            $t->string('description'); // Guardamos el nombre "congelado" al momento de la venta
            $t->integer('quantity');
            $t->decimal('unit_price', 12, 2); // Precio unitario "congelado"
            $t->decimal('subtotal', 12, 2);
            $t->timestamps();
        });

        // 4. CUENTA CORRIENTE (El historial de deudas y pagos)
        Schema::create('current_accounts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('customer_id')->constrained();
            
            // Si viene de una factura, guardamos cuál. Si es un pago suelto, queda null.
            $t->foreignId('invoice_id')->nullable()->constrained('invoices'); 
            
            $t->string('concept'); // Ej: "Factura B 0001", "Pago en Efectivo", "Nota de Crédito"
            
            $t->decimal('debit', 12, 2)->default(0);  // DEBE: Lo que nos debe (Suma deuda)
            $t->decimal('credit', 12, 2)->default(0); // HABER: Lo que nos pagó (Resta deuda)
            $t->decimal('balance', 12, 2)->default(0); // SALDO: La cuenta matemática al momento
            
            $t->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('current_accounts');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::table('customers', function (Blueprint $t) {
            $t->dropForeign(['tax_responsibility_id']);
            $t->dropColumn('tax_responsibility_id');
        });
    }
};