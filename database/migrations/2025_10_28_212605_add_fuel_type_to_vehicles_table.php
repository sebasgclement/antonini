<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('vehicles', function (Blueprint $table) {
        $table->string('fuel_type', 50)->nullable()->after('km');
    });
}

public function down(): void
{
    Schema::table('vehicles', function (Blueprint $table) {
        $table->dropColumn('fuel_type');
    });
}

};
