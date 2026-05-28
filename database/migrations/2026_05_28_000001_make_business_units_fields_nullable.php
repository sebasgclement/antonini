<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_units', function (Blueprint $table) {
            $table->string('tax_condition')->nullable()->change();
            $table->date('start_date')->nullable()->change();
            $table->string('iibb')->nullable()->change();
            $table->string('address')->nullable()->change();
            $table->string('zip_code')->nullable()->change();
            $table->string('city')->nullable()->change();
            $table->string('province')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('business_units', function (Blueprint $table) {
            $table->string('tax_condition')->nullable(false)->change();
            $table->date('start_date')->nullable(false)->change();
            $table->string('iibb')->nullable(false)->change();
            $table->string('address')->nullable(false)->change();
            $table->string('zip_code')->nullable(false)->change();
            $table->string('city')->nullable(false)->change();
            $table->string('province')->nullable(false)->change();
        });
    }
};
