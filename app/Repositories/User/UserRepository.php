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
    public function getAll(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = User::with(['roles']);

        // Apply filters
        if (isset($filters['role']) && !empty($filters['role'])) {
            $query->whereHas('roles', function ($q) use ($filters) {
                $q->where('roles.id', $filters['role']);
            });
        }

        if (isset($filters['status'])) {
            if ($filters['status'] === 'active') {
                $query->where('is_active', true)->where('suspended', false);
            } elseif ($filters['status'] === 'inactive') {
                $query->where('is_active', false)->where('suspended', false);
            } elseif ($filters['status'] === 'suspended') {
                $query->where('suspended', true);
            }
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('email', 'ILIKE', "%{$search}%");
            });
        }

        // Apply sorting
        $sortField = $filters['sort'] ?? 'created_at';
        $sortOrder = $filters['order'] ?? 'desc';

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['name', 'email', 'created_at', 'last_login_at', 'is_active'];
        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return $query->paginate($perPage);
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
            // Generate UUID for user ID if not provided
            if (!isset($data['id'])) {
                $data['id'] = \Illuminate\Support\Str::uuid();
            }

            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $user = User::create($data);

            // Assign default role if provided
            if (isset($data['role_id'])) {
                $user->roles()->attach($data['role_id'], ['model_type' => User::class]);
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

            // Handle status field mapping
            if (isset($data['status'])) {
                if ($data['status'] === 'active') {
                    $data['is_active'] = true;
                } elseif ($data['status'] === 'inactive' || $data['status'] === 'suspended') {
                    $data['is_active'] = false;
                }
                unset($data['status']); // Remove the status field as we've mapped it to is_active
            }

            // Handle is_active field directly
            if (isset($data['is_active'])) {
                // Keep as is
            }

            $user->update($data);

            // Update role if provided
            if (isset($data['role_id'])) {
                $user->roles()->sync([$data['role_id'] => ['model_type' => User::class]]);
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
    public function search(string $query, int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $searchQuery = User::where(function ($q) use ($query) {
            $q->where('name', 'ILIKE', "%{$query}%")
              ->orWhere('email', 'ILIKE', "%{$query}%");
        });

        // Apply additional filters
        if (isset($filters['role']) && !empty($filters['role'])) {
            $searchQuery->whereHas('roles', function ($q) use ($filters) {
                $q->where('roles.id', $filters['role']);
            });
        }

        if (isset($filters['status'])) {
            if ($filters['status'] === 'active') {
                $searchQuery->where('is_active', true)->where('suspended', false);
            } elseif ($filters['status'] === 'inactive') {
                $searchQuery->where('is_active', false)->where('suspended', false);
            } elseif ($filters['status'] === 'suspended') {
                $searchQuery->where('suspended', true);
            }
        }

        return $searchQuery->with(['roles'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Assign role to user
     */
    public function assignRole(string $userId, string $roleId): bool
    {
        DB::beginTransaction();

        try {
            $user = User::findOrFail($userId);

            // Sync the role (this will replace all existing roles with this one)
            $user->roles()->sync([$roleId => ['model_type' => User::class]]);

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Remove role from user
     */
    public function removeRole(string $userId, string $roleId): bool
    {
        DB::beginTransaction();

        try {
            $user = User::findOrFail($userId);

            // Detach the specific role
            $user->roles()->detach($roleId);

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get users count by status
     */
    public function getCountByStatus(string $status): int
    {
        if ($status === 'active') {
            return User::where('is_active', true)->where('suspended', false)->count();
        } elseif ($status === 'inactive') {
            return User::where('is_active', false)->where('suspended', false)->count();
        } elseif ($status === 'suspended') {
            return User::where('suspended', true)->count();
        }

        return 0;
    }

    /**
     * Get users for export
     */
    public function getForExport(array $filters = []): Collection
    {
        $query = User::with(['roles']);

        // Apply filters
        if (isset($filters['role']) && !empty($filters['role'])) {
            $query->whereHas('roles', function ($q) use ($filters) {
                $q->where('roles.id', $filters['role']);
            });
        }

        if (isset($filters['status'])) {
            if ($filters['status'] === 'active') {
                $query->where('is_active', true)->where('suspended', false);
            } elseif ($filters['status'] === 'inactive') {
                $query->where('is_active', false)->where('suspended', false);
            } elseif ($filters['status'] === 'suspended') {
                $query->where('suspended', true);
            }
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('email', 'ILIKE', "%{$search}%");
            });
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}
