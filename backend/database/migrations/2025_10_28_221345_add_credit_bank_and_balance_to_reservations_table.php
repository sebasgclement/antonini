<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->decimal('credit_bank', 12, 2)->nullable()->after('deposit');
            $table->decimal('balance', 12, 2)->nullable()->after('credit_bank');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['credit_bank', 'balance']);
        });
    }
};
