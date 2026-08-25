<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UnitUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'units.update');
    }

    public function rules(): array
    {
        $unitId = $this->route('unit');

        $rules = [
            'name' => 'required|string|max:50|unique:units,name,' . $unitId,
            'abbreviation' => 'required|string|max:10|unique:units,abbreviation,' . $unitId,
            'description' => 'nullable|string',
            'updated_at' => 'required|string',
        ];

        $unit = \App\Models\Unit::find($unitId);
        if ($unit && $unit->type === 'conversion') {
            $rules['base_unit_id'] = 'required|exists:units,id';
            $rules['multiplier'] = 'required|numeric|min:0.01';
            $rules['is_primary'] = 'boolean';
        }

        return $rules;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $unitId = $this->route('unit');
            $unit = \App\Models\Unit::find($unitId);

            if ($unit && $unit->type === 'conversion' && $this->input('base_unit_id')) {
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
            'description.string' => 'Deskripsi harus berupa teks.',
            'updated_at.required' => 'Timestamp pembaruan harus diisi.',
            'updated_at.string' => 'Timestamp pembaruan harus berupa teks.',
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
