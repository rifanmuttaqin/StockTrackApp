<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class AvatarUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.required' => 'Pilih gambar terlebih dahulu.',
            'avatar.image' => 'Avatar harus berupa gambar.',
            'avatar.mimes' => 'Avatar harus berformat jpeg, png, jpg, atau webp.',
            'avatar.max' => 'Ukuran avatar maksimal 2MB.',
        ];
    }
}
