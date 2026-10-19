<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $t) {
            // string(1) no alcanzaba para NC / ND / Recibo (MySQL strict => "Data too long")
            $t->string('type', 10)->change();

            // Fiscal = pasa (o pasará) por ARCA. No fiscal = venta interna, sin asiento contable.
            $t->boolean('is_fiscal')->default(true)->after('type');
            // no_fiscal | pendiente (aún sin CAE) | autorizado | rechazado
            $t->string('fiscal_status', 20)->default('pendiente')->after('is_fiscal');
        });

        Schema::table('invoice_items', function (Blueprint $t) {
            $t->string('item_type', 10)->nullable()->after('product_id'); // product | service
            $t->decimal('iva_percentage', 5, 2)->default(21)->after('unit_price');
        });

        Schema::table('current_accounts', function (Blueprint $t) {
            $t->boolean('is_fiscal')->default(true)->after('balance');
        });
    }

    public function down(): void
    {
        Schema::table('current_accounts', function (Blueprint $t) {
            $t->dropColumn('is_fiscal');
        });

        Schema::table('invoice_items', function (Blueprint $t) {
            $t->dropColumn(['item_type', 'iva_percentage']);
        });

        Schema::table('invoices', function (Blueprint $t) {
            $t->dropColumn(['is_fiscal', 'fiscal_status']);
        });
    }
};
