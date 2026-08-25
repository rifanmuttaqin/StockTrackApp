<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UnitCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'units.create');
    }

    public function rules(): array
    {
        $rules = [
            'name' => 'required|string|max:50|unique:units,name',
            'abbreviation' => 'required|string|max:10|unique:units,abbreviation',
            'type' => 'required|in:base,conversion',
            'description' => 'nullable|string',
        ];

        if ($this->input('type') === 'conversion') {
            $rules['base_unit_id'] = 'required|exists:units,id';
            $rules['multiplier'] = 'required|numeric|min:0.01';
            $rules['is_primary'] = 'boolean';
        }

        return $rules;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('type') === 'conversion' && $this->input('base_unit_id')) {
                $baseUnit = \App\Models\Unit::find($this->input('base_unit_id'));
                if ($baseUnit && $baseUnit->type !== 'base') {
                    $validator->errors()->add(
                        'base_unit_id',
                        'Unit dasar harus bertipe base.'
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama satuan harus diisi.',
            'name.string' => 'Nama satuan harus berupa teks.',
            'name.max' => 'Nama satuan maksimal 50 karakter.',
            'name.unique' => 'Nama satuan sudah digunakan.',
            'abbreviation.required' => 'Singkatan satuan harus diisi.',
            'abbreviation.string' => 'Singkatan satuan harus berupa teks.',
            'abbreviation.max' => 'Singkatan satuan maksimal 10 karakter.',
            'abbreviation.unique' => 'Singkatan satuan sudah digunakan.',
            'type.required' => 'Tipe satuan harus diisi.',
            'type.in' => 'Tipe satuan harus berupa base atau conversion.',
            'description.string' => 'Deskripsi harus berupa teks.',
            'base_unit_id.required' => 'Unit dasar harus diisi untuk satuan konversi.',
            'base_unit_id.exists' => 'Unit dasar yang dipilih tidak valid.',
            'multiplier.required' => 'Pengali harus diisi untuk satuan konversi.',
            'multiplier.numeric' => 'Pengali harus berupa angka.',
            'multiplier.min' => 'Pengali minimal 0.01.',
            'boolean' => 'Nilai harus berupa true atau false.',
        ];
    }

    private function userHasRole($user, string $role): bool
    {
        return $user->roles()->where('name', $role)->exists();
    }

    private function userHasPermission($user, string $permission): bool
    {
        return $user->permissions()->where('name', $permission)->exists() ||
               $user->roles()->whereHas('permissions', function ($query) use ($permission) {
                   $query->where('name', $permission);
               })->exists();
    }

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
