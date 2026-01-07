<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ProductCreateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin can create products
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'products.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:50|unique:products,sku',
            'description' => 'nullable|string',
            'variants' => 'required|array|min:1',
            'variants.*.name' => 'required|string|max:100',
            'variants.*.sku' => 'required|string|max:50|unique:product_variants,sku',
            'variants.*.stock_current' => 'required|integer|min:0',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $this->validateVariantSkus($validator);
        });
    }

    /**
     * Custom validation for variant SKUs
     */
    private function validateVariantSkus(Validator $validator): void
    {
        $productSku = $this->input('sku');
        $variants = $this->input('variants', []);

        // Check if variant SKU is same as product SKU
        foreach ($variants as $index => $variant) {
            if (isset($variant['sku']) && $variant['sku'] === $productSku) {
                $validator->errors()->add(
                    "variants.{$index}.sku",
                    'SKU varian tidak boleh sama dengan SKU produk'
                );
            }
        }

        // Check for duplicate variant SKUs within the same request
        $variantSkus = [];
        foreach ($variants as $index => $variant) {
            if (isset($variant['sku'])) {
                $sku = $variant['sku'];
                if (in_array($sku, $variantSkus)) {
                    $validator->errors()->add(
                        "variants.{$index}.sku",
                        'SKU varian harus unik antar varian dalam satu form'
                    );
                }
                $variantSkus[] = $sku;
            }
        }
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama produk harus diisi',
            'name.max' => 'Nama produk maksimal 255 karakter',
            'sku.required' => 'SKU produk harus diisi',
            'sku.max' => 'SKU produk maksimal 50 karakter',
            'sku.unique' => 'SKU produk sudah digunakan',
            'description.nullable' => 'Deskripsi produk bersifat opsional',
            'variants.required' => 'Varian produk harus diisi',
            'variants.array' => 'Varian produk harus berupa array',
            'variants.min' => 'Minimal harus ada 1 varian produk',
            'variants.*.name.required' => 'Nama varian harus diisi',
            'variants.*.name.max' => 'Nama varian maksimal 100 karakter',
            'variants.*.sku.required' => 'SKU varian harus diisi',
            'variants.*.sku.max' => 'SKU varian maksimal 50 karakter',
            'variants.*.sku.unique' => 'SKU varian sudah digunakan',
            'variants.*.stock_current.required' => 'Stok varian harus diisi',
            'variants.*.stock_current.integer' => 'Stok varian harus berupa angka',
            'variants.*.stock_current.min' => 'Stok varian minimal 0',
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
