<?php

namespace App\Repositories\User;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

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
        $allowedSortFields = ['name', 'email', 'created_at', 'last_login_at', 'is_active', 'suspended'];

        // Handle special case for 'status' sorting (it's an accessor, not a DB column)
        if ($sortField === 'status') {
            // Sort by suspended first (suspended users at top/bottom), then by is_active
            $query->orderBy('suspended', $sortOrder)
                  ->orderBy('is_active', $sortOrder);
        } elseif (in_array($sortField, $allowedSortFields)) {
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

            // Assign default role if provided (role_id is already UUID, no conversion needed)
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
        Log::info('UserRepository::update - Starting update', [
            'user_id' => $id,
            'data' => $data,
            'data_types' => array_map(function($value) {
                return is_object($value) ? get_class($value) : gettype($value);
            }, $data),
        ]);

        DB::beginTransaction();

        try {
            $user = User::findOrFail($id);

            Log::info('UserRepository::update - User found', [
                'user_id' => $id,
                'user_name' => $user->name,
                'user_email' => $user->email,
            ]);

            // Hash password if provided and not empty
            if (isset($data['password']) && !empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
                Log::info('UserRepository::update - Password hashed');
            } elseif (isset($data['password']) && empty($data['password'])) {
                // Remove password field if it's empty to avoid overwriting with empty value
                unset($data['password']);
                Log::info('UserRepository::update - Password field removed (empty)');
            }

            // Handle status field mapping
            if (isset($data['status'])) {
                Log::info('UserRepository::update - Mapping status field', [
                    'original_status' => $data['status'],
                ]);

                if ($data['status'] === 'active') {
                    $data['is_active'] = true;
                } elseif ($data['status'] === 'inactive' || $data['status'] === 'suspended') {
                    $data['is_active'] = false;
                }
                unset($data['status']); // Remove the status field as we've mapped it to is_active

                Log::info('UserRepository::update - Status mapped', [
                    'is_active' => $data['is_active'] ?? null,
                ]);
            }

            // Handle is_active field directly
            if (isset($data['is_active'])) {
                // Keep as is
            }

            Log::info('UserRepository::update - Calling user update', [
                'user_id' => $id,
                'data_to_update' => $data,
            ]);

            $user->update($data);

            Log::info('UserRepository::update - User updated successfully', [
                'user_id' => $id,
            ]);

            // Update role if provided
            if (isset($data['role_id'])) {
                // Keep role_id as UUID string (no conversion needed)
                $roleId = $data['role_id'];

                Log::info('UserRepository::update - Updating role', [
                    'user_id' => $id,
                    'role_id' => $roleId,
                    'role_id_type' => gettype($roleId),
                ]);

                $user->roles()->sync([$roleId => ['model_type' => User::class]]);

                Log::info('UserRepository::update - Role updated successfully');
            }

            DB::commit();

            Log::info('UserRepository::update - Transaction committed', [
                'user_id' => $id,
            ]);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('UserRepository::update - Update failed', [
                'user_id' => $id,
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

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
