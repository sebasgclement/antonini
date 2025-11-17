<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->boolean('check_key_copy')->default(false)->after('check_docs');
            $table->boolean('check_manual')->default(false)->after('check_key_copy');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['check_key_copy', 'check_manual']);
        });
    }
};
