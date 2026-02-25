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
    Schema::table('info_auto_groups', function (Blueprint $table) {
        $table->unsignedBigInteger('infoauto_id')->after('id');
        $table->unique(['infoauto_id', 'brand_id']);
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
