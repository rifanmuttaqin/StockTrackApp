<?php

namespace App\Services\Product;

use App\Http\Requests\Product\ProductCreateRequest;
use App\Http\Requests\Product\ProductUpdateRequest;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Services\Contracts\ProductServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;

class ProductService implements ProductServiceInterface
{
    protected ProductRepositoryInterface $productRepository;

    public function __construct(ProductRepositoryInterface $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    /**
     * Get all products with pagination
     */
    public function getAllProducts(int $perPage, array $filters = []): LengthAwarePaginator
    {
        Log::info('ProductService::getAllProducts - Fetching all products', [
            'per_page' => $perPage,
            'filters' => $filters,
        ]);

        return $this->productRepository->getAllProducts($perPage, $filters);
    }

    /**
     * Find product by ID
     */
    public function findProductById(string $id): ?Product
    {
        Log::info('ProductService::findProductById - Finding product', [
            'product_id' => $id,
        ]);

        return $this->productRepository->findProductById($id);
    }

    /**
     * Create new product
     */
    public function createProduct(Request $request): Product
    {
        Log::info('ProductService::createProduct - Starting product creation', [
            'request_type' => get_class($request),
        ]);

        try {
            if ($request instanceof ProductCreateRequest) {
                $validatedData = $request->validated();
            } else {
                $validatedData = $request->all();
            }

            Log::info('ProductService::createProduct - Validated data', [
                'data' => $validatedData,
            ]);

            $product = $this->productRepository->createProduct($validatedData);

            Log::info('ProductService::createProduct - Product created successfully', [
                'product_id' => $product->id,
                'product_name' => $product->name,
            ]);

            return $product;
        } catch (\Exception $e) {
            Log::error('ProductService::createProduct - Failed to create product', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Update product
     */
    public function updateProduct(string $id, Request $request): bool
    {
        Log::info('ProductService::updateProduct - Starting product update', [
            'product_id' => $id,
            'request_type' => get_class($request),
        ]);

        try {
            // Check if product exists
            $product = $this->productRepository->findProductById($id);
            if (!$product) {
                Log::warning('ProductService::updateProduct - Product not found', [
                    'product_id' => $id,
                ]);
                throw new \Exception('Product not found');
            }

            if ($request instanceof ProductUpdateRequest) {
                $validatedData = $request->validated();
            } else {
                $validatedData = $request->all();
            }

            Log::info('ProductService::updateProduct - Validated data', [
                'product_id' => $id,
                'data' => $validatedData,
            ]);

            $result = $this->productRepository->updateProduct($id, $validatedData);

            if ($result) {
                Log::info('ProductService::updateProduct - Product updated successfully', [
                    'product_id' => $id,
                ]);
            } else {
                Log::warning('ProductService::updateProduct - Product update failed', [
                    'product_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('ProductService::updateProduct - Failed to update product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete product (soft delete)
     */
    public function deleteProduct(string $id): bool
    {
        Log::info('ProductService::deleteProduct - Starting product deletion', [
            'product_id' => $id,
        ]);

        try {
            // Check if product exists
            $product = $this->productRepository->findProductById($id);
            if (!$product) {
                Log::warning('ProductService::deleteProduct - Product not found', [
                    'product_id' => $id,
                ]);
                throw new \Exception('Product not found');
            }

            $result = $this->productRepository->deleteProduct($id);

            if ($result) {
                Log::info('ProductService::deleteProduct - Product deleted successfully', [
                    'product_id' => $id,
                ]);
            } else {
                Log::warning('ProductService::deleteProduct - Product deletion failed', [
                    'product_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('ProductService::deleteProduct - Failed to delete product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Restore soft deleted product
     */
    public function restoreProduct(string $id): bool
    {
        Log::info('ProductService::restoreProduct - Starting product restoration', [
            'product_id' => $id,
        ]);

        try {
            $result = $this->productRepository->restoreProduct($id);

            if ($result) {
                Log::info('ProductService::restoreProduct - Product restored successfully', [
                    'product_id' => $id,
                ]);
            } else {
                Log::warning('ProductService::restoreProduct - Product restoration failed', [
                    'product_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('ProductService::restoreProduct - Failed to restore product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Permanently delete product (force delete)
     */
    public function forceDeleteProduct(string $id): bool
    {
        Log::info('ProductService::forceDeleteProduct - Starting permanent product deletion', [
            'product_id' => $id,
        ]);

        try {
            $result = $this->productRepository->forceDeleteProduct($id);

            if ($result) {
                Log::info('ProductService::forceDeleteProduct - Product permanently deleted', [
                    'product_id' => $id,
                ]);
            } else {
                Log::warning('ProductService::forceDeleteProduct - Permanent deletion failed', [
                    'product_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('ProductService::forceDeleteProduct - Failed to permanently delete product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Get products count
     */
    public function getProductsCount(): int
    {
        Log::info('ProductService::getProductsCount - Getting products count');

        return $this->productRepository->getProductsCount();
    }

    /**
     * Search products
     */
    public function searchProducts(string $query, int $perPage, array $filters = []): LengthAwarePaginator
    {
        Log::info('ProductService::searchProducts - Searching products', [
            'query' => $query,
            'per_page' => $perPage,
            'filters' => $filters,
        ]);

        return $this->productRepository->searchProducts($query, $perPage, $filters);
    }
}
