<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class WhatsAppSettingUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only users with manage_settings permission can update
        return $this->user()->can('manage_settings') || $this->user()->hasRole('admin');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'is_active' => 'sometimes|boolean',
            'api_key' => 'nullable|string|max:255',
            'api_url' => 'nullable|url|max:500',
            'phone_number_id' => 'nullable|string|max:50',
            'message_template' => 'nullable|array',
            'message_template.low_stock' => 'nullable|array',
            'message_template.low_stock.subject' => 'nullable|string|max:255',
            'message_template.low_stock.body' => 'nullable|string|max:1000',
            'message_template.out_of_stock' => 'nullable|array',
            'message_template.out_of_stock.subject' => 'nullable|string|max:255',
            'message_template.out_of_stock.body' => 'nullable|string|max:1000',
            'message_template.test' => 'nullable|array',
            'message_template.test.subject' => 'nullable|string|max:255',
            'message_template.test.body' => 'nullable|string|max:1000',
            'recipients' => 'nullable|array',
            'recipients.*' => 'exists:users,id',
            'notify_low_stock' => 'sometimes|boolean',
            'notify_out_of_stock' => 'sometimes|boolean',
            'batch_size' => 'nullable|integer|min:1|max:100',
            'batch_delay' => 'nullable|integer|min:1|max:60',
            'send_status' => 'sometimes|boolean',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $this->validateConditionalRequired($validator);
        });
    }

    /**
     * Conditional validation: api_key, phone_number_id, and valid recipients required when is_active = true
     */
    private function validateConditionalRequired(Validator $validator): void
    {
        $isActive = $this->boolean('is_active');

        if ($isActive) {
            // api_key only required if no existing key is stored
            // (controller preserves existing key when field is empty)
            $existingSetting = \App\Models\WhatsAppSetting::first();
            $hasExistingKey = $existingSetting && !empty($existingSetting->api_key);

            if (empty($this->input('api_key')) && !$hasExistingKey) {
                $validator->errors()->add('api_key', 'API Key wajib diisi ketika notifikasi WhatsApp diaktifkan');
            }

            if (empty($this->input('api_url'))) {
                $validator->errors()->add('api_url', 'API URL wajib diisi ketika notifikasi WhatsApp diaktifkan');
            }

            if (empty($this->input('phone_number_id'))) {
                $validator->errors()->add('phone_number_id', 'Instance ID wajib diisi ketika notifikasi WhatsApp diaktifkan');
            }

            if (empty($this->input('recipients')) || empty(array_filter($this->input('recipients')))) {
                $validator->errors()->add('recipients', 'Minimal 1 penerima wajib dipilih ketika notifikasi WhatsApp diaktifkan');
            } else {
                // Validate that selected recipients have phone numbers
                $recipientIds = array_filter($this->input('recipients'));
                $usersWithoutPhone = \App\Models\User::whereIn('id', $recipientIds)
                    ->where(function ($query) {
                        $query->whereNull('phone')->orWhere('phone', '');
                    })
                    ->pluck('name')
                    ->toArray();

                if (!empty($usersWithoutPhone)) {
                    $validator->errors()->add(
                        'recipients',
                        'Penerima berikut belum memiliki nomor telepon: ' . implode(', ', $usersWithoutPhone) . '. Lengkapi nomor telepon di menu Profile.'
                    );
                }
            }
        }
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'is_active.boolean' => 'Status aktif harus berupa boolean',
            'api_key.max' => 'API Key maksimal 255 karakter',
            'api_url.url' => 'API URL harus berupa URL yang valid',
            'api_url.max' => 'API URL maksimal 500 karakter',
            'phone_number_id.max' => 'Phone Number ID maksimal 50 karakter',
            'message_template.array' => 'Template pesan harus berupa JSON yang valid',
            'message_template.*.subject.max' => 'Subjek pesan maksimal 255 karakter',
            'message_template.*.body.max' => 'Isi pesan maksimal 1000 karakter',
            'recipients.array' => 'Penerima harus berupa array',
            'recipients.*.exists' => 'Pengguna tidak ditemukan',
            'notify_low_stock.boolean' => 'Notifikasi low stock harus berupa boolean',
            'notify_out_of_stock.boolean' => 'Notifikasi out of stock harus berupa boolean',
            'batch_size.min' => 'Ukuran batch minimal 1',
            'batch_size.max' => 'Ukuran batch maksimal 100',
            'batch_delay.min' => 'Jeda batch minimal 1 detik',
            'batch_delay.max' => 'Jeda batch maksimal 60 detik',
            'send_status.boolean' => 'Status kirim harus berupa boolean',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422)
        );
    }
}