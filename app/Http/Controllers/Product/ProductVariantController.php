<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\ProductVariantCreateRequest;
use App\Http\Requests\Product\ProductVariantUpdateRequest;
use App\Http\Requests\Product\ProductVariantStockUpdateRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProductVariantController extends Controller
{
    public function __construct()
    {
        // Permission middleware
        $this->middleware('permission:product_variants.view')->only(['index', 'show']);
        $this->middleware('permission:product_variants.create')->only(['create', 'store']);
        $this->middleware('permission:product_variants.edit')->only(['edit', 'update', 'updateStock']);
        $this->middleware('permission:product_variants.delete')->only(['destroy']);
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
     * Log product variant management actions for audit trail
     */
    private function logVariantAction(string $action, string $variantId, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('Product Variant Management Action', [
            'action' => $action,
            'performed_by' => $currentUser->id,
            'performed_by_name' => $currentUser->name,
            'variant_id' => $variantId,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Display a listing of variants for a specific product
     */
    public function index(Request $request, string $productId): Response
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search', '');

            // Find product by ID
            $product = Product::find($productId);

            if (!$product) {
                abort(404, 'Produk tidak ditemukan.');
            }

            // Query variants for the product
            $query = ProductVariant::where('product_id', $productId);

            // Apply search filter if provided
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('variant_name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            }

            // Order by created_at desc
            $query->orderBy('created_at', 'desc');

            // Paginate results
            $variants = $query->paginate($perPage);

            // Get variant statistics for meta data
            $meta = [
                'total' => $variants->total(),
                'per_page' => $variants->perPage(),
                'current_page' => $variants->currentPage(),
                'last_page' => $variants->lastPage(),
                'from' => $variants->firstItem(),
                'to' => $variants->lastItem(),
                'has_more_pages' => $variants->hasMorePages(),
            ];

            $this->logVariantAction('view_variant_list', $productId, [
                'product_id' => $productId,
                'product_name' => $product->name,
                'search' => $search,
                'per_page' => $perPage,
            ]);

            return Inertia::render('ProductVariants/Index', [
                'variants' => $variants,
                'product' => $product,
                'filters' => [
                    'search' => $search,
                    'per_page' => $perPage,
                ],
                'meta' => $meta,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch product variants', [
                'error' => $e->getMessage(),
                'product_id' => $productId,
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('ProductVariants/Index', [
                'variants' => [],
                'product' => $product ?? null,
                'filters' => [
                    'search' => '',
                    'per_page' => 15,
                ],
                'meta' => [],
                'error' => 'Gagal memuat data varian produk. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Show form for creating a new variant for a specific product
     */
    public function create(string $productId): Response
    {
        try {
            // Find product by ID
            $product = Product::find($productId);

            if (!$product) {
                abort(404, 'Produk tidak ditemukan.');
            }

            $this->logVariantAction('view_variant_create_form', $productId, [
                'product_id' => $productId,
                'product_name' => $product->name,
            ]);

            return Inertia::render('ProductVariants/Create', [
                'product' => $product,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load variant create form', [
                'error' => $e->getMessage(),
                'product_id' => $productId,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Produk tidak ditemukan.');
        }
    }

    /**
     * Store a newly created variant
     */
    public function store(ProductVariantCreateRequest $request, string $productId)
    {
        try {
            // Find product by ID
            $product = Product::find($productId);

            if (!$product) {
                return redirect()->back()
                    ->with('error', 'Produk tidak ditemukan.');
            }

            $validatedData = $request->validated();

            // Create variant
            $variant = ProductVariant::create([
                'product_id' => $productId,
                'variant_name' => $validatedData['variant_name'],
                'sku' => $validatedData['sku'],
                'stock_current' => $validatedData['stock_current'] ?? 0,
            ]);

            $this->logVariantAction('create_variant', $variant->id, [
                'product_id' => $productId,
                'product_name' => $product->name,
                'variant_name' => $variant->variant_name,
                'sku' => $variant->sku,
                'stock_current' => $variant->stock_current,
            ]);

            return redirect()->route('product_variants.index', $productId)
                ->with('success', 'Varian produk berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Failed to create product variant', [
                'error' => $e->getMessage(),
                'product_id' => $productId,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menambahkan varian produk. Silakan coba lagi.')
                ->withInput();
        }
    }

    /**
     * Display specified variant
     */
    public function show(string $id): Response
    {
        try {
            // Find variant by ID with eager loading product
            $variant = ProductVariant::with('product')->find($id);

            if (!$variant) {
                abort(404, 'Varian produk tidak ditemukan.');
            }

            $this->logVariantAction('view_variant_detail', $id, [
                'variant_name' => $variant->variant_name,
                'sku' => $variant->sku,
                'product_id' => $variant->product_id,
                'product_name' => $variant->product->name,
            ]);

            return Inertia::render('ProductVariants/Show', [
                'variant' => $variant,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch variant detail', [
                'error' => $e->getMessage(),
                'variant_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Varian produk tidak ditemukan.');
        }
    }

    /**
     * Show form for editing specified variant
     */
    public function edit(string $id): Response
    {
        try {
            // Find variant by ID with eager loading product
            $variant = ProductVariant::with('product')->find($id);

            if (!$variant) {
                abort(404, 'Varian produk tidak ditemukan.');
            }

            $this->logVariantAction('view_variant_edit_form', $id, [
                'variant_name' => $variant->variant_name,
                'sku' => $variant->sku,
                'product_id' => $variant->product_id,
                'product_name' => $variant->product->name,
            ]);

            return Inertia::render('ProductVariants/Edit', [
                'variant' => $variant,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch variant for edit', [
                'error' => $e->getMessage(),
                'variant_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Varian produk tidak ditemukan.');
        }
    }

    /**
     * Update specified variant
     */
    public function update(ProductVariantUpdateRequest $request, string $id)
    {
        try {
            // Find variant by ID
            $variant = ProductVariant::find($id);

            if (!$variant) {
                return redirect()->back()
                    ->with('error', 'Varian produk tidak ditemukan.');
            }

            $validatedData = $request->validated();

            // Update variant data
            $variant->update([
                'variant_name' => $validatedData['variant_name'],
                'sku' => $validatedData['sku'],
                'stock_current' => $validatedData['stock_current'] ?? $variant->stock_current,
            ]);

            $this->logVariantAction('update_variant', $id, [
                'variant_name' => $variant->variant_name,
                'sku' => $variant->sku,
                'stock_current' => $variant->stock_current,
                'product_id' => $variant->product_id,
                'updated_fields' => array_keys($validatedData),
            ]);

            return redirect()->route('product_variants.index', $variant->product_id)
                ->with('success', 'Varian produk berhasil diperbarui.');
        } catch (ValidationException $e) {
            Log::error('Validation failed during variant update', [
                'error' => $e->getMessage(),
                'errors' => $e->errors(),
                'variant_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to update variant', [
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'variant_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui varian produk. Silakan coba lagi.')
                ->withInput();
        }
    }

    /**
     * Update variant stock only (for inline editing)
     */
    public function updateStock(ProductVariantStockUpdateRequest $request, string $id)
    {
        try {
            // Find variant by ID
            $variant = ProductVariant::find($id);

            if (!$variant) {
                return response()->json([
                    'message' => 'Varian produk tidak ditemukan.',
                ], 404);
            }

            $validatedData = $request->validated();

            // Update only the stock_current field
            $variant->update([
                'stock_current' => $validatedData['stock_current'],
            ]);

            $this->logVariantAction('update_variant_stock', $id, [
                'variant_name' => $variant->variant_name,
                'sku' => $variant->sku,
                'stock_current' => $variant->stock_current,
                'product_id' => $variant->product_id,
            ]);

            return response()->json([
                'message' => 'Stok varian berhasil diperbarui.',
                'variant' => [
                    'id' => $variant->id,
                    'name' => $variant->variant_name,
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                    'product_id' => $variant->product_id,
                ],
            ], 200);
        } catch (ValidationException $e) {
            Log::error('Validation failed during variant stock update', [
                'error' => $e->getMessage(),
                'errors' => $e->errors(),
                'variant_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update variant stock', [
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'variant_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Gagal memperbarui stok varian. Silakan coba lagi.',
            ], 500);
        }
    }

    /**
     * Remove specified variant
     */
    public function destroy(string $id)
    {
        try {
            // Find variant by ID with eager loading product
            $variant = ProductVariant::with('product')->find($id);

            if (!$variant) {
                return redirect()->back()
                    ->with('error', 'Varian produk tidak ditemukan.');
            }

            $productId = $variant->product_id;
            $variantName = $variant->variant_name;
            $variantSku = $variant->sku;

            // Validation: Variant should not be used in templates
            // TODO: Add template validation when template feature is implemented
            // if ($variant->templates()->count() > 0) {
            //     return redirect()->back()
            //         ->with('error', 'Varian tidak dapat dihapus karena digunakan dalam template.');
            // }

            // Validation: Variant should not have stock out history
            // TODO: Add stock out validation when stock out feature is implemented
            // if ($variant->stockOuts()->count() > 0) {
            //     return redirect()->back()
            //         ->with('error', 'Varian tidak dapat dihapus karena memiliki riwayat stock keluar.');
            // }

            // Delete variant
            $variant->delete();

            $this->logVariantAction('delete_variant', $id, [
                'variant_name' => $variantName,
                'sku' => $variantSku,
                'product_id' => $productId,
            ]);

            return redirect()->route('product_variants.index', $productId)
                ->with('success', 'Varian produk berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Failed to delete variant', [
                'error' => $e->getMessage(),
                'variant_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus varian produk. Silakan coba lagi.');
        }
    }
}
