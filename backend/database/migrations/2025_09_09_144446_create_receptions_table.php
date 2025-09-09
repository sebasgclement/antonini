<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('receptions', function (Blueprint $table) {
        $table->id();

        // quién registró (user)
        $table->foreignId('received_by')
            ->nullable()
            ->constrained('users')
            ->nullOnDelete();

        // referencia al cliente (dejamos sin FK por ahora para no depender de 'customers')
        $table->unsignedBigInteger('customer_id')->nullable();
        $table->string('customer_name')->nullable();
        $table->string('customer_email')->nullable();
        $table->string('customer_phone')->nullable();

        // vehículo
        $table->string('brand');
        $table->string('model');
        $table->integer('year')->nullable();
        $table->string('plate')->nullable();
        $table->string('vin')->nullable();
        $table->string('color')->nullable();
        $table->integer('km')->nullable();
        $table->unsignedTinyInteger('fuel_level')->nullable(); // 0-100

        // checklist
        $table->boolean('check_spare')->default(true);
        $table->boolean('check_jack')->default(true);
        $table->boolean('check_docs')->default(true);

        $table->text('notes')->nullable();
        $table->string('status')->default('received');

        $table->timestamps();
    });
}

};
