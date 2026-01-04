<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('customer_events', function (Blueprint $table) {
        // Agregamos la columna 'completed', por defecto en falso (no completada)
        $table->boolean('completed')->default(false)->after('is_schedule');
    });
}

public function down()
{
    Schema::table('customer_events', function (Blueprint $table) {
        $table->dropColumn('completed');
    });
}
};
