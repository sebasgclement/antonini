<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('customers', function (Blueprint $t) {
            $t->id();
            $t->string('first_name');
            $t->string('last_name');

            $t->string('doc_type', 10)->nullable();   // DNI / PAS
            $t->string('doc_number', 20)->nullable()->unique(); // 🔑 único
            $t->string('cuit', 20)->nullable()->unique();       // 🔑 único
            $t->string('email')->nullable()->unique();          // 🔑 único

            $t->string('phone', 40)->nullable();
            $t->string('alt_phone', 40)->nullable();
            $t->string('city', 80)->nullable();
            $t->string('address', 160)->nullable();
            $t->text('notes')->nullable();

            $t->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('customers');
    }
};
