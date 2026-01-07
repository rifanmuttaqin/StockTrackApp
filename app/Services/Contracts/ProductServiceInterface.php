<?php

namespace App\Services\Contracts;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductServiceInterface
{
    /**
     * Get all products with pagination
     */
    public function getAllProducts(int $perPage, array $filters = []): LengthAwarePaginator;

    /**
     * Find product by ID
     */
    public function findProductById(string $id): ?Product;

    /**
     * Create new product
     */
    public function createProduct(Request $request): Product;

    /**
     * Update product
     */
    public function updateProduct(string $id, Request $request): bool;

    /**
     * Delete product (soft delete)
     */
    public function deleteProduct(string $id): bool;

    /**
     * Restore soft deleted product
     */
    public function restoreProduct(string $id): bool;

    /**
     * Permanently delete product (force delete)
     */
    public function forceDeleteProduct(string $id): bool;

    /**
     * Get products count
     */
    public function getProductsCount(): int;

    /**
     * Search products
     */
    public function searchProducts(string $query, int $perPage, array $filters = []): LengthAwarePaginator;
}
