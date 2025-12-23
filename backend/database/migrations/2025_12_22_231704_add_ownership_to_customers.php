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
        Schema::table('customers', function (Blueprint $table) {
            // Quién es el dueño actual del cliente
            $table->unsignedBigInteger('seller_id')->nullable()->after('status');
            
            // Hasta cuándo es dueño (si es null o fecha pasada, está libre)
            $table->timestamp('locked_until')->nullable()->after('seller_id');

            // Relación con la tabla users (si borran al vendedor, el cliente queda libre)
            $table->foreign('seller_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['seller_id']);
            $table->dropColumn(['seller_id', 'locked_until']);
        });
    }
};
