<?php

namespace App\Services\Contracts;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserServiceInterface
{
    /**
     * Get all users with pagination
     */
    public function getAllUsers(int $perPage = 15): LengthAwarePaginator;

    /**
     * Find user by ID
     */
    public function findUserById(string $id): ?User;

    /**
     * Find user by email
     */
    public function findUserByEmail(string $email): ?User;

    /**
     * Create new user
     */
    public function createUser(array $data): User;

    /**
     * Update user
     */
    public function updateUser(string $id, array $data): bool;

    /**
     * Delete user
     */
    public function deleteUser(string $id): bool;

    /**
     * Update user profile
     */
    public function updateProfile(string $id, array $data): bool;

    /**
     * Change user password
     */
    public function changePassword(string $id, string $currentPassword, string $newPassword): bool;

    /**
     * Update user last login
     */
    public function updateLastLogin(string $id): bool;

    /**
     * Toggle user active status
     */
    public function toggleActiveStatus(string $id): bool;

    /**
     * Assign role to user
     */
    public function assignRole(string $userId, string $roleId): bool;

    /**
     * Remove role from user
     */
    public function removeRole(string $userId, string $roleId): bool;

    /**
     * Search users
     */
    public function searchUsers(string $query, int $perPage = 15): LengthAwarePaginator;
}
