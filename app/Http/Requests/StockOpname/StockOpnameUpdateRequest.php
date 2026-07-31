<?php

namespace App\Http\Requests\StockOpname;

use App\Models\StockOpnameRecord;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;

class StockOpnameUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $record = StockOpnameRecord::findOrFail($this->route('stock_opname'));

        // Ownership check: hanya pembuat draft atau Admin (dengan permission bypass) yang bisa mengupdate
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
            'date' => 'required|date|date_format:Y-m-d',
            'note' => 'nullable|string|max:500',
            'last_updated_at' => 'required|date_format:Y-m-d H:i:s', // Optimistic Locking
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.physical_stock' => 'nullable|integer|min:0|max:2147483647',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'date.required' => 'Tanggal stock opname harus diisi',
            'date.date' => 'Format tanggal tidak valid',
            'date.date_format' => 'Format tanggal harus Y-m-d (contoh: 2026-07-30)',
            'note.string' => 'Catatan harus berupa teks',
            'note.max' => 'Catatan maksimal 500 karakter',
            'last_updated_at.required' => 'Timestamp optimistik locking harus diisi',
            'last_updated_at.date_format' => 'Format timestamp tidak valid',
            'items.required' => 'Item stock opname harus diisi',
            'items.array' => 'Item stock opname harus berupa array',
            'items.min' => 'Minimal harus ada 1 item stock opname',
            'items.*.product_variant_id.required' => 'ID varian produk harus diisi',
            'items.*.product_variant_id.exists' => 'Varian produk tidak ditemukan',
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
