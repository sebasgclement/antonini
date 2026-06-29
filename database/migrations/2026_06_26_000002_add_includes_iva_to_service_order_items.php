<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_order_items', function (Blueprint $table) {
            $table->boolean('includes_iva')->default(false)->after('subtotal');
        });
    }

    public function down(): void
    {
        Schema::table('service_order_items', function (Blueprint $table) {
            $table->dropColumn('includes_iva');
        });
    }
};
