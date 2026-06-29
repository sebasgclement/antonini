<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_orders', function (Blueprint $table) {
            $table->foreignId('insurer_id')
                  ->nullable()
                  ->constrained('customers')
                  ->nullOnDelete()
                  ->after('insurance_company');

            $table->date('insurance_due_date')->nullable()->after('insurer_id');
        });
    }

    public function down(): void
    {
        Schema::table('service_orders', function (Blueprint $table) {
            $table->dropForeign(['insurer_id']);
            $table->dropColumn(['insurer_id', 'insurance_due_date']);
        });
    }
};
