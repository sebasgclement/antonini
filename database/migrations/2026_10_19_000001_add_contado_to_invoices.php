<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $t) {
            // Venta de contado: se cobra en el momento y no pasa por cuenta corriente
            $t->boolean('contado')->default(false)->after('fiscal_status');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $t) {
            $t->dropColumn('contado');
        });
    }
};
