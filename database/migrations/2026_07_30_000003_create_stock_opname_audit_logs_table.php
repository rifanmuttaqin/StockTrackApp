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
        Schema::create('stock_opname_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('stock_opname_record_id');
            $table->uuid('user_id')->nullable();
            $table->string('action', 50);
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamp('created_at');

            $table->foreign('stock_opname_record_id')
                ->references('id')->on('stock_opname_records')->onDelete('cascade');
            $table->foreign('user_id')
                ->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_opname_audit_logs');
    }
};
