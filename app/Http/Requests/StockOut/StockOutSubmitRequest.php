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

        $stockOutRecord = $this->route('stockOut');

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
            // Items are already validated during draft creation and stored in database
            // No validation needed for submit request
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
        $stockOutRecord = $this->route('stockOut');

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
        $stockOutRecord = $this->route('stockOut');
        
        if (!$stockOutRecord) {
            return;
        }

        // Load items from database with productVariant relationship
        $items = $stockOutRecord->load(['items.productVariant'])->items;

        foreach ($items as $index => $item) {
            $variant = $item->productVariant;
            $quantity = $item->quantity;

            if ($variant && $quantity > 0) {
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

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            // Items are already validated during draft creation
            // No custom messages needed for submit request
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
