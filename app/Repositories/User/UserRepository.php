<?php

namespace App\Repositories\User;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserRepository implements UserRepositoryInterface
{
    /**
     * Get all users with pagination
     */
    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return User::with(['roles'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Find user by ID
     */
    public function findById(string $id): ?User
    {
        return User::with(['roles'])->find($id);
    }

    /**
     * Find user by email
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Create new user
     */
    public function create(array $data): User
    {
        DB::beginTransaction();

        try {
            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $user = User::create($data);

            // Assign default role if provided
            if (isset($data['role_id'])) {
                $user->roles()->attach($data['role_id']);
            }

            DB::commit();

            return $user;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update user
     */
    public function update(string $id, array $data): bool
    {
        DB::beginTransaction();

        try {
            $user = User::findOrFail($id);

            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $user->update($data);

            // Update role if provided
            if (isset($data['role_id'])) {
                $user->roles()->sync([$data['role_id']]);
            }

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete user
     */
    public function delete(string $id): bool
    {
        DB::beginTransaction();

        try {
            $user = User::findOrFail($id);

            // Detach all roles
            $user->roles()->detach();

            // Delete user
            $user->delete();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update user last login
     */
    public function updateLastLogin(string $id): bool
    {
        return User::where('id', $id)->update([
            'last_login_at' => now(),
        ]);
    }

    /**
     * Get users by role
     */
    public function getByRole(string $roleId): Collection
    {
        return User::whereHas('roles', function ($query) use ($roleId) {
            $query->where('roles.id', $roleId);
        })->get();
    }

    /**
     * Search users
     */
    public function search(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return User::where(function ($q) use ($query) {
            $q->where('name', 'ILIKE', "%{$query}%")
              ->orWhere('email', 'ILIKE', "%{$query}%");
        })
        ->with(['roles'])
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);
    }
}
