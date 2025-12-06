<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('customers', function (Blueprint $table) {
            
            if (!Schema::hasColumn('customers', 'cuit')) {
                $table->string('cuit')->nullable()->after('doc_number');
            }
            
            if (!Schema::hasColumn('customers', 'marital_status')) {
                $table->string('marital_status')->nullable()->default('soltero')->after('cuit');
            }

            if (!Schema::hasColumn('customers', 'alt_phone')) {
                $table->string('alt_phone')->nullable()->after('phone');
            }

            if (!Schema::hasColumn('customers', 'address')) {
                $table->string('address')->nullable()->after('email');
            }

            if (!Schema::hasColumn('customers', 'city')) {
                $table->string('city')->nullable()->after('address');
            }

            if (!Schema::hasColumn('customers', 'notes')) {
                $table->text('notes')->nullable()->after('city');
            }
        });
    }

    public function down()
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['cuit', 'marital_status', 'alt_phone', 'address', 'city', 'notes']);
        });
    }
};