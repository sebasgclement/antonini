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
    Schema::create('accounting_entries', function (Blueprint $table) {
        $table->id();
        $table->date('entry_date');
        $table->string('description');
        $table->string('reference')->nullable();
        $table->foreignId('user_id')->constrained(); 
        $table->timestamps();
    });

    Schema::create('accounting_entry_items', function (Blueprint $table) {
        $table->id();
        $table->foreignId('accounting_entry_id')->constrained()->onDelete('cascade');
        // IMPORTANTE: Asegurate que el nombre de la tabla sea 'accounting_accounts'
        $table->foreignId('accounting_account_id')->constrained('accounting_accounts'); 
        $table->decimal('debit', 15, 2)->default(0);
        $table->decimal('credit', 15, 2)->default(0);
        $table->timestamps();
        $table->softDeletes();
    });
}

public function down(): void
{
    // EL ORDEN IMPORTA: Primero los items, luego la cabecera
    Schema::dropIfExists('accounting_entry_items');
    Schema::dropIfExists('accounting_entries');
}
};
