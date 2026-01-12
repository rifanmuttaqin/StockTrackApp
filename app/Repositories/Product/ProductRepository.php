<?php

namespace App\Repositories\Product;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductRepository implements ProductRepositoryInterface
{
    /**
     * Get all products with pagination
     */
    public function getAllProducts(int $perPage, array $filters = []): LengthAwarePaginator
    {
        // Check if we should include deleted products
        $withTrashed = $filters['with_trashed'] ?? false;

        // Build query based on with_trashed parameter
        if ($withTrashed) {
            $query = Product::withTrashed()->with('variants');
        } else {
            $query = Product::with('variants');
        }

        // Apply search filter if provided
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        $sortField = $filters['sort'] ?? 'created_at';
        $sortOrder = $filters['order'] ?? 'desc';

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['name', 'sku', 'created_at', 'updated_at'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Paginate results
        $products = $query->paginate($perPage);

        // Transform variants to match frontend expectations
        // Map 'variant_name' to 'name' for consistency with frontend
        $products->getCollection()->transform(function ($product) {
            $variantsCount = $product->variants->count();
            $totalStock = 0;
            
            $product->variants->transform(function ($variant) use (&$totalStock) {
                $totalStock += $variant->stock_current;
                return [
                    'id' => $variant->id,
                    'name' => $variant->variant_name, // Map variant_name to name
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                    'product_id' => $variant->product_id,
                ];
            });
            
            // Add variants_count and total_stock to product
            $product->variants_count = $variantsCount;
            $product->total_stock = $totalStock;
            return $product;
        });

        return $products;
    }

    /**
     * Find product by ID
     */
    public function findProductById(string $id): ?Product
    {
        $product = Product::with('variants')->find($id);

        if (!$product) {
            return null;
        }

        // Transform variants to match frontend expectations
        // Map 'variant_name' to 'name' for consistency with frontend
        $variantsCount = $product->variants->count();
        $totalStock = 0;
        
        $product->variants->transform(function ($variant) use (&$totalStock) {
            $totalStock += $variant->stock_current;
            return [
                'id' => $variant->id,
                'name' => $variant->variant_name, // Map variant_name to name
                'sku' => $variant->sku,
                'stock_current' => $variant->stock_current,
                'product_id' => $variant->product_id,
            ];
        });
        // Add variants_count and total_stock to product
        $product->variants_count = $variantsCount;
        $product->total_stock = $totalStock;

        return $product;
    }

    /**
     * Create new product
     */
    public function createProduct(array $data): Product
    {
        DB::beginTransaction();

        try {
            // Create product first
            $product = Product::create([
                'name' => $data['name'],
                'sku' => $data['sku'],
                'description' => $data['description'] ?? null,
            ]);

            // Loop through variants array and create each variant
            if (isset($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $variantData) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_name' => $variantData['name'],
                        'sku' => $variantData['sku'],
                        'stock_current' => $variantData['stock_current'],
                    ]);
                }
            }

            DB::commit();

            // Load variants for the created product
            $product->load('variants');

            // Transform variants to match frontend expectations
            $variantsCount = $product->variants->count();
            $totalStock = 0;
            
            $product->variants->transform(function ($variant) use (&$totalStock) {
                $totalStock += $variant->stock_current;
                return [
                    'id' => $variant->id,
                    'name' => $variant->variant_name,
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                    'product_id' => $variant->product_id,
                ];
            });
            $product->variants_count = $variantsCount;
            $product->total_stock = $totalStock;

            return $product;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create product', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            throw $e;
        }
    }

    /**
     * Update product
     */
    public function updateProduct(string $id, array $data): bool
    {
        DB::beginTransaction();

        try {
            $product = Product::with('variants')->findOrFail($id);

            // Update product data
            $product->update([
                'name' => $data['name'],
                'sku' => $data['sku'],
                'description' => $data['description'] ?? null,
            ]);

            // Get existing variant IDs
            $existingVariantIds = $product->variants->pluck('id')->toArray();

            // Get submitted variant IDs (excluding null IDs for new variants)
            $submittedVariantIds = array_filter(
                array_column($data['variants'], 'id'),
                function ($id) { return $id !== null; }
            );

            // Update or create variants
            if (isset($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $variantData) {
                    if (isset($variantData['id']) && $variantData['id'] !== null) {
                        // Update existing variant
                        $variant = ProductVariant::where('id', $variantData['id'])
                            ->where('product_id', $product->id)
                            ->first();

                        if ($variant) {
                            $variant->update([
                                'variant_name' => $variantData['name'],
                                'sku' => $variantData['sku'],
                                'stock_current' => $variantData['stock_current'],
                            ]);
                        }
                    } else {
                        // Create new variant
                        ProductVariant::create([
                            'product_id' => $product->id,
                            'variant_name' => $variantData['name'],
                            'sku' => $variantData['sku'],
                            'stock_current' => $variantData['stock_current'],
                        ]);
                    }
                }
            }

            // Delete variants that are not in the submitted list
            $variantsToDelete = array_diff($existingVariantIds, $submittedVariantIds);
            if (!empty($variantsToDelete)) {
                ProductVariant::whereIn('id', $variantsToDelete)->delete();
            }

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'data' => $data,
            ]);
            throw $e;
        }
    }

    /**
     * Delete product (soft delete)
     */
    public function deleteProduct(string $id): bool
    {
        DB::beginTransaction();

        try {
            $product = Product::findOrFail($id);

            // Soft delete product (cascade will soft delete variants)
            $product->delete();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
            ]);
            throw $e;
        }
    }

    /**
     * Restore soft deleted product
     */
    public function restoreProduct(string $id): bool
    {
        DB::beginTransaction();

        try {
            $product = Product::withTrashed()->findOrFail($id);

            if (!$product->trashed()) {
                throw new \Exception('Product is not in deleted status');
            }

            // Restore product
            $product->restore();

            // Restore related variants
            ProductVariant::withTrashed()
                ->where('product_id', $product->id)
                ->restore();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to restore product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
            ]);
            throw $e;
        }
    }

    /**
     * Permanently delete product (force delete)
     */
    public function forceDeleteProduct(string $id): bool
    {
        DB::beginTransaction();

        try {
            $product = Product::withTrashed()->findOrFail($id);

            if (!$product->trashed()) {
                throw new \Exception('Product must be in deleted status first');
            }

            // Force delete product (cascade will force delete variants)
            $product->forceDelete();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to force delete product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
            ]);
            throw $e;
        }
    }

    /**
     * Get products count
     */
    public function getProductsCount(): int
    {
        return Product::count();
    }

    /**
     * Search products
     */
    public function searchProducts(string $query, int $perPage, array $filters = []): LengthAwarePaginator
    {
        // Check if we should include deleted products
        $withTrashed = $filters['with_trashed'] ?? false;

        // Build query based on with_trashed parameter
        if ($withTrashed) {
            $searchQuery = Product::withTrashed()->with('variants');
        } else {
            $searchQuery = Product::with('variants');
        }

        // Apply search filter
        $searchQuery->where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
              ->orWhere('sku', 'like', "%{$query}%");
        });

        // Apply sorting
        $sortField = $filters['sort'] ?? 'created_at';
        $sortOrder = $filters['order'] ?? 'desc';

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['name', 'sku', 'created_at', 'updated_at'];

        if (in_array($sortField, $allowedSortFields)) {
            $searchQuery->orderBy($sortField, $sortOrder);
        } else {
            $searchQuery->orderBy('created_at', 'desc');
        }

        // Paginate results
        $products = $searchQuery->paginate($perPage);

        // Transform variants to match frontend expectations
        // Map 'variant_name' to 'name' for consistency with frontend
        $products->getCollection()->transform(function ($product) {
            $variantsCount = $product->variants->count();
            $totalStock = 0;
            
            $product->variants->transform(function ($variant) use (&$totalStock) {
                $totalStock += $variant->stock_current;
                return [
                    'id' => $variant->id,
                    'name' => $variant->variant_name, // Map variant_name to name
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                    'product_id' => $variant->product_id,
                ];
            });
            // Add variants_count and total_stock to product
            $product->variants_count = $variantsCount;
            $product->total_stock = $totalStock;
            return $product;
        });

        return $products;
    }
}
