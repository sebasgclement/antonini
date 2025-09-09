<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('role_user', function (Blueprint $t) {
      $t->foreignId('user_id')->constrained()->cascadeOnDelete();
      $t->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
      $t->primary(['user_id','role_id']);
    });
  }
  public function down(): void { Schema::dropIfExists('role_user'); }
};
