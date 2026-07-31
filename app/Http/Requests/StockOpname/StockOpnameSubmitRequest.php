<?php

namespace App\Http\Requests\StockOpname;

use App\Models\StockOpnameRecord;
use App\Models\Template;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;

class StockOpnameSubmitRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $record = StockOpnameRecord::findOrFail($this->route('stock_opname'));

        return $this->user()->hasRole('admin') ||
               $this->user()->hasPermissionTo('stock_opname.bypass_ownership') ||
               $record->created_by === $this->user()->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'last_updated_at' => 'required|date_format:Y-m-d H:i:s',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            // Wajib diisi saat submit final (tidak boleh null)
            'items.*.physical_stock' => 'required|integer|min:0|max:2147483647',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // Validasi Kelengkapan: seluruh varian template aktif wajib dihitung saat submit
            $activeTemplate = Template::where('is_active', true)->first();
            if (!$activeTemplate) {
                $validator->errors()->add('template', 'Tidak ada template aktif di sistem.');
                return;
            }

            $templateVariantIds = $activeTemplate->variants()->pluck('product_variants.id')->toArray();
            $submittedVariantIds = collect($this->input('items'))->pluck('product_variant_id')->toArray();

            $missingIds = array_diff($templateVariantIds, $submittedVariantIds);
            if (count($missingIds) > 0) {
                $validator->errors()->add(
                    'items',
                    'Seluruh varian produk pada template aktif wajib dihitung fisiknya saat submit final (tidak boleh parsial).'
                );
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'last_updated_at.required' => 'Timestamp optimistik locking harus diisi',
            'last_updated_at.date_format' => 'Format timestamp tidak valid',
            'items.required' => 'Item stock opname harus diisi',
            'items.array' => 'Item stock opname harus berupa array',
            'items.min' => 'Minimal harus ada 1 item stock opname',
            'items.*.product_variant_id.required' => 'ID varian produk harus diisi',
            'items.*.product_variant_id.exists' => 'Varian produk tidak ditemukan',
            'items.*.physical_stock.required' => 'Jumlah stok fisik wajib diisi saat submit final',
            'items.*.physical_stock.integer' => 'Jumlah stok fisik harus berupa angka bulat',
            'items.*.physical_stock.min' => 'Jumlah stok fisik minimal 0',
            'items.*.physical_stock.max' => 'Jumlah stok fisik terlalu besar',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            redirect()->back()
                ->withErrors($validator)
                ->withInput()
        );
    }
}
