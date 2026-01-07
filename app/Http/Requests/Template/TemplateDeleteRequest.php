<?php

namespace App\Http\Requests\Template;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Models\Template;

class TemplateDeleteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin can delete templates
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'templates.delete');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'template_id' => 'required|exists:templates,id',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $this->validateTemplateNotActive($validator);
            $this->validateTemplateNotInUse($validator);
        });
    }

    /**
     * Custom validation to check if template is not active
     */
    private function validateTemplateNotActive(Validator $validator): void
    {
        $templateId = $this->input('template_id');

        $template = Template::find($templateId);

        if (!$template) {
            $validator->errors()->add(
                'template_id',
                'Template tidak ditemukan'
            );
            return;
        }

        if ($template->is_active) {
            $validator->errors()->add(
                'template_id',
                'Template aktif tidak dapat dihapus'
            );
        }
    }

    /**
     * Custom validation to check if template is not used in stock records
     */
    private function validateTemplateNotInUse(Validator $validator): void
    {
        $templateId = $this->input('template_id');

        $template = Template::find($templateId);

        if (!$template) {
            return;
        }

        // Check if template has items (is used)
        $isInUse = $template->items()->exists();

        if ($isInUse) {
            $validator->errors()->add(
                'template_id',
                'Template yang digunakan dalam record tidak dapat dihapus'
            );
        }
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'template_id.required' => 'Template ID wajib diisi',
            'template_id.exists' => 'Template tidak ditemukan',
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
