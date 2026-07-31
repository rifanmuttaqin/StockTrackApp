<?php

namespace App\Http\Requests\StockOpname;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StockOpnameCreateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isSubmit = $this->input('action') === 'submit';

        return [
            'action' => 'sometimes|string|in:store,submit',
            'date' => 'required|date|date_format:Y-m-d',
            'note' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            // Nullable untuk draft, wajib untuk submit
            'items.*.physical_stock' => $isSubmit
                ? 'required|integer|min:0|max:2147483647'
                : 'nullable|integer|min:0|max:2147483647',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        $isSubmit = $this->input('action') === 'submit';

        return [
            'date.required' => 'Tanggal stock opname harus diisi',
            'date.date' => 'Format tanggal tidak valid',
            'date.date_format' => 'Format tanggal harus Y-m-d (contoh: 2026-07-30)',
            'note.string' => 'Catatan harus berupa teks',
            'note.max' => 'Catatan maksimal 500 karakter',
            'items.required' => 'Item stock opname harus diisi',
            'items.array' => 'Item stock opname harus berupa array',
            'items.min' => 'Minimal harus ada 1 item stock opname',
            'items.*.product_variant_id.required' => 'ID varian produk harus diisi',
            'items.*.product_variant_id.exists' => 'Varian produk tidak ditemukan',
            'items.*.physical_stock.required' => $isSubmit
                ? 'Jumlah stok fisik wajib diisi saat submit'
                : 'Jumlah stok fisik harus berupa angka bulat',
            'items.*.physical_stock.integer' => 'Jumlah stok fisik harus berupa angka bulat',
            'items.*.physical_stock.min' => 'Jumlah stok fisik minimal 0',
            'items.*.physical_stock.max' => 'Jumlah stok fisik terlalu besar',
        ];
    }
}
