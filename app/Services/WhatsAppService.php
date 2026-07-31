<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\StockOpnameRecord;
use App\Models\WhatsAppSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private WhatsAppSetting $settings;

    public function __construct()
    {
        $this->settings = WhatsAppSetting::getInstance();
    }

    /**
     * Send a single WhatsApp message (stub for Dex v2 API).
     *
     * @return array{success: bool, message_id: string|null, error: string|null}
     */
    public function sendMessage(string $phone, string $message): array
    {
        // Normalize phone to international format (e.g., 08xx → 628xx)
        $phone = $this->normalizePhone($phone);

        // Check if send is paused via send_status toggle
        if (!$this->settings->send_status) {
            Log::info('WhatsApp send paused - send_status is disabled', [
                'phone' => $this->maskPhone($phone),
            ]);
            return [
                'success' => false,
                'message_id' => null,
                'error' => 'WhatsApp sending is paused (send_status disabled)',
            ];
        }

        // If not active or not configured, log and return stub
        if (!$this->settings->isActiveAndConfigured()) {
            Log::info('WhatsApp service not active/configured - skipping message', [
                'phone' => $this->maskPhone($phone),
            ]);
            return [
                'success' => false,
                'message_id' => null,
                'error' => 'WhatsApp service not active or configured',
            ];
        }

        try {
            // Stub implementation for Dex v2 API
            // In production, this would be a real HTTP request to Dex v2
            Log::info('WhatsApp message sent (stub)', [
                'phone' => $this->maskPhone($phone),
                'message_preview' => substr($message, 0, 100) . '...',
                'api_url' => $this->settings->api_url,
                'phone_number_id' => $this->settings->phone_number_id,
            ]);

            // Simulate API call to Dex v2
            $response = $this->callDexApi($phone, $message);

            if ($response['success']) {
                // Update last sent timestamp and clear last_error
                $this->settings->update([
                    'last_sent_at' => now(),
                    'last_error' => null,
                ]);
            } else {
                // Record last error
                $this->settings->update([
                    'last_error' => $response['error'] ?? 'Unknown error',
                ]);
            }

            return $response;
        } catch (\Exception $e) {
            Log::error('WhatsApp message failed', [
                'phone' => $this->maskPhone($phone),
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send batch stock alerts to all configured recipients.
     *
     * @return array{sent: int, failed: int, errors: array}
     */
    public function sendBatchAlerts(ProductVariant $variant, string $type): array
    {
        $result = ['sent' => 0, 'failed' => 0, 'errors' => []];

        if (!$this->settings->is_active) {
            Log::info('WhatsApp batch alerts skipped - notifications disabled');
            return $result;
        }

        // Check if this alert type is enabled
        if ($type === 'low_stock' && !$this->settings->notify_low_stock) {
            Log::info('WhatsApp low stock alerts disabled');
            return $result;
        }

        if ($type === 'out_of_stock' && !$this->settings->notify_out_of_stock) {
            Log::info('WhatsApp out of stock alerts disabled');
            return $result;
        }

        // Get recipients
        $recipients = $this->settings->getRecipientUsers();

        if ($recipients->isEmpty()) {
            Log::info('WhatsApp no recipients configured');
            return $result;
        }

        // Build message from template
        $template = $this->getTemplateForType($type);
        $message = $this->buildMessage($template, $variant, $type);

        // Send to each recipient
        foreach ($recipients as $user) {
            $phone = $user->phone;

            if (empty($phone)) {
                Log::warning('WhatsApp recipient has no phone', [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                ]);
                $result['failed']++;
                $result['errors'][] = "User {$user->name} tidak memiliki nomor telepon. Lengkapi di menu Profile.";
                continue;
            }

            $sendResult = $this->sendMessage($phone, $message);

            if ($sendResult['success']) {
                $result['sent']++;
            } else {
                $result['failed']++;
                $result['errors'][] = "Gagal mengirim ke {$user->name}: {$sendResult['error']}";
            }
        }

        Log::info('WhatsApp batch alerts completed', [
            'variant_id' => $variant->id,
            'type' => $type,
            'sent' => $result['sent'],
            'failed' => $result['failed'],
        ]);

        return $result;
    }

    /**
     * Send stock opname notification to all configured recipients.
     *
     * @return array{sent: int, failed: int, errors: array}
     */
    public function sendStockOpnameNotification(StockOpnameRecord $record): array
    {
        $result = ['sent' => 0, 'failed' => 0, 'errors' => []];

        if (!$this->settings->is_active) {
            Log::info('WhatsApp stock opname notification skipped - notifications disabled');
            return $result;
        }

        if (!$this->settings->notify_stock_opname) {
            Log::info('WhatsApp stock opname notifications disabled');
            return $result;
        }

        $recipients = $this->settings->getRecipientUsers();

        if ($recipients->isEmpty()) {
            Log::info('WhatsApp no recipients configured for stock opname');
            return $result;
        }

        $template = $this->getTemplateForType('stock_opname');
        $message = $this->buildOpnameMessage($template, $record);

        foreach ($recipients as $user) {
            $phone = $user->phone;

            if (empty($phone)) {
                Log::warning('WhatsApp recipient has no phone', [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                ]);
                $result['failed']++;
                $result['errors'][] = "User {$user->name} tidak memiliki nomor telepon. Lengkapi di menu Profile.";
                continue;
            }

            $sendResult = $this->sendMessage($phone, $message);

            if ($sendResult['success']) {
                $result['sent']++;
            } else {
                $result['failed']++;
                $result['errors'][] = "Gagal mengirim ke {$user->name}: {$sendResult['error']}";
            }
        }

        Log::info('WhatsApp stock opname notification completed', [
            'record_id' => $record->id,
            'transaction_code' => $record->transaction_code,
            'sent' => $result['sent'],
            'failed' => $result['failed'],
        ]);

        return $result;
    }

    /**
     * Test connection by sending a test message.
     *
     * @return array{success: bool, message: string}
     */
    public function testConnection(string $phone): array
    {
        // Normalize phone to international format (e.g., 08xx → 628xx)
        $phone = $this->normalizePhone($phone);

        if (!$this->settings->isActiveAndConfigured()) {
            return [
                'success' => false,
                'message' => 'WhatsApp service belum aktif atau belum dikonfigurasi',
            ];
        }

        try {
            $template = $this->settings->message_template['test']
                ?? WhatsAppSetting::getDefaultTemplate()['test'];

            $message = $this->buildTestMessage($template);

            // For test messages, bypass send_status check - send directly
            // Test messages should always be sendable to verify API connection
            $result = $this->callDexApi($phone, $message);

            // Update settings to record test attempt
            if ($result['success']) {
                $this->settings->update([
                    'last_sent_at' => now(),
                    'last_error' => null,
                ]);
            } else {
                $this->settings->update([
                    'last_error' => $result['error'] ?? 'Unknown error',
                ]);
            }

            return [
                'success' => $result['success'],
                'message' => $result['success']
                    ? 'Pesan test berhasil dikirim'
                    : 'Gagal mengirim pesan test: ' . ($result['error'] ?? 'Unknown error'),
            ];
        } catch (\Exception $e) {
            Log::error('WhatsApp test connection failed', [
                'phone' => $this->maskPhone($phone),
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal mengirim pesan test: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get service status.
     */
    public function getStatus(): array
    {
        return [
            'is_active' => $this->settings->is_active,
            'is_configured' => $this->settings->isActiveAndConfigured(),
            'last_sent_at' => $this->settings->last_sent_at?->toISOString(),
            'send_status' => $this->settings->send_status,
            'api_configured' => !empty($this->settings->api_key) && !empty($this->settings->api_url),
            'phone_number_configured' => !empty($this->settings->phone_number_id),
            'recipients_count' => count($this->settings->recipients ?? []),
        ];
    }

    /**
     * Build message from template with placeholder replacement.
     */
    private function buildMessage(array $template, ProductVariant $variant, string $type): string
    {
        $replacements = [
            '{product_name}' => $variant->product->name ?? 'Unknown Product',
            '{variant_name}' => $variant->variant_name,
            '{stock_current}' => (string) $variant->stock_current,
            '{stock_threshold}' => (string) $variant->stock_threshold,
            '{type}' => $type === 'out_of_stock' ? 'Habis' : 'Rendah',
            '{timestamp}' => now()->format('d M Y H:i:s'),
        ];

        $body = $template['body'] ?? '';
        return str_replace(array_keys($replacements), array_values($replacements), $body);
    }

    /**
     * Build stock opname message from template with placeholder replacement.
     */
    private function buildOpnameMessage(array $template, StockOpnameRecord $record): string
    {
        $record->load(['items.productVariant.product', 'submitter']);

        $itemsDetail = '';
        $totalDifference = 0;

        foreach ($record->items as $item) {
            $variant = $item->productVariant;
            $productName = $variant->product->name ?? 'Unknown';
            $variantName = $variant->variant_name ?? '-';
            $physical = $item->physical_stock ?? '-';
            $system = $item->system_stock_submit ?? '-';
            $diff = $item->difference;
            $diffSign = $diff > 0 ? '+' : '';

            $itemsDetail .= "• {$productName} ({$variantName})\n";
            $itemsDetail .= "  Fisik: {$physical} | Sistem: {$system} | Selisih: {$diffSign}{$diff}\n";

            $totalDifference += $diff;
        }

        $totalDiffSign = $totalDifference > 0 ? '+' : '';

        $replacements = [
            '{opening}' => $template['opening'] ?? '',
            '{closing}' => $template['closing'] ?? '',
            '{transaction_code}' => $record->transaction_code,
            '{date}' => $record->date->format('d M Y'),
            '{submitted_by}' => $record->submitter->name ?? '-',
            '{items_detail}' => trim($itemsDetail),
            '{total_items}' => (string) $record->items->count(),
            '{total_difference}' => "{$totalDiffSign}{$totalDifference}",
            '{timestamp}' => now()->format('d M Y H:i:s'),
        ];

        $body = $template['body'] ?? '';
        return str_replace(array_keys($replacements), array_values($replacements), $body);
    }

    /**
     * Build test message from template.
     */
    private function buildTestMessage(array $template): string
    {
        $replacements = [
            '{timestamp}' => now()->format('d M Y H:i:s'),
        ];

        $body = $template['body'] ?? '';
        return str_replace(array_keys($replacements), array_values($replacements), $body);
    }

    /**
     * Get template for given alert type.
     */
    private function getTemplateForType(string $type): array
    {
        $templates = $this->settings->message_template ?? [];
        $default = WhatsAppSetting::getDefaultTemplate();

        return $templates[$type] ?? $default[$type] ?? ['subject' => '', 'body' => ''];
    }

    /**
     * Call Dex v2 API (stub implementation).
     */
    private function callDexApi(string $phone, string $message): array
    {
        // SimpleCMPos WhatsApp API - sendText endpoint
        $fullUrl = rtrim($this->settings->api_url, '/') . '/message/sendText/' . $this->settings->phone_number_id;

        Log::info('WhatsApp API call attempt', [
            'url' => $fullUrl,
            'phone_number_id' => $this->settings->phone_number_id,
            'number' => $this->maskPhone($phone),
        ]);

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'apikey' => $this->settings->api_key,
            ])->timeout(30)->post($fullUrl, [
                'number' => $phone,
                'text' => $message,
            ]);

            Log::info('WhatsApp API response', [
                'url' => $fullUrl,
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message_id' => $response->json('key.id', 'simplecmpos-' . uniqid()),
                    'error' => null,
                ];
            }

            // Log detailed error for debugging
            Log::error('WhatsApp API error', [
                'url' => $fullUrl,
                'status' => $response->status(),
                'response_body' => $response->body(),
                'phone_number_id' => $this->settings->phone_number_id,
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => 'API returned status ' . $response->status(),
            ];
        } catch (\Exception $e) {
            // Log the error — in stub mode, return failure so caller knows the API is unreachable
            Log::error('Dex v2 API call failed', [
                'phone' => $this->maskPhone($phone),
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => 'API call failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Mask phone number for logging.
     */
    private function maskPhone(string $phone): string
    {
        $len = strlen($phone);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }
        return str_repeat('*', $len - 4) . substr($phone, -4);
    }

    /**
     * Normalize phone number to WhatsApp international format.
     * - Remove non-digit characters
     * - Convert Indonesian local format (08xx) to international (628xx)
     * - Handle +62 prefix
     */
    private function normalizePhone(string $phone): string
    {
        // Remove all non-digit characters
        $digits = preg_replace('/\D/', '', $phone);

        // Already international with country code without +
        if (str_starts_with($digits, '62')) {
            return $digits;
        }

        // Indonesian local format: starts with 0 → replace with 62
        if (str_starts_with($digits, '0')) {
            return '62' . substr($digits, 1);
        }

        // No country code — assume Indonesian mobile (starts with 8)
        if (str_starts_with($digits, '8') && strlen($digits) >= 10) {
            return '62' . $digits;
        }

        return $digits;
    }
}