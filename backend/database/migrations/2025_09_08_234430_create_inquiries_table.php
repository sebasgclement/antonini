<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('inquiries', function (Blueprint $t) {
      $t->id();
      $t->enum('channel',['web','whatsapp','telefono','local','otro'])->default('web');
      $t->string('name'); // si no es cliente creado
      $t->string('phone',40)->nullable();
      $t->string('email')->nullable();
      $t->unsignedBigInteger('vehicle_id')->nullable(); // reservado para futuro
      $t->text('message')->nullable();
      $t->enum('status',['nuevo','en_proceso','ganado','perdido'])->default('nuevo');
      $t->date('next_action_date')->nullable();
      $t->timestamps();
    });
  }
  public function down(): void { Schema::dropIfExists('inquiries'); }
};
