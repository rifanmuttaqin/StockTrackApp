<?php

namespace Database\Seeders;

use App\Models\WhatsAppSetting;
use Illuminate\Database\Seeder;

class WhatsAppStockOpnameTemplateSeeder extends Seeder
{
    /**
     * Seed default stock opname template into whatsapp_settings.
     */
    public function run(): void
    {
        $settings = WhatsAppSetting::first();

        if (!$settings) {
            $this->command->warn('WhatsAppSetting record not found. Run WhatsAppSetting seeder first.');
            return;
        }

        $templates = $settings->message_template ?? [];

        // Only seed if stock_opname template doesn't exist yet
        if (isset($templates['stock_opname'])) {
            $this->command->info('stock_opname template already exists. Skipping.');
            return;
        }

        $default = WhatsAppSetting::getDefaultTemplate();

        $templates['stock_opname'] = $default['stock_opname'];

        $settings->update([
            'message_template' => $templates,
        ]);

        $this->command->info('stock_opname template seeded successfully.');
    }
}
