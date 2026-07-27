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
        Schema::create('whatsapp_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->boolean('is_active')->default(false)->comment('Toggle WhatsApp notifications on/off');
            $table->text('api_key')->nullable()->comment('AES-256-CBC encrypted API key');
            $table->string('api_url')->nullable()->comment('WhatsApp API base URL');
            $table->string('phone_number_id')->nullable()->comment('Phone Number ID dari WhatsApp Business');
            $table->json('message_template')->nullable()->comment('Message template with placeholders');
            $table->json('recipients')->nullable()->comment('Array of user UUIDs for notification recipients');
            $table->boolean('notify_low_stock')->default(true)->comment('Send alert on low stock');
            $table->boolean('notify_out_of_stock')->default(true)->comment('Send alert on out of stock');
            $table->integer('batch_size')->default(10)->comment('Messages per batch');
            $table->integer('batch_delay')->default(1)->comment('Delay between batches in seconds');
            $table->timestamp('last_sent_at')->nullable()->comment('Last successful notification sent');
            $table->text('last_error')->nullable()->comment('Last error message from WhatsApp API');
            $table->boolean('send_status')->default(false)->comment('Current send status: true=active, false=paused');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_settings');
    }
};
