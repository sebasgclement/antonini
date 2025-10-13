<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // ID del vendedor (relación con users)
            $table->foreignId('seller_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete()
                  ->after('customer_id');

            // Fecha en la que se vendió la unidad
            $table->timestamp('sold_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('seller_id');
            $table->dropColumn('sold_at');
        });
    }
};
