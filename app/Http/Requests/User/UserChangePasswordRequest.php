<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UserChangePasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = Auth::user();
        $targetUserId = $this->route('id');

        // User can change their own password
        if ($user->id === $targetUserId) {
            return true;
        }

        // Admin can change any user's password
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'users.change-password');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = Auth::user();
        $targetUserId = $this->route('id');

        $rules = [
            'password' => 'required|string|min:8|confirmed',
        ];

        // Only require current password if user is changing their own password
        if ($user->id === $targetUserId) {
            $rules['current_password'] = 'required|string';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'Password saat ini harus diisi',
            'password.required' => 'Password baru harus diisi',
            'password.min' => 'Password baru minimal harus 8 karakter',
            'password.confirmed' => 'Konfirmasi password baru tidak cocok',
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
