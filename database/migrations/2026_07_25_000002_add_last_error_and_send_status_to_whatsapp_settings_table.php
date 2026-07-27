<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * NOTE: Columns `last_error` and `send_status` are defined in the base migration
     * but may be missing if the table was created from an older version.
     * This migration adds them if they don't exist.
     */
    public function up(): void
    {
        Schema::table('whatsapp_settings', function (Blueprint $table) {
            // Add last_error column if it doesn't exist
            if (!Schema::hasColumn('whatsapp_settings', 'last_error')) {
                $table->text('last_error')->nullable()->after('last_sent_at')
                    ->comment('Last error message from WhatsApp API');
            }

            // Add send_status column if it doesn't exist
            if (!Schema::hasColumn('whatsapp_settings', 'send_status')) {
                $table->boolean('send_status')->default(false)->after('batch_delay')
                    ->comment('Current send status: true=active, false=paused');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whatsapp_settings', function (Blueprint $table) {
            $table->dropColumn(['last_error', 'send_status']);
        });
    }
};
