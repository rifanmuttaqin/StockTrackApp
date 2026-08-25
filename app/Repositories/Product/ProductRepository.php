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
        $eagerLoad = ['variants.baseUnit', 'variants.baseUnit.conversions'];

        if ($withTrashed) {
            $query = Product::withTrashed()->with($eagerLoad);
        } else {
            $query = Product::with($eagerLoad);
        }

        // Apply search filter if provided
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $keywords = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY);

            $query->where(function ($q) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $q->where(function ($q) use ($keyword) {
                        $q->where('name', 'ILIKE', "%{$keyword}%")
                            ->orWhere('sku', 'ILIKE', "%{$keyword}%");
                    });
                }
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
        $products->getCollection()->transform(function ($product) {
            $variantsCount = $product->variants->count();
            $totalStock = 0;

            $product->variants->transform(function ($variant) use (&$totalStock) {
                $totalStock += $variant->stock_current;

                $unitData = null;
                $conversionsData = [];

                if ($variant->baseUnit) {
                    $unitData = [
                        'id' => $variant->baseUnit->id,
                        'name' => $variant->baseUnit->name,
                        'abbreviation' => $variant->baseUnit->abbreviation,
                        'type' => $variant->baseUnit->type,
                    ];

                    if ($variant->baseUnit->conversions) {
                        foreach ($variant->baseUnit->conversions as $conversion) {
                            $convertedStock = $conversion->multiplier > 0
                                ? round($variant->stock_current / $conversion->multiplier, 2)
                                : 0;

                            $conversionsData[] = [
                                'id' => $conversion->id,
                                'name' => $conversion->name,
                                'abbreviation' => $conversion->abbreviation,
                                'multiplier' => (float) $conversion->multiplier,
                                'is_primary' => $conversion->is_primary,
                                'converted_stock' => $convertedStock,
                            ];
                        }
                    }
                }

                return [
                    'id' => $variant->id,
                    'name' => $variant->variant_name,
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                    'stock_threshold' => $variant->stock_threshold ?? 0,
                    'product_id' => $variant->product_id,
                    'unit' => $unitData,
                    'conversions' => $conversionsData,
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
        $product = Product::with(['variants.baseUnit', 'variants.baseUnit.conversions'])->find($id);

        if (!$product) {
            return null;
        }

        $variantsCount = $product->variants->count();
        $totalStock = 0;

        $product->variants->transform(function ($variant) use (&$totalStock) {
            $totalStock += $variant->stock_current;

            $unitData = null;
            $conversionsData = [];

            if ($variant->baseUnit) {
                $unitData = [
                    'id' => $variant->baseUnit->id,
                    'name' => $variant->baseUnit->name,
                    'abbreviation' => $variant->baseUnit->abbreviation,
                    'type' => $variant->baseUnit->type,
                ];

                if ($variant->baseUnit->conversions) {
                    foreach ($variant->baseUnit->conversions as $conversion) {
                        $convertedStock = $conversion->multiplier > 0
                            ? round($variant->stock_current / $conversion->multiplier, 2)
                            : 0;

                        $conversionsData[] = [
                            'id' => $conversion->id,
                            'name' => $conversion->name,
                            'abbreviation' => $conversion->abbreviation,
                            'multiplier' => (float) $conversion->multiplier,
                            'is_primary' => $conversion->is_primary,
                            'converted_stock' => $convertedStock,
                        ];
                    }
                }
            }

            return [
                'id' => $variant->id,
                'name' => $variant->variant_name,
                'sku' => $variant->sku,
                'stock_current' => $variant->stock_current,
                'stock_threshold' => $variant->stock_threshold ?? 0,
                'product_id' => $variant->product_id,
                'unit' => $unitData,
                'conversions' => $conversionsData,
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
                        'stock_threshold' => $variantData['stock_threshold'] ?? 0,
                        'unit_id' => $variantData['unit_id'] ?? null,
                    ]);
                }
            }

            DB::commit();

            // Load variants for the created product
            $product->load('variants.baseUnit', 'variants.baseUnit.conversions');

            // Transform variants to match frontend expectations
            $variantsCount = $product->variants->count();
            $totalStock = 0;

            $product->variants->transform(function ($variant) use (&$totalStock) {
                $totalStock += $variant->stock_current;

                $unitData = null;
                $conversionsData = [];

                if ($variant->baseUnit) {
                    $unitData = [
                        'id' => $variant->baseUnit->id,
                        'name' => $variant->baseUnit->name,
                        'abbreviation' => $variant->baseUnit->abbreviation,
                        'type' => $variant->baseUnit->type,
                    ];

                    if ($variant->baseUnit->conversions) {
                        foreach ($variant->baseUnit->conversions as $conversion) {
                            $convertedStock = $conversion->multiplier > 0
                                ? round($variant->stock_current / $conversion->multiplier, 2)
                                : 0;

                            $conversionsData[] = [
                                'id' => $conversion->id,
                                'name' => $conversion->name,
                                'abbreviation' => $conversion->abbreviation,
                                'multiplier' => (float) $conversion->multiplier,
                                'is_primary' => $conversion->is_primary,
                                'converted_stock' => $convertedStock,
                            ];
                        }
                    }
                }

                return [
                    'id' => $variant->id,
                    'name' => $variant->variant_name,
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                    'stock_threshold' => $variant->stock_threshold ?? 0,
                    'product_id' => $variant->product_id,
                    'unit' => $unitData,
                    'conversions' => $conversionsData,
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
            $product = Product::with(['variants.baseUnit', 'variants.baseUnit.conversions'])->findOrFail($id);

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
                function ($id) {
                    return $id !== null;
                }
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
                                'stock_threshold' => $variantData['stock_threshold'] ?? 0,
                                'unit_id' => $variantData['unit_id'] ?? null,
                            ]);
                        }
                    } else {
                        // Create new variant
                        ProductVariant::create([
                            'product_id' => $product->id,
                            'variant_name' => $variantData['name'],
                            'sku' => $variantData['sku'],
                            'stock_current' => $variantData['stock_current'],
                            'stock_threshold' => $variantData['stock_threshold'] ?? 0,
                            'unit_id' => $variantData['unit_id'] ?? null,
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
        $eagerLoad = ['variants.baseUnit', 'variants.baseUnit.conversions'];

        if ($withTrashed) {
            $searchQuery = Product::withTrashed()->with($eagerLoad);
        } else {
            $searchQuery = Product::with($eagerLoad);
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
        $products->getCollection()->transform(function ($product) {
            $variantsCount = $product->variants->count();
            $totalStock = 0;

            $product->variants->transform(function ($variant) use (&$totalStock) {
                $totalStock += $variant->stock_current;

                $unitData = null;
                $conversionsData = [];

                if ($variant->baseUnit) {
                    $unitData = [
                        'id' => $variant->baseUnit->id,
                        'name' => $variant->baseUnit->name,
                        'abbreviation' => $variant->baseUnit->abbreviation,
                        'type' => $variant->baseUnit->type,
                    ];

                    if ($variant->baseUnit->conversions) {
                        foreach ($variant->baseUnit->conversions as $conversion) {
                            $convertedStock = $conversion->multiplier > 0
                                ? round($variant->stock_current / $conversion->multiplier, 2)
                                : 0;

                            $conversionsData[] = [
                                'id' => $conversion->id,
                                'name' => $conversion->name,
                                'abbreviation' => $conversion->abbreviation,
                                'multiplier' => (float) $conversion->multiplier,
                                'is_primary' => $conversion->is_primary,
                                'converted_stock' => $convertedStock,
                            ];
                        }
                    }
                }

                return [
                    'id' => $variant->id,
                    'name' => $variant->variant_name,
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                    'stock_threshold' => $variant->stock_threshold ?? 0,
                    'product_id' => $variant->product_id,
                    'unit' => $unitData,
                    'conversions' => $conversionsData,
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
