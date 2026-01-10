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
        Schema::table('stock_out_records', function (Blueprint $table) {
            $table->string('transaction_code', 20)->nullable()->unique()->after('status');
            $table->text('note')->nullable()->after('transaction_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_out_records', function (Blueprint $table) {
            $table->dropUnique(['transaction_code']);
            $table->dropColumn(['transaction_code', 'note']);
        });
    }
};
