<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Unidades de Negocio
        if (!Schema::hasColumn('business_units', 'deleted_at')) {
            Schema::table('business_units', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // 2. Cuentas Contables
        if (!Schema::hasColumn('accounting_accounts', 'deleted_at')) {
            Schema::table('accounting_accounts', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // 3. Asientos (Cabecera)
        if (!Schema::hasColumn('accounting_entries', 'deleted_at')) {
            Schema::table('accounting_entries', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::table('business_units', fn (Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('accounting_accounts', fn (Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('accounting_entries', fn (Blueprint $table) => $table->dropSoftDeletes());
    }
};