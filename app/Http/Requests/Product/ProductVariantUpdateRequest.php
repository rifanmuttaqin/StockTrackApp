<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ProductVariantUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin can update product variants
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'product_variants.update');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $variantId = $this->route('id');

        return [
            'product_id' => 'required|exists:products,id',
            'variant_name' => 'required|string|max:100',
            'sku' => 'required|string|max:50|unique:product_variants,sku,' . $variantId,
            'stock_current' => 'required|integer|min:0',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $this->validateVariantSkuNotSameAsProductSku($validator);
        });
    }

    /**
     * Custom validation: variant SKU should not be same as product SKU
     */
    private function validateVariantSkuNotSameAsProductSku(Validator $validator): void
    {
        $productId = $this->input('product_id');
        $variantSku = $this->input('sku');
        $variantId = $this->route('id');

        if ($productId && $variantSku) {
            $product = \App\Models\Product::find($productId);
            if ($product && $product->sku === $variantSku) {
                $validator->errors()->add(
                    'sku',
                    'SKU varian tidak boleh sama dengan SKU produk'
                );
            }
        }
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'product_id.required' => 'ID produk harus diisi',
            'product_id.exists' => 'Produk tidak ditemukan',
            'variant_name.required' => 'Nama varian harus diisi',
            'variant_name.max' => 'Nama varian maksimal 100 karakter',
            'sku.required' => 'SKU varian harus diisi',
            'sku.max' => 'SKU varian maksimal 50 karakter',
            'sku.unique' => 'SKU varian sudah digunakan',
            'stock_current.required' => 'Stok varian harus diisi',
            'stock_current.integer' => 'Stok varian harus berupa angka',
            'stock_current.min' => 'Stok varian minimal 0',
        ];
    }

    /**
     * Check if user has specific role
     */
    private function userHasRole($user, string $role): bool
    {
        return $user->roles()->where('name', $role)->exists();
    }

    /**
     * Check if user has specific permission
     */
    private function userHasPermission($user, string $permission): bool
    {
        return $user->permissions()->where('name', $permission)->exists() ||
               $user->roles()->whereHas('permissions', function ($query) use ($permission) {
                   $query->where('name', $permission);
               })->exists();
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
