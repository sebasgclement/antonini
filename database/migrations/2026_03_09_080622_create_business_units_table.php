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
    Schema::create('business_units', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('reason_social');
        $table->string('logo')->nullable();
        $table->string('tax_condition'); // IVA
        $table->date('start_date');
        $table->string('cuit', 11)->unique();
        $table->string('iibb');
        $table->string('address');
        $table->string('zip_code');
        $table->string('city');
        $table->string('province');
        $table->timestamps();
        $table->softDeletes();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_units');
    }
};
