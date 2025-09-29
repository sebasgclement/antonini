<?php
// database/migrations/2025_09_11_000001_create_vehicle_expenses_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('vehicle_expenses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $t->string('description');
            $t->decimal('amount', 12, 2);
            $t->date('date');
            $t->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('vehicle_expenses');
    }
};
