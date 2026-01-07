<?php

namespace App\Http\Requests\Template;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class TemplateCreateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin can create templates
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'templates.create');
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
            'is_active' => 'nullable|boolean',
            'variants' => 'required|array|min:1',
            'variants.*' => 'required|exists:product_variants,id',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $this->validateUniqueVariants($validator);
        });
    }

    /**
     * Custom validation for unique variants
     */
    private function validateUniqueVariants(Validator $validator): void
    {
        $variants = $this->input('variants', []);

        // Check for duplicate variant IDs
        $variantIds = [];
        foreach ($variants as $index => $variantId) {
            if (in_array($variantId, $variantIds)) {
                $validator->errors()->add(
                    "variants.{$index}",
                    'Varian tidak boleh duplikat'
                );
            }
            $variantIds[] = $variantId;
        }
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama template wajib diisi',
            'name.max' => 'Nama template maksimal 255 karakter',
            'is_active.boolean' => 'Status aktif harus berupa boolean',
            'variants.required' => 'Template harus memiliki minimal 1 varian',
            'variants.array' => 'Varian harus berupa array',
            'variants.min' => 'Template harus memiliki minimal 1 varian',
            'variants.*.required' => 'Varian wajib diisi',
            'variants.*.exists' => 'Varian tidak valid',
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
