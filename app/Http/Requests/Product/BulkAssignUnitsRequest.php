<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BulkAssignUnitsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'products.update');
    }

    public function rules(): array
    {
        return [
            'assignments' => 'required|array|min:1|max:500',
            'assignments.*.variant_id' => 'required|exists:product_variants,id',
            'assignments.*.unit_id' => 'required|exists:units,id',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $assignments = $this->input('assignments', []);

            foreach ($assignments as $index => $assignment) {
                if (isset($assignment['unit_id'])) {
                    $unit = \App\Models\Unit::find($assignment['unit_id']);
                    if ($unit && $unit->type !== 'base') {
                        $validator->errors()->add(
                            "assignments.{$index}.unit_id",
                            'Unit harus bertipe base.'
                        );
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'assignments.required' => 'Data penugasan satuan harus diisi.',
            'assignments.array' => 'Data penugasan satuan harus berupa array.',
            'assignments.min' => 'Minimal harus ada 1 data penugasan.',
            'assignments.max' => 'Maksimal 500 data penugasan per permintaan.',
            'assignments.*.variant_id.required' => 'ID varian harus diisi.',
            'assignments.*.variant_id.exists' => 'Varian yang dipilih tidak valid.',
            'assignments.*.unit_id.required' => 'ID satuan harus diisi.',
            'assignments.*.unit_id.exists' => 'Satuan yang dipilih tidak valid.',
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
