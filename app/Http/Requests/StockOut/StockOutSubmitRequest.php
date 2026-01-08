<?php

namespace App\Http\Requests\StockOut;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Models\StockOutRecord;
use App\Models\ProductVariant;

class StockOutSubmitRequest extends FormRequest
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

        // Jika record tidak ditemukan atau bukan draft, tidak boleh submit
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
            $this->validateStockAvailability($validator);
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
                'Hanya record dengan status draft yang dapat disubmit'
            );
        }
    }

    /**
     * Validate that stock current is sufficient for each variant.
     */
    private function validateStockAvailability(Validator $validator): void
    {
        $items = $this->input('items', []);

        foreach ($items as $index => $item) {
            $variantId = $item['product_variant_id'] ?? null;
            $quantity = $item['quantity'] ?? 0;

            if ($variantId && $quantity > 0) {
                $variant = ProductVariant::find($variantId);

                if ($variant) {
                    $stockCurrent = $variant->stock_current ?? 0;

                    if ($quantity > $stockCurrent) {
                        $validator->errors()->add(
                            "items.{$index}.quantity",
                            "Stok tidak mencukupi. Stok saat ini: {$stockCurrent}, diminta: {$quantity}"
                        );
                    }
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
