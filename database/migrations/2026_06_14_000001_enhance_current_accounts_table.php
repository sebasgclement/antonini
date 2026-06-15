<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('current_accounts', function (Blueprint $t) {
            // Origen del cargo (solo uno puede estar poblado a la vez)
            $t->foreignId('reservation_id')->nullable()->constrained('reservations')->nullOnDelete()->after('invoice_id');
            $t->foreignId('service_order_id')->nullable()->constrained('service_orders')->nullOnDelete()->after('reservation_id');

            // Campos que pedía la administradora en el Excel
            $t->date('payment_date')->nullable()->after('balance');           // Fecha real de pago
            $t->enum('status', ['pendiente', 'pagado'])->default('pendiente')->after('payment_date');
            $t->text('notes')->nullable()->after('status');                   // Observaciones
        });
    }

    public function down(): void
    {
        Schema::table('current_accounts', function (Blueprint $t) {
            $t->dropForeign(['reservation_id']);
            $t->dropForeign(['service_order_id']);
            $t->dropColumn(['reservation_id', 'service_order_id', 'payment_date', 'status', 'notes']);
        });
    }
};
