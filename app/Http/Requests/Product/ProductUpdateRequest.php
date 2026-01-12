<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ProductUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin can update products
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'products.update');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $productId = $this->route('id');

        // Build validation rules
        $rules = [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'variants' => 'required|array|min:1',
            'variants.*.id' => 'nullable|string', // ID varian yang sudah ada (null untuk varian baru)
            'variants.*.name' => 'required|string|max:100',
            'variants.*.sku' => 'required|string|max:50',
            'variants.*.stock_current' => 'required|integer|min:0',
        ];

        // Add SKU validation rule only if product ID is valid UUID
        $isValidUuid = !empty($productId) &&
                      is_string($productId) &&
                      preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $productId);

        if ($isValidUuid) {
            $rules['sku'] = 'required|string|max:50|unique:products,sku,' . $productId;
        } else {
            // Fallback: require SKU but skip unique check if ID is invalid
            $rules['sku'] = 'required|string|max:50';
        }

        return $rules;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $productId = $this->route('id');

        // Validate that product ID exists and is a valid UUID
        if (empty($productId)) {
            Log::error('ProductUpdateRequest: Product ID is missing from route', [
                'route' => $this->route()->getName(),
                'parameters' => $this->route()->parameters(),
                'url' => $this->url(),
            ]);
            // This will be caught by the controller's 404 check
        } elseif (!is_string($productId) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $productId)) {
            Log::error('ProductUpdateRequest: Invalid product ID format', [
                'product_id' => $productId,
                'product_id_type' => gettype($productId),
                'url' => $this->url(),
            ]);
        }
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $this->validateVariantSkus($validator);
        });
    }

    /**
     * Custom validation for variant SKUs
     */
    private function validateVariantSkus($validator): void
    {
        $productSku = $this->input('sku');
        $productId = $this->route('id');
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

        // Check if variant SKU is already used by other variants in the database
        foreach ($variants as $index => $variant) {
            if (isset($variant['sku']) && isset($variant['id'])) {
                // For existing variants, check if SKU is used by other variants
                $existingVariant = \App\Models\ProductVariant::where('sku', $variant['sku'])
                    ->where('id', '!=', $variant['id'])
                    ->first();

                if ($existingVariant) {
                    $validator->errors()->add(
                        "variants.{$index}.sku",
                        'SKU varian sudah digunakan oleh varian lain'
                    );
                }
            } elseif (isset($variant['sku']) && !isset($variant['id'])) {
                // For new variants, check if SKU is already used
                $existingVariant = \App\Models\ProductVariant::where('sku', $variant['sku'])->first();

                if ($existingVariant) {
                    $validator->errors()->add(
                        "variants.{$index}.sku",
                        'SKU varian sudah digunakan oleh varian lain'
                    );
                }
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
            'variants.*.id.nullable' => 'ID varian bersifat opsional',
            'variants.*.name.required' => 'Nama varian harus diisi',
            'variants.*.name.max' => 'Nama varian maksimal 100 karakter',
            'variants.*.sku.required' => 'SKU varian harus diisi',
            'variants.*.sku.max' => 'SKU varian maksimal 50 karakter',
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
