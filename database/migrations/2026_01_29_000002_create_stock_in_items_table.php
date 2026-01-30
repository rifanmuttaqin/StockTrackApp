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
        Schema::create('stock_in_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('stock_in_record_id')->notNull();
            $table->uuid('product_variant_id')->notNull();
            $table->integer('quantity')->notNull();
            $table->timestamp('created_at')->notNull();
            $table->timestamp('updated_at')->notNull();

            // Foreign keys
            $table->foreign('stock_in_record_id')
                  ->references('id')
                  ->on('stock_in_records')
                  ->onDelete('cascade');

            $table->foreign('product_variant_id')
                  ->references('id')
                  ->on('product_variants')
                  ->onDelete('restrict');

            // Indexes
            $table->index('stock_in_record_id');
            $table->index('product_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_in_items');
    }
};
