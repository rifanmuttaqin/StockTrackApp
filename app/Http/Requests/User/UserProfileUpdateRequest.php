<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UserProfileUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = Auth::user();
        $targetUserId = $this->route('id');

        // User can update their own profile
        if ($user->id === $targetUserId) {
            return true;
        }

        // Admin can update any user profile
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'users.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('id') ?? $this->input('id');

        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $userId,
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
            'birth_date' => 'sometimes|nullable|date|before:today',
            'avatar' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama harus diisi',
            'name.max' => 'Nama maksimal 255 karakter',
            'email.required' => 'Email harus diisi',
            'email.email' => 'Format email tidak valid',
            'email.max' => 'Email maksimal 255 karakter',
            'email.unique' => 'Email sudah digunakan',
            'phone.max' => 'Nomor telepon maksimal 20 karakter',
            'address.max' => 'Alamat maksimal 500 karakter',
            'birth_date.date' => 'Format tanggal lahir tidak valid',
            'birth_date.before' => 'Tanggal lahir harus sebelum hari ini',
            'avatar.image' => 'Avatar harus berupa gambar',
            'avatar.mimes' => 'Avatar harus berformat jpeg, png, jpg, atau gif',
            'avatar.max' => 'Ukuran avatar maksimal 2MB',
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
}
