<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('vehicle_expenses') && !Schema::hasColumn('vehicle_expenses', 'status')) {
            Schema::table('vehicle_expenses', function (Blueprint $table) {
                $table->enum('status', ['no_pagado', 'pagado'])->default('no_pagado')->after('amount');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('vehicle_expenses', 'status')) {
            Schema::table('vehicle_expenses', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
