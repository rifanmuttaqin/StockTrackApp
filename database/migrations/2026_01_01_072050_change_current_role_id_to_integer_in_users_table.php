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
        Schema::table('users', function (Blueprint $table) {
            // Drop the index first
            $table->dropIndex(['current_role_id']);

            // Change the column type from UUID to integer
            $table->dropColumn('current_role_id');
            $table->unsignedBigInteger('current_role_id')->nullable()->after('remember_token');

            // Add the index back
            $table->index('current_role_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the index first
            $table->dropIndex(['current_role_id']);

            // Change the column type back to UUID
            $table->dropColumn('current_role_id');
            $table->uuid('current_role_id')->nullable()->after('remember_token');

            // Add the index back
            $table->index('current_role_id');
        });
    }
};
