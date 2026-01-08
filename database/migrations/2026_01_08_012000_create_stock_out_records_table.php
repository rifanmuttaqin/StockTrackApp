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
        Schema::create('stock_out_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('date')->notNull();
            $table->string('status', 20)->default('draft')->notNull();
            $table->timestamp('created_at')->notNull();
            $table->timestamp('updated_at')->notNull();

            // Indexes
            $table->index('date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_out_records');
    }
};
