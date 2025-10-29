<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('vehicle_expenses', function (Blueprint $table) {
            $table->enum('status', ['no_pagado', 'pagado'])
                  ->default('no_pagado')
                  ->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_expenses', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};

