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
    Schema::create('product_prices', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('product_id');
        $table->unsignedBigInteger('price_list_id');
        $table->decimal('price', 15, 2); // El precio de ese vidrio en esa lista
        $table->timestamps();

        $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        $table->foreign('price_list_id')->references('id')->on('price_lists')->onDelete('cascade');
        
        // Evitamos que haya dos precios repetidos para el mismo producto en la misma lista
        $table->unique(['product_id', 'price_list_id']); 
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_prices');
    }
};
