<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $t) {
            // Precio en ARS congelado al momento de la operación
            $t->decimal('price_ars', 15, 2)->nullable()->after('price');
        });

        Schema::table('reservation_payments', function (Blueprint $t) {
            $t->enum('currency', ['ARS', 'USD'])->default('ARS')->after('amount');
            $t->decimal('exchange_rate', 10, 4)->nullable()->after('currency');
            $t->decimal('amount_ars', 15, 2)->nullable()->after('exchange_rate');
        });

        // Backfill: reservas existentes
        DB::statement("
            UPDATE reservations
            SET price_ars = CASE
                WHEN currency = 'USD' AND exchange_rate > 0 THEN price * exchange_rate
                ELSE price
            END
            WHERE price_ars IS NULL
        ");

        // Backfill: pagos existentes (todos eran en ARS)
        DB::statement("UPDATE reservation_payments SET amount_ars = amount WHERE amount_ars IS NULL");
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $t) {
            $t->dropColumn('price_ars');
        });

        Schema::table('reservation_payments', function (Blueprint $t) {
            $t->dropColumn(['currency', 'exchange_rate', 'amount_ars']);
        });
    }
};
