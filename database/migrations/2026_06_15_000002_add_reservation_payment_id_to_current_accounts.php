<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('current_accounts', function (Blueprint $table) {
            $table->unsignedBigInteger('reservation_payment_id')->nullable()->after('reservation_id');
            $table->foreign('reservation_payment_id')
                  ->references('id')->on('reservation_payments')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('current_accounts', function (Blueprint $table) {
            $table->dropForeign(['reservation_payment_id']);
            $table->dropColumn('reservation_payment_id');
        });
    }
};
