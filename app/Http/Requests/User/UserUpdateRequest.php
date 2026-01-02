<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UserUpdateRequest extends FormRequest
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

        // Admin can update any user
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'users.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user') ?? $this->route('id') ?? $this->input('id');

        return [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $userId,
            'password' => 'sometimes|string|min:8|confirmed',
            'role_id' => 'sometimes|exists:roles,id',
            'status' => 'sometimes|string|in:active,inactive,suspended',
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
            'password.required' => 'Password harus diisi',
            'password.min' => 'Password minimal harus 8 karakter',
            'password.confirmed' => 'Konfirmasi password tidak cocok',
            'role_id.required' => 'Role harus dipilih',
            'role_id.exists' => 'Role tidak valid',
            'status.in' => 'Status tidak valid',
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
