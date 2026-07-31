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
        Schema::create('stock_opname_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('stock_opname_record_id');
            $table->uuid('product_variant_id');
            $table->integer('system_stock_draft');
            $table->integer('system_stock_submit')->default(0);
            $table->integer('physical_stock')->nullable();
            $table->integer('difference')->nullable();
            $table->timestamps();

            $table->foreign('stock_opname_record_id')
                ->references('id')->on('stock_opname_records')->onDelete('cascade');
            $table->foreign('product_variant_id')
                ->references('id')->on('product_variants')->onDelete('restrict');

            $table->unique(['stock_opname_record_id', 'product_variant_id'], 'uq_opname_record_variant');
            $table->index('stock_opname_record_id');
            $table->index('product_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
    }
};
