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
        $table->boolean('check_tools')->default(false)->after('check_jack');
    });
}

public function down(): void
{
    Schema::table('vehicles', function (Blueprint $table) {
        $table->dropColumn('check_tools');
    });
}

};
