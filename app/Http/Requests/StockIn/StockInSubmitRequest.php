<?php

namespace App\Http\Requests\StockIn;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use App\Models\StockInRecord;

class StockInSubmitRequest extends FormRequest
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

        $stockInRecord = $this->route('stockIn');

        // Jika record tidak ditemukan atau bukan draft, tidak boleh submit
        if (!$stockInRecord || !$stockInRecord->isDraft()) {
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
            'date' => 'required|date',
            'note' => 'nullable|string|max:500',
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
     * Validate that the stock in record is in draft status.
     */
    private function validateDraftStatus(Validator $validator): void
    {
        $stockInRecord = $this->route('stockIn');

        if ($stockInRecord && !$stockInRecord->isDraft()) {
            $validator->errors()->add(
                'status',
                'Hanya record dengan status draft yang dapat disubmit'
            );
        }
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'date.required' => 'Tanggal stock in harus diisi',
            'date.date' => 'Format tanggal tidak valid',
            'note.string' => 'Catatan harus berupa teks',
            'note.max' => 'Catatan maksimal 500 karakter',
            'items.required' => 'Item stock in harus diisi',
            'items.array' => 'Item stock in harus berupa array',
            'items.min' => 'Minimal harus ada 1 item stock in',
            'items.*.product_variant_id.required' => 'ID varian produk harus diisi',
            'items.*.product_variant_id.exists' => 'Varian produk tidak ditemukan',
            'items.*.quantity.required' => 'Jumlah harus diisi',
            'items.*.quantity.integer' => 'Jumlah harus berupa angka',
            'items.*.quantity.min' => 'Jumlah minimal 0',
        ];
    }
}
