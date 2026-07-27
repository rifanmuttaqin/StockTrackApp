<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\WhatsAppSettingUpdateRequest;
use App\Models\WhatsAppSetting;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppSettingController extends Controller
{
    public function __construct(
        private WhatsAppService $whatsappService
    ) {}

    /**
     * Display WhatsApp settings page.
     */
    public function index(): Response
    {
        $settings = WhatsAppSetting::getInstance();

        $users = \App\Models\User::select('id', 'name', 'email')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $status = $this->whatsappService->getStatus();

        // Load default template if not set
        if (empty($settings->message_template)) {
            $defaultTemplate = WhatsAppSetting::getDefaultTemplate();
        } else {
            $defaultTemplate = $settings->message_template;
        }

        return Inertia::render('Settings/WhatsApp/Index', [
            'settings' => [
                'id' => $settings->id,
                'is_active' => (bool) $settings->is_active,
                'api_url' => $settings->api_url,
                'phone_number_id' => $settings->phone_number_id,
                'message_template' => $defaultTemplate,
                'recipients' => $settings->recipients ?? [],
                'notify_low_stock' => (bool) $settings->notify_low_stock,
                'notify_out_of_stock' => (bool) $settings->notify_out_of_stock,
                'batch_size' => $settings->batch_size,
                'batch_delay' => $settings->batch_delay,
                'last_sent_at' => $settings->last_sent_at?->toISOString(),
                'last_error' => $settings->last_error,
                'send_status' => (bool) $settings->send_status,
                'has_api_key' => !empty($settings->api_key),
            ],
            'users' => $users,
            'status' => $status,
            'defaultTemplate' => WhatsAppSetting::getDefaultTemplate(),
        ]);
    }

    /**
     * Update WhatsApp settings.
     */
    public function update(WhatsAppSettingUpdateRequest $request): RedirectResponse
    {
        try {
            $settings = WhatsAppSetting::getInstance();
            $validated = $request->validated();

            // Only update api_key if explicitly provided (don't clear it on empty)
            if ($request->has('api_key') && !empty($request->input('api_key'))) {
                $validated['api_key'] = $request->input('api_key');
            } else {
                unset($validated['api_key']);
            }

            $settings->update($validated);

            Log::info('WhatsApp settings updated', [
                'updated_by' => Auth::id(),
                'settings_id' => $settings->id,
            ]);

            return back()->with('success', 'Pengaturan WhatsApp berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Failed to update WhatsApp settings', [
                'error' => $e->getMessage(),
                'updated_by' => Auth::id(),
            ]);

            return back()->with('error', 'Gagal memperbarui pengaturan: ' . $e->getMessage());
        }
    }

    /**
     * Test WhatsApp connection.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string|min:10|max:20',
        ]);

        try {
            $result = $this->whatsappService->testConnection($request->input('phone'));

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : 422);
        } catch (\Exception $e) {
            Log::error('WhatsApp test connection failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim pesan test: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get WhatsApp service status.
     */
    public function status(): JsonResponse
    {
        $status = $this->whatsappService->getStatus();

        return response()->json([
            'success' => true,
            'status' => $status,
        ]);
    }

    /**
     * Get WhatsApp delivery log.
     *
     * NOTE: WhatsAppLog model, migration, and Log.jsx page are not yet implemented.
     * This endpoint returns a placeholder response until the full logging feature is built.
     * TODO: Implement WhatsAppLog model, migration, and Log.jsx page (PRD section 17.8)
     */
    public function log(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Fitur WhatsApp log belum diimplementasi.',
            'logs' => [],
            'pagination' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 15,
                'total' => 0,
                'from' => null,
                'to' => null,
            ],
        ]);
    }
}