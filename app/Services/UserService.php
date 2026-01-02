<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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
    public function createUser(array $data): User
    {
        // Validate data
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->userRepository->create($data);
    }

    /**
     * Update user
     */
    public function updateUser(string $id, array $data): bool
    {
        // Validate data
        $validator = Validator::make($data, [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $id,
            'password' => 'sometimes|string|min:8|confirmed',
            'role_id' => 'sometimes|exists:roles,id',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->userRepository->update($id, $data);
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
    public function updateProfile(string $id, array $data): bool
    {
        // Validate data
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->userRepository->update($id, $data);
    }

    /**
     * Change user password
     */
    public function changePassword(string $id, string $currentPassword, string $newPassword): bool
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            throw new \Exception('User not found');
        }

        // Validate current password
        if (!Hash::check($currentPassword, $user->password)) {
            throw new \Exception('Current password is incorrect');
        }

        // Validate new password
        $validator = Validator::make([
            'password' => $newPassword,
        ], [
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->userRepository->update($id, [
            'password' => $newPassword,
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
