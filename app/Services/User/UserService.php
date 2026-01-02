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
    public function getAllUsers(int $perPage = 15): LengthAwarePaginator
    {
        return $this->userRepository->getAll($perPage);
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
    public function createUser(UserCreateRequest $request): User
    {
        return $this->userRepository->create($request->validated());
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
    public function updateUser(string $id, UserUpdateRequest $request): bool
    {
        return $this->userRepository->update($id, $request->validated());
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
    public function updateProfile(string $id, UserProfileUpdateRequest $request): bool
    {
        return $this->userRepository->update($id, $request->validated());
    }

    /**
     * Change user password
     */
    public function changePassword(string $id, UserChangePasswordRequest $request): bool
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            throw new \Exception('User not found');
        }

        // Validate current password
        if (!Hash::check($request->validated()['current_password'], $user->password)) {
            throw new \Exception('Current password is incorrect');
        }

        return $this->userRepository->update($id, [
            'password' => $request->validated()['new_password'],
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
    public function toggleActiveStatus(string $id): bool
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            throw new \Exception('User not found');
        }

        return $this->userRepository->update($id, [
            'is_active' => !$user->is_active,
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

        return $this->userRepository->update($userId, [
            'role_id' => $roleId,
        ]);
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

        return $this->userRepository->update($userId, [
            'role_id' => null,
        ]);
    }

    /**
     * Search users
     */
    public function searchUsers(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return $this->userRepository->search($query, $perPage);
    }
}
