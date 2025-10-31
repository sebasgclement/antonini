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
    Schema::table('vehicles', function (Blueprint $table) {
        $table->string('photo_interior_front')->nullable()->after('photo_right');
        $table->string('photo_interior_back')->nullable()->after('photo_interior_front');
        $table->string('photo_trunk')->nullable()->after('photo_interior_back');
    });
}

public function down()
{
    Schema::table('vehicles', function (Blueprint $table) {
        $table->dropColumn(['photo_interior_front', 'photo_interior_back', 'photo_trunk']);
    });
}

};
