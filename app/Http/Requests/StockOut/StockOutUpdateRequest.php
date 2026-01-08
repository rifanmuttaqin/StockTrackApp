<?php

namespace App\Http\Requests\StockOut;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Models\StockOutRecord;

class StockOutUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // User yang sudah login dan record harus dalam status draft
        if (!Auth::check()) {
            return false;
        }

        $stockOutRecord = $this->route('stock_out_record');

        // Jika record tidak ditemukan atau bukan draft, tidak boleh update
        if (!$stockOutRecord || !$stockOutRecord->isDraft()) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => 'required|date|date_format:Y-m-d',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:0',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $this->validateDraftStatus($validator);
        });
    }

    /**
     * Validate that the stock out record is in draft status.
     */
    private function validateDraftStatus(Validator $validator): void
    {
        $stockOutRecord = $this->route('stock_out_record');

        if ($stockOutRecord && !$stockOutRecord->isDraft()) {
            $validator->errors()->add(
                'status',
                'Hanya record dengan status draft yang dapat diupdate'
            );
        }
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'date.required' => 'Tanggal stock out harus diisi',
            'date.date' => 'Format tanggal tidak valid',
            'date.date_format' => 'Format tanggal harus Y-m-d (contoh: 2026-01-08)',
            'items.required' => 'Item stock out harus diisi',
            'items.array' => 'Item stock out harus berupa array',
            'items.min' => 'Minimal harus ada 1 item stock out',
            'items.*.product_variant_id.required' => 'ID varian produk harus diisi',
            'items.*.product_variant_id.exists' => 'Varian produk tidak ditemukan',
            'items.*.quantity.required' => 'Jumlah harus diisi',
            'items.*.quantity.integer' => 'Jumlah harus berupa angka',
            'items.*.quantity.min' => 'Jumlah minimal 0',
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
