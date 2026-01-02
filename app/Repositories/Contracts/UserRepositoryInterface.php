<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface UserRepositoryInterface
{
    /**
     * Get all users with pagination
     */
    public function getAll(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    /**
     * Find user by ID
     */
    public function findById(string $id): ?User;

    /**
     * Find user by email
     */
    public function findByEmail(string $email): ?User;

    /**
     * Create new user
     */
    public function create(array $data): User;

    /**
     * Update user
     */
    public function update(string $id, array $data): bool;

    /**
     * Delete user
     */
    public function delete(string $id): bool;

    /**
     * Update user last login
     */
    public function updateLastLogin(string $id): bool;

    /**
     * Get users by role
     */
    public function getByRole(string $roleId): Collection;

    /**
     * Search users
     */
    public function search(string $query, int $perPage = 15, array $filters = []): LengthAwarePaginator;

    /**
     * Assign role to user
     */
    public function assignRole(string $userId, string $roleId): bool;

    /**
     * Remove role from user
     */
    public function removeRole(string $userId, string $roleId): bool;

    /**
     * Get users count by status
     */
    public function getCountByStatus(string $status): int;

    /**
     * Get users for export
     */
    public function getForExport(array $filters = []): Collection;
}
