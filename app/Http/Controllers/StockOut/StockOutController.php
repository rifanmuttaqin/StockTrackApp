<?php

namespace App\Http\Controllers\StockOut;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockOut\StockOutCreateRequest;
use App\Http\Requests\StockOut\StockOutSubmitRequest;
use App\Http\Requests\StockOut\StockOutUpdateRequest;
use App\Models\ProductVariant;
use App\Models\StockOutRecord;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class StockOutController extends Controller
{
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
     * Log stock out management actions for audit trail
     */
    private function logStockOutAction(string $action, string $recordId, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('Stock Out Management Action', [
            'action' => $action,
            'performed_by' => $currentUser->id,
            'performed_by_name' => $currentUser->name,
            'stock_out_record_id' => $recordId,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Display a listing of stock out records
     */
    public function index(Request $request): Response
    {
        try {
            $statusFilter = $request->get('status');
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 5);

            // Load stock out records with complete eager loading
            // items.productVariant: untuk mendapatkan data varian lengkap (variant_name, sku, stock_current)
            // items.productVariant.product: untuk mendapatkan data produk terkait
            $query = StockOutRecord::with(['items.productVariant', 'items.productVariant.product']);

            // Filter by status if provided
            if ($statusFilter && in_array($statusFilter, ['draft', 'submit'])) {
                $query->where('status', $statusFilter);
            }

            // Paginate the results
            $paginatedStockOutRecords = $query->orderBy('date', 'desc')->paginate($perPage, ['*'], 'page', $page);

            // Calculate statistics using separate queries
            // Apply the same filter to ALL statistics if status filter is active
            $totalDraftQuery = StockOutRecord::query();
            $totalSubmitQuery = StockOutRecord::query();
            $totalItemsQuery = StockOutRecord::query();
            
            // Apply the same filter to ALL statistics if status filter is active
            if ($statusFilter && in_array($statusFilter, ['draft', 'submit'])) {
                $totalDraftQuery->where('status', $statusFilter);
                $totalSubmitQuery->where('status', $statusFilter);
                $totalItemsQuery->where('status', $statusFilter);
            }

            $totalDraft = $totalDraftQuery->where('status', 'draft')->count();
            $totalSubmit = $totalSubmitQuery->where('status', 'submit')->count();
            $totalItems = $totalItemsQuery->withCount('items')->get()->sum('items_count');

            // Build pagination object
            $pagination = [
                'current_page' => $paginatedStockOutRecords->currentPage(),
                'last_page' => $paginatedStockOutRecords->lastPage(),
                'per_page' => $paginatedStockOutRecords->perPage(),
                'total' => $paginatedStockOutRecords->total(),
                'from' => $paginatedStockOutRecords->firstItem(),
                'to' => $paginatedStockOutRecords->lastItem(),
            ];

            // Build statistics object
            $statistics = [
                'total_draft' => $totalDraft,
                'total_submit' => $totalSubmit,
                'total_items' => $totalItems,
            ];

            $this->logStockOutAction('view_stock_out_list', 'all', [
                'status_filter' => $statusFilter,
                'page' => $page,
                'per_page' => $perPage,
            ]);

            return Inertia::render('StockOut/Index', [
                'stockOutRecords' => $paginatedStockOutRecords->items(),
                'pagination' => $pagination,
                'statistics' => $statistics,
                'filters' => [
                    'status' => $statusFilter,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch stock out records', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('StockOut/Index', [
                'stockOutRecords' => [],
                'pagination' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 5,
                    'total' => 0,
                    'from' => null,
                    'to' => null,
                ],
                'statistics' => [
                    'total_draft' => 0,
                    'total_submit' => 0,
                    'total_items' => 0,
                ],
                'filters' => [
                    'status' => '',
                ],
                'error' => 'Gagal memuat data stock out. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Show form for creating a new stock out record
     */
    public function create(): Response
    {
        try {
            // Get active template from cache or database with complete variant data
            $activeTemplate = Cache::remember('active_template', 60, function () {
                return Template::with(['items.productVariant.product'])
                    ->where('is_active', true)
                    ->first();
            });

            // Validate if no active template exists (EC-PRD-026)
            if (!$activeTemplate) {
                return Inertia::render('StockOut/Create', [
                    'activeTemplate' => null,
                    'defaultDate' => now()->toDateString(),
                    'error' => 'Tidak ada template aktif. Silakan aktifkan template terlebih dahulu.',
                ]);
            }

            $this->logStockOutAction('view_stock_out_create_form', 'new');

            return Inertia::render('StockOut/Create', [
                'activeTemplate' => $activeTemplate,
                'defaultDate' => now()->toDateString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load active template for stock out creation', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('StockOut/Create', [
                'activeTemplate' => null,
                'defaultDate' => now()->toDateString(),
                'error' => 'Gagal memuat data template aktif. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Store a newly created stock out record
     */
    public function store(StockOutCreateRequest $request)
    {
        try {
            $validatedData = $request->validated();

            $stockOutRecord = DB::transaction(function () use ($validatedData) {
                // Create stock out record with status 'draft'
                // Transaction code will be auto-generated by the model
                $record = StockOutRecord::create([
                    'date' => $validatedData['date'],
                    'status' => 'draft',
                    'note' => $validatedData['note'] ?? null,
                ]);

                // Create stock out items for each item
                foreach ($validatedData['items'] as $item) {
                    $record->items()->create([
                        'product_variant_id' => $item['product_variant_id'],
                        'quantity' => $item['quantity'],
                    ]);
                }

                return $record;
            });

            // Clear active template cache
            Cache::forget('active_template');

            $this->logStockOutAction('create_stock_out', $stockOutRecord->id, [
                'date' => $stockOutRecord->date,
                'status' => $stockOutRecord->status,
                'transaction_code' => $stockOutRecord->transaction_code,
                'note' => $stockOutRecord->note,
                'items_count' => count($validatedData['items']),
            ]);

            return Inertia::render('StockOut/Index', [
                'stockOutRecord' => $stockOutRecord,
                'flash' => [
                    'success' => 'Stock out berhasil dibuat sebagai draft.'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create stock out record', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal membuat stock out. Silakan coba lagi.')
                ->withInput();
        }
    }

    /**
     * Show form for editing specified stock out record
     */
    public function edit(string $id): Response
    {
        try {
            // Load stock out record with complete eager loading
            // items.productVariant: untuk mendapatkan data varian lengkap (variant_name, sku, stock_current)
            // items.productVariant.product: untuk mendapatkan data produk terkait
            $stockOutRecord = StockOutRecord::with(['items.productVariant', 'items.productVariant.product'])
                ->findOrFail($id);

            // Validate if record is already submitted (EC-PRD-022)
            if ($stockOutRecord->isSubmitted()) {
                return Inertia::render('StockOut/Edit', [
                    'stockOutRecord' => null,
                    'error' => 'Stock out sudah disubmit dan tidak dapat diubah.',
                ]);
            }

            $this->logStockOutAction('view_stock_out_edit_form', $id);

            return Inertia::render('StockOut/Edit', [
                'stockOutRecord' => $stockOutRecord,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch stock out record for edit', [
                'error' => $e->getMessage(),
                'stock_out_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Stock out tidak ditemukan.');
        }
    }

    /**
     * Update specified stock out record
     */
    public function update(StockOutUpdateRequest $request, StockOutRecord $stockOut)
    {
        try {
            $validatedData = $request->validated();

            $stockOutRecord = DB::transaction(function () use ($stockOut, $validatedData) {
                $record = $stockOut;

                // Validate if record is already submitted (EC-PRD-022)
                if ($record->isSubmitted()) {
                    throw new \Exception('Stock out sudah disubmit dan tidak dapat diubah.');
                }

                // Update date and note
                // Transaction code cannot be modified after creation
                $record->update([
                    'date' => $validatedData['date'],
                    'note' => $validatedData['note'] ?? null,
                ]);

                // Delete old items
                $record->items()->delete();

                // Create new items
                foreach ($validatedData['items'] as $item) {
                    $record->items()->create([
                        'product_variant_id' => $item['product_variant_id'],
                        'quantity' => $item['quantity'],
                    ]);
                }

                return $record;
            });

            $this->logStockOutAction('update_stock_out', $stockOut->id, [
                'date' => $stockOutRecord->date,
                'transaction_code' => $stockOutRecord->transaction_code,
                'note' => $stockOutRecord->note,
                'items_count' => count($validatedData['items']),
            ]);

            return redirect()->route('stock-out.index')
                ->with('success', 'Stock out berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Failed to update stock out record', [
                'error' => $e->getMessage(),
                'stock_out_record_id' => $stockOut->id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui stock out. ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Update note for stock out record
     *
     * This method allows quick note updates for both draft and submitted records.
     * Transaction code cannot be modified.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateNote(Request $request, string $id)
    {
        try {
            $validatedData = $request->validate([
                'note' => 'nullable|string|max:500',
            ]);

            $stockOutRecord = StockOutRecord::findOrFail($id);

            // Update only the note field
            $stockOutRecord->update([
                'note' => $validatedData['note'] ?? null,
            ]);

            $this->logStockOutAction('update_stock_out_note', $id, [
                'transaction_code' => $stockOutRecord->transaction_code,
                'note' => $stockOutRecord->note,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catatan berhasil diperbarui.',
                'data' => [
                    'id' => $stockOutRecord->id,
                    'transaction_code' => $stockOutRecord->transaction_code,
                    'note' => $stockOutRecord->note,
                    'updated_at' => $stockOutRecord->updated_at,
                ],
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update stock out note', [
                'error' => $e->getMessage(),
                'stock_out_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui catatan. Silakan coba lagi.',
            ], 500);
        }
    }

    /**
     * Submit stock out record
     */
    public function submit(StockOutSubmitRequest $request, StockOutRecord $stockOut)
    {
        try {
            $validatedData = $request->validated();

            $stockOutRecord = DB::transaction(function () use ($stockOut, $validatedData) {
                $record = StockOutRecord::with(['items.productVariant'])
                    ->findOrFail($stockOut->id);

                // Validate if record is already submitted (EC-PRD-022)
                if ($record->isSubmitted()) {
                    throw new \Exception('Stock out sudah disubmit sebelumnya.');
                }

                // Delete old items
                $record->items()->delete();

                // Create new items from validated data
                foreach ($validatedData['items'] as $item) {
                    $record->items()->create([
                        'product_variant_id' => $item['product_variant_id'],
                        'quantity' => $item['quantity'],
                    ]);
                }

                // Reload items to get the newly created items with productVariant relationship
                $record->load(['items.productVariant']);

                // Validate stock current >= quantity for each item using NEW quantities
                foreach ($record->items as $item) {
                    $variant = $item->productVariant;
                    if ($variant->stock_current < $item->quantity) {
                        throw new \Exception("Stok tidak mencukupi untuk varian: {$variant->variant_name}. Stok tersedia: {$variant->stock_current}, diminta: {$item->quantity}");
                    }

                    // Decrease stock current for each variant using NEW quantities
                    $variant->decrement('stock_current', $item->quantity);
                }

                // Update status to 'submit'
                $record->update([
                    'status' => 'submit',
                ]);

                return $record;
            });

            $this->logStockOutAction('submit_stock_out', $stockOut->id, [
                'date' => $stockOutRecord->date,
                'items_count' => $stockOutRecord->items->count(),
            ]);

            return redirect()->route('stock-out.index')
                ->with('success', 'Stock out berhasil disubmit dan stok telah dikurangi.');
        } catch (\Exception $e) {
            Log::error('Failed to submit stock out record', [
                'error' => $e->getMessage(),
                'stock_out_record_id' => $stockOut->id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal mensubmit stock out. ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove specified stock out record
     */
    public function destroy(string $id)
    {
        try {
            $stockOutRecord = StockOutRecord::with('items')->findOrFail($id);

            // Validate if record is already submitted (EC-PRD-023)
            if ($stockOutRecord->isSubmitted()) {
                return redirect()->back()
                    ->with('error', 'Stock out sudah disubmit dan tidak dapat dihapus.');
            }

            $itemsCount = $stockOutRecord->items->count();

            // Delete record and items (cascade)
            $stockOutRecord->delete();

            $this->logStockOutAction('delete_stock_out', $id, [
                'date' => $stockOutRecord->date,
                'items_count' => $itemsCount,
            ]);

            return redirect()->route('stock-out.index')
                ->with('success', 'Stock out berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Failed to delete stock out record', [
                'error' => $e->getMessage(),
                'stock_out_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus stock out. Silakan coba lagi.');
        }
    }

    /**
     * Display specified stock out record
     */
    public function show(StockOutRecord $stockOut)
    {
        $stockOut->load(['items.productVariant.product']);
        
        // Manually build data structure to ensure nested relationships are properly serialized
        $items = $stockOut->items->map(function($item) {
            return [
                'id' => $item->id,
                'quantity' => $item->quantity,
                'product_variant_id' => $item->product_variant_id,
                'productVariant' => $item->productVariant ? [
                    'id' => $item->productVariant->id,
                    'variant_name' => $item->productVariant->variant_name,
                    'sku' => $item->productVariant->sku,
                    'stock_current' => $item->productVariant->stock_current,
                    'product' => $item->productVariant->product ? [
                        'id' => $item->productVariant->product->id,
                        'name' => $item->productVariant->product->name,
                    ] : null,
                ] : null,
            ];
        })->toArray();
        
        return Inertia::render('StockOut/Show', [
            'stockOut' => [
                'id' => $stockOut->id,
                'transaction_code' => $stockOut->transaction_code,
                'date' => $stockOut->date,
                'status' => $stockOut->status,
                'note' => $stockOut->note,
                'created_at' => $stockOut->created_at,
                'updated_at' => $stockOut->updated_at,
            ],
            'items' => $items,
            'totalQuantity' => collect($items)->sum('quantity'),
            'totalVariants' => count($items),
        ]);
    }
}
