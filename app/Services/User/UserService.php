<?php

namespace App\Services\User;

use App\Http\Requests\User\UserChangePasswordRequest;
use App\Http\Requests\User\UserCreateRequest;
use App\Http\Requests\User\UserProfileUpdateRequest;
use App\Http\Requests\User\UserUpdateRequest;
use App\Http\Requests\User\UserRegistrationRequest;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserService implements UserServiceInterface
{
    protected UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Get all users with pagination
     */
    public function getAllUsers(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->userRepository->getAll($perPage, $filters);
    }

    /**
     * Find user by ID
     */
    public function findUserById(string $id): ?User
    {
        return $this->userRepository->findById($id);
    }

    /**
     * Find user by email
     */
    public function findUserByEmail(string $email): ?User
    {
        return $this->userRepository->findByEmail($email);
    }

    /**
     * Create new user
     */
    public function createUser($request): User
    {
        if ($request instanceof UserCreateRequest) {
            return $this->userRepository->create($request->validated());
        }

        // Handle array input
        return $this->userRepository->create($request);
    }

    /**
     * Register new user
     */
    public function registerUser(UserRegistrationRequest $request): User
    {
        $userData = $request->validated();
        $userData['role_id'] = 2; // Default role ID for regular users

        return $this->userRepository->create($userData);
    }

    /**
     * Update user
     */
    public function updateUser(string $id, $request): bool
    {
        if ($request instanceof UserUpdateRequest) {
            return $this->userRepository->update($id, $request->validated());
        }

        // Handle array input
        return $this->userRepository->update($id, $request);
    }

    /**
     * Delete user
     */
    public function deleteUser(string $id): bool
    {
        return $this->userRepository->delete($id);
    }

    /**
     * Update user profile
     */
    public function updateProfile(string $id, $request): bool
    {
        if ($request instanceof UserProfileUpdateRequest) {
            return $this->userRepository->update($id, $request->validated());
        }

        // Handle array input
        return $this->userRepository->update($id, $request);
    }

    /**
     * Change user password
     */
    public function changePassword(string $id, $request): bool
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            throw new \Exception('User not found');
        }

        if ($request instanceof UserChangePasswordRequest) {
            $validatedData = $request->validated();
        } else {
            $validatedData = $request;
        }

        // Validate current password (only if user is changing their own password)
        $currentUser = Auth::user();
        if ($currentUser && $currentUser->id === $id && isset($validatedData['current_password']) && !Hash::check($validatedData['current_password'], $user->password)) {
            throw new \Exception('Password saat ini tidak benar');
        }

        return $this->userRepository->update($id, [
            'password' => $validatedData['password'],
        ]);
    }

    /**
     * Update user last login
     */
    public function updateLastLogin(string $id): bool
    {
        return $this->userRepository->updateLastLogin($id);
    }

    /**
     * Toggle user active status
     */
    public function toggleActiveStatus(string $id, bool $newStatus = null): bool
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            throw new \Exception('User not found');
        }

        // If no new status is provided, toggle the current status
        if ($newStatus === null) {
            $newStatus = !$user->is_active;
        }

        return $this->userRepository->update($id, [
            'is_active' => $newStatus,
        ]);
    }

    /**
     * Suspend user
     */
    public function suspendUser(string $id, string $reason = null): bool
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            throw new \Exception('User not found');
        }

        return $this->userRepository->update($id, [
            'suspended' => true,
            'suspension_reason' => $reason,
            'suspended_at' => now(),
        ]);
    }

    /**
     * Unsuspend user
     */
    public function unsuspendUser(string $id): bool
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            throw new \Exception('User not found');
        }

        return $this->userRepository->update($id, [
            'suspended' => false,
            'suspension_reason' => null,
            'suspended_at' => null,
        ]);
    }

    /**
     * Assign role to user
     */
    public function assignRole(string $userId, string $roleId): bool
    {
        $user = $this->userRepository->findById($userId);

        if (!$user) {
            throw new \Exception('User not found');
        }

        return $this->userRepository->assignRole($userId, $roleId);
    }

    /**
     * Remove role from user
     */
    public function removeRole(string $userId, string $roleId): bool
    {
        $user = $this->userRepository->findById($userId);

        if (!$user) {
            throw new \Exception('User not found');
        }

        return $this->userRepository->removeRole($userId, $roleId);
    }

    /**
     * Search users
     */
    public function searchUsers(string $query, int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->userRepository->search($query, $perPage, $filters);
    }

    /**
     * Get users count by status
     */
    public function getUsersCountByStatus(string $status): int
    {
        return $this->userRepository->getCountByStatus($status);
    }

    /**
     * Get users for export
     */
    public function getUsersForExport(array $filters = []): Collection
    {
        return $this->userRepository->getForExport($filters);
    }
}
