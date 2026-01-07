<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\ProductCreateRequest;
use App\Http\Requests\Product\ProductUpdateRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct()
    {
        // Permission middleware
        $this->middleware('permission:products.view')->only(['index', 'show']);
        $this->middleware('permission:products.create')->only(['create', 'store']);
        $this->middleware('permission:products.update')->only(['edit', 'update']);
        $this->middleware('permission:products.delete')->only(['destroy']);
    }

    /**
     * Check if user has specific role
     */
    private function userHasRole($user, string $role): bool
    {
        return $user->roles()->where('name', $role)->exists();
    }

    /**
     * Check if user has specific permission
     */
    private function userHasPermission($user, string $permission): bool
    {
        return $user->permissions()->where('name', $permission)->exists() ||
               $user->roles()->whereHas('permissions', function ($query) use ($permission) {
                   $query->where('name', $permission);
               })->exists();
    }

    /**
     * Log product management actions for audit trail
     */
    private function logProductAction(string $action, string $productId, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('Product Management Action', [
            'action' => $action,
            'performed_by' => $currentUser->id,
            'performed_by_name' => $currentUser->name,
            'product_id' => $productId,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Display a listing of products
     */
    public function index(Request $request): Response
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search', '');

            // Query products with eager loading variants
            $query = Product::with('variants');

            // Apply search filter if provided
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            }

            // Order by created_at desc
            $query->orderBy('created_at', 'desc');

            // Paginate results
            $products = $query->paginate($perPage);

            // Transform variants to match frontend expectations
            // Map 'variant_name' to 'name' for consistency with frontend
            $products->getCollection()->transform(function ($product) {
                $variantsCount = $product->variants->count();
                $product->variants->transform(function ($variant) {
                    return [
                        'id' => $variant->id,
                        'name' => $variant->variant_name, // Map variant_name to name
                        'sku' => $variant->sku,
                        'stock_current' => $variant->stock_current,
                    ];
                });
                // Add variants_count to product
                $product->variants_count = $variantsCount;
                return $product;
            });

            // Calculate total variants across all products
            $totalVariants = 0;
            foreach ($products as $product) {
                $totalVariants += $product->variants->count();
            }

            // Get product statistics for meta data
            $meta = [
                'total' => $products->total(),
                'total_variants' => $totalVariants,
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
                'has_more_pages' => $products->hasMorePages(),
            ];

            $this->logProductAction('view_product_list', 'all', [
                'search' => $search,
                'per_page' => $perPage,
            ]);

            return Inertia::render('Products/Index', [
                'products' => $products,
                'filters' => [
                    'search' => $search,
                    'per_page' => $perPage,
                ],
                'meta' => $meta,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch products', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('Products/Index', [
                'products' => [],
                'filters' => [
                    'search' => '',
                    'per_page' => 15,
                ],
                'meta' => [],
                'error' => 'Gagal memuat data produk. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Show form for creating a new product
     */
    public function create(): Response
    {
        return Inertia::render('Products/Create');
    }

    /**
     * Store a newly created product
     */
    public function store(ProductCreateRequest $request)
    {
        try {
            $validatedData = $request->validated();

            // Use DB transaction to ensure atomicity
            DB::transaction(function () use ($validatedData) {
                // Create product first
                $product = Product::create([
                    'name' => $validatedData['name'],
                    'sku' => $validatedData['sku'],
                    'description' => $validatedData['description'] ?? null,
                ]);

                // Loop through variants array and create each variant
                foreach ($validatedData['variants'] as $variantData) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_name' => $variantData['name'],
                        'sku' => $variantData['sku'],
                        'stock_current' => $variantData['stock_current'],
                    ]);
                }

                $this->logProductAction('create_product', $product->id, [
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'variants_count' => count($validatedData['variants']),
                ]);
            });

            return redirect()->route('products.index')
                ->with('success', 'Produk berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Failed to create product', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menambahkan produk. Silakan coba lagi.')
                ->withInput();
        }
    }

    /**
     * Display specified product
     */
    public function show(string $id): Response
    {
        try {
            // Find product by ID with eager loading variants
            $product = Product::with('variants')->find($id);

            if (!$product) {
                abort(404, 'Produk tidak ditemukan.');
            }

            // Transform variants to match frontend expectations
            // Map 'variant_name' to 'name' for consistency with frontend
            $variantsCount = $product->variants->count();
            $product->variants->transform(function ($variant) {
                return [
                    'id' => $variant->id,
                    'name' => $variant->variant_name, // Map variant_name to name
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                ];
            });
            // Add variants_count to product
            $product->variants_count = $variantsCount;

            $this->logProductAction('view_product_detail', $id);

            return Inertia::render('Products/Show', [
                'product' => $product,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch product detail', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Produk tidak ditemukan.');
        }
    }

    /**
     * Show form for editing specified product
     */
    public function edit(string $id): Response
    {
        try {
            // Find product by ID with eager loading variants
            $product = Product::with('variants')->find($id);

            if (!$product) {
                abort(404, 'Produk tidak ditemukan.');
            }

            // Transform variants to match frontend expectations
            // Map 'variant_name' to 'name' for consistency with frontend
            $variantsCount = $product->variants->count();
            $product->variants->transform(function ($variant) {
                return [
                    'id' => $variant->id,
                    'name' => $variant->variant_name, // Map variant_name to name
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                ];
            });
            // Add variants_count to product
            $product->variants_count = $variantsCount;

            $this->logProductAction('view_product_edit_form', $id);

            return Inertia::render('Products/Edit', [
                'product' => $product,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch product for edit', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Produk tidak ditemukan.');
        }
    }

    /**
     * Update specified product
     */
    public function update(ProductUpdateRequest $request, string $id)
    {
        try {
            // Log incoming data for debugging
            Log::info('Product Update Request Data', [
                'product_id' => $id,
                'all_input_data' => $request->all(),
                'validated_data' => $request->validated(),
            ]);

            // Find product by ID with variants
            $product = Product::with('variants')->find($id);

            if (!$product) {
                return redirect()->back()
                    ->with('error', 'Produk tidak ditemukan.');
            }

            $validatedData = $request->validated();

            // Use DB transaction to ensure atomicity
            DB::transaction(function () use ($product, $validatedData, $id) {
                // Update product data
                $product->update([
                    'name' => $validatedData['name'],
                    'sku' => $validatedData['sku'],
                    'description' => $validatedData['description'] ?? null,
                ]);

                // Get existing variant IDs
                $existingVariantIds = $product->variants->pluck('id')->toArray();

                // Get submitted variant IDs (excluding null IDs for new variants)
                $submittedVariantIds = array_filter(
                    array_column($validatedData['variants'], 'id'),
                    function ($id) { return $id !== null; }
                );

                // Update or create variants
                foreach ($validatedData['variants'] as $variantData) {
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

                // Delete variants that are not in the submitted list
                $variantsToDelete = array_diff($existingVariantIds, $submittedVariantIds);
                if (!empty($variantsToDelete)) {
                    ProductVariant::whereIn('id', $variantsToDelete)->delete();
                }

                $this->logProductAction('update_product', $id, [
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'updated_fields' => array_keys($validatedData),
                    'variants_count' => count($validatedData['variants']),
                    'variants_deleted' => count($variantsToDelete),
                ]);
            });

            return redirect()->route('products.index')
                ->with('success', 'Produk dan varian berhasil diperbarui.');
        } catch (ValidationException $e) {
            Log::error('Validation failed during product update', [
                'error' => $e->getMessage(),
                'errors' => $e->errors(),
                'product_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to update product', [
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'product_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui produk. Silakan coba lagi.')
                ->withInput();
        }
    }

    /**
     * Remove specified product
     */
    public function destroy(string $id)
    {
        try {
            // Find product by ID with eager loading variants
            $product = Product::with('variants')->find($id);

            if (!$product) {
                return redirect()->back()
                    ->with('error', 'Produk tidak ditemukan.');
            }

            // Validation: Product should not have variants
            if ($product->variants()->count() > 0) {
                return redirect()->back()
                    ->with('error', 'Produk tidak dapat dihapus karena masih memiliki varian. Silakan hapus varian terlebih dahulu.');
            }

            // Validation: Product should not be used in templates (skip for now as template is not created yet)
            // TODO: Add template validation when template feature is implemented

            // Delete product (cascade will delete variants)
            $productName = $product->name;
            $productSku = $product->sku;
            $product->delete();

            $this->logProductAction('delete_product', $id, [
                'name' => $productName,
                'sku' => $productSku,
            ]);

            return redirect()->route('products.index')
                ->with('success', 'Produk berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Failed to delete product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus produk. Silakan coba lagi.');
        }
    }
}
