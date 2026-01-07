<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\ProductCreateRequest;
use App\Http\Requests\Product\ProductUpdateRequest;
use App\Services\Contracts\ProductServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    protected ProductServiceInterface $productService;

    public function __construct(ProductServiceInterface $productService)
    {
        $this->productService = $productService;

        // Permission middleware
        $this->middleware('permission:products.view')->only(['index', 'show']);
        $this->middleware('permission:products.create')->only(['create', 'store']);
        $this->middleware('permission:products.update')->only(['edit', 'update']);
        $this->middleware('permission:products.delete')->only(['destroy', 'restore', 'forceDelete']);
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
            $filters = $request->only(['search', 'per_page', 'with_trashed']);

            $products = $this->productService->getAllProducts($perPage, $filters);

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
                'filters' => $filters,
            ]);

            return Inertia::render('Products/Index', [
                'products' => $products,
                'filters' => $filters,
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
                    'with_trashed' => '',
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
            $product = $this->productService->createProduct($request);

            $this->logProductAction('create_product', $product->id, [
                'name' => $product->name,
                'sku' => $product->sku,
                'variants_count' => count($validatedData['variants']),
            ]);

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
            $product = $this->productService->findProductById($id);

            if (!$product) {
                abort(404, 'Produk tidak ditemukan.');
            }

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
            $product = $this->productService->findProductById($id);

            if (!$product) {
                abort(404, 'Produk tidak ditemukan.');
            }

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
            $validatedData = $request->validated();

            Log::info('Product Update Request Data', [
                'product_id' => $id,
                'validated_data' => $validatedData,
            ]);

            $success = $this->productService->updateProduct($id, $request);

            if ($success) {
                $this->logProductAction('update_product', $id, [
                    'updated_fields' => array_keys($validatedData),
                    'variants_count' => count($validatedData['variants']),
                ]);

                return redirect()->route('products.index')
                    ->with('success', 'Produk dan varian berhasil diperbarui.');
            }

            return redirect()->back()
                ->with('error', 'Gagal memperbarui produk.')
                ->withInput();
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
     * Remove specified product (soft delete)
     */
    public function destroy(string $id)
    {
        try {
            $product = $this->productService->findProductById($id);

            if (!$product) {
                return redirect()->back()
                    ->with('error', 'Produk tidak ditemukan.');
            }

            $success = $this->productService->deleteProduct($id);

            if ($success) {
                $this->logProductAction('soft_delete_product', $id, [
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'variants_count' => $product->variants->count(),
                ]);

                return redirect()->route('products.index')
                    ->with('success', 'Produk berhasil dihapus (soft delete).');
            }

            return redirect()->back()
                ->with('error', 'Gagal menghapus produk.');
        } catch (\Exception $e) {
            Log::error('Failed to soft delete product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus produk. Silakan coba lagi.');
        }
    }

    /**
     * Restore soft deleted product
     */
    public function restore(string $id)
    {
        try {
            $success = $this->productService->restoreProduct($id);

            if ($success) {
                $this->logProductAction('restore_product', $id);

                return redirect()->route('products.index')
                    ->with('success', 'Produk berhasil dipulihkan.');
            }

            return redirect()->back()
                ->with('error', 'Gagal memulihkan produk.');
        } catch (\Exception $e) {
            Log::error('Failed to restore product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memulihkan produk. Silakan coba lagi.');
        }
    }

    /**
     * Permanently delete product (force delete)
     */
    public function forceDelete(string $id)
    {
        try {
            $success = $this->productService->forceDeleteProduct($id);

            if ($success) {
                $this->logProductAction('force_delete_product', $id);

                return redirect()->route('products.index')
                    ->with('success', 'Produk berhasil dihapus permanen.');
            }

            return redirect()->back()
                ->with('error', 'Gagal menghapus permanen produk.');
        } catch (\Exception $e) {
            Log::error('Failed to force delete product', [
                'error' => $e->getMessage(),
                'product_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus permanen produk. Silakan coba lagi.');
        }
    }
}
