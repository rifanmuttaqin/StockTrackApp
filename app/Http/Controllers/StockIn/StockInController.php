<?php

namespace App\Http\Controllers\StockIn;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockIn\StockInCreateRequest;
use App\Http\Requests\StockIn\StockInSubmitRequest;
use App\Http\Requests\StockIn\StockInUpdateRequest;
use App\Models\ProductVariant;
use App\Models\StockInRecord;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class StockInController extends Controller
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
     * Log stock in management actions for audit trail
     */
    private function logStockInAction(string $action, string $recordId, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('Stock In Management Action', [
            'action' => $action,
            'performed_by' => $currentUser->id,
            'performed_by_name' => $currentUser->name,
            'stock_in_record_id' => $recordId,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Display a listing of stock in records
     */
    public function index(Request $request): Response
    {
        try {
            $statusFilter = $request->get('status');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 5);

            // Load stock in records with complete eager loading
            // items.productVariant: untuk mendapatkan data varian lengkap (variant_name, sku, stock_current)
            // items.productVariant.product: untuk mendapatkan data produk terkait
            $query = StockInRecord::with(['items.productVariant', 'items.productVariant.product']);

            // Filter by status if provided
            if ($statusFilter && in_array($statusFilter, ['draft', 'submit'])) {
                $query->where('status', $statusFilter);
            }

            // Filter by date range if provided
            if ($startDate && $endDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }

            // Build separate queries for statistics
            $totalDraftQuery = StockInRecord::query();
            $totalSubmitQuery = StockInRecord::query();
            $totalItemsQuery = StockInRecord::query();

            // Apply same filters to statistics queries
            if ($statusFilter && in_array($statusFilter, ['draft', 'submit'])) {
                $totalDraftQuery->where('status', $statusFilter);
                $totalSubmitQuery->where('status', $statusFilter);
                $totalItemsQuery->where('status', $statusFilter);
            }

            if ($startDate && $endDate) {
                $totalDraftQuery->whereBetween('date', [$startDate, $endDate]);
                $totalSubmitQuery->whereBetween('date', [$startDate, $endDate]);
                $totalItemsQuery->whereBetween('date', [$startDate, $endDate]);
            }

            // Calculate statistics
            $totalDraft = $totalDraftQuery->where('status', 'draft')->count();
            $totalSubmit = $totalSubmitQuery->where('status', 'submit')->count();
            $totalItems = $totalItemsQuery->withCount('items')->get()->sum('items_count');

            $paginatedStockInRecords = $query->orderBy('date', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Build pagination object
            $pagination = [
                'current_page' => $paginatedStockInRecords->currentPage(),
                'last_page' => $paginatedStockInRecords->lastPage(),
                'per_page' => $paginatedStockInRecords->perPage(),
                'total' => $paginatedStockInRecords->total(),
                'from' => $paginatedStockInRecords->firstItem(),
                'to' => $paginatedStockInRecords->lastItem(),
            ];

            // Build statistics object
            $statistics = [
                'total_draft' => $totalDraft,
                'total_submit' => $totalSubmit,
                'total_items' => $totalItems,
            ];

            $this->logStockInAction('view_stock_in_list', 'all', [
                'status_filter' => $statusFilter,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);

            return Inertia::render('StockIn/Index', [
                'stockInRecords' => $paginatedStockInRecords->items(),
                'pagination' => $pagination,
                'statistics' => $statistics,
                'filters' => [
                    'status' => $statusFilter,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch stock in records', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('StockIn/Index', [
                'stockInRecords' => [],
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
                    'status' => $statusFilter,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'error' => 'Gagal memuat data stock in. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Show form for creating a new stock in record
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

            // Validate if no active template exists
            if (!$activeTemplate) {
                return Inertia::render('StockIn/Create', [
                    'activeTemplate' => null,
                    'defaultDate' => now()->toDateString(),
                    'error' => 'Tidak ada template aktif. Silakan aktifkan template terlebih dahulu.',
                ]);
            }

            $this->logStockInAction('view_stock_in_create_form', 'new');

            return Inertia::render('StockIn/Create', [
                'activeTemplate' => $activeTemplate,
                'defaultDate' => now()->toDateString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load active template for stock in creation', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('StockIn/Create', [
                'activeTemplate' => null,
                'defaultDate' => now()->toDateString(),
                'error' => 'Gagal memuat data template aktif. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Store a newly created stock in record
     */
    public function store(StockInCreateRequest $request)
    {
        try {
            $validatedData = $request->validated();

            $stockInRecord = DB::transaction(function () use ($validatedData) {
                // Create stock in record with status 'draft'
                // Transaction code will be auto-generated by the model
                $record = StockInRecord::create([
                    'date' => $validatedData['date'],
                    'status' => 'draft',
                    'note' => $validatedData['note'] ?? null,
                ]);

                // Create stock in items for each item
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

            $this->logStockInAction('create_stock_in', $stockInRecord->id, [
                'date' => $stockInRecord->date,
                'status' => $stockInRecord->status,
                'transaction_code' => $stockInRecord->transaction_code,
                'note' => $stockInRecord->note,
                'items_count' => count($validatedData['items']),
            ]);

            return Inertia::render('StockIn/Index', [
                'stockInRecord' => $stockInRecord,
                'flash' => [
                    'success' => 'Stock in berhasil dibuat sebagai draft.'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create stock in record', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal membuat stock in. Silakan coba lagi.')
                ->withInput();
        }
    }

    /**
     * Display specified stock in record
     */
    public function show(StockInRecord $stockIn)
    {
        $stockIn->load(['items.productVariant.product']);
        
        // Manually build data structure to ensure nested relationships are properly serialized
        $items = $stockIn->items->map(function($item) {
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
        
        return Inertia::render('StockIn/Show', [
            'stockIn' => [
                'id' => $stockIn->id,
                'transaction_code' => $stockIn->transaction_code,
                'date' => $stockIn->date,
                'status' => $stockIn->status,
                'note' => $stockIn->note,
                'created_at' => $stockIn->created_at,
                'updated_at' => $stockIn->updated_at,
            ],
            'items' => $items,
            'totalQuantity' => collect($items)->sum('quantity'),
            'totalVariants' => count($items),
        ]);
    }

    /**
     * Show form for editing specified stock in record
     */
    public function edit(string $id): Response
    {
        try {
            // Load stock in record with complete eager loading
            // items.productVariant: untuk mendapatkan data varian lengkap (variant_name, sku, stock_current)
            // items.productVariant.product: untuk mendapatkan data produk terkait
            $stockInRecord = StockInRecord::with(['items.productVariant', 'items.productVariant.product'])
                ->findOrFail($id);

            // Validate if record is already submitted
            if ($stockInRecord->isSubmitted()) {
                return Inertia::render('StockIn/Edit', [
                    'stockInRecord' => null,
                    'error' => 'Stock in sudah disubmit dan tidak dapat diubah.',
                ]);
            }

            // Get active template
            $activeTemplate = Cache::remember('active_template', 60, function () {
                return Template::with(['items.productVariant.product'])
                    ->where('is_active', true)
                    ->first();
            });

            $this->logStockInAction('view_stock_in_edit_form', $id);

            return Inertia::render('StockIn/Edit', [
                'stockInRecord' => $stockInRecord,
                'activeTemplate' => $activeTemplate,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch stock in record for edit', [
                'error' => $e->getMessage(),
                'stock_in_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Stock in tidak ditemukan.');
        }
    }

    /**
     * Update specified stock in record
     */
    public function update(StockInUpdateRequest $request, StockInRecord $stockIn)
    {
        try {
            $validatedData = $request->validated();

            $stockInRecord = DB::transaction(function () use ($stockIn, $validatedData) {
                $record = $stockIn;

                // Validate if record is already submitted
                if ($record->isSubmitted()) {
                    throw new \Exception('Stock in sudah disubmit dan tidak dapat diubah.');
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

            $this->logStockInAction('update_stock_in', $stockIn->id, [
                'date' => $stockInRecord->date,
                'transaction_code' => $stockInRecord->transaction_code,
                'note' => $stockInRecord->note,
                'items_count' => count($validatedData['items']),
            ]);

            return redirect()->route('stock-in.index')
                ->with('success', 'Stock in berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Failed to update stock in record', [
                'error' => $e->getMessage(),
                'stock_in_record_id' => $stockIn->id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui stock in. ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove specified stock in record
     */
    public function destroy(string $id)
    {
        try {
            $stockInRecord = StockInRecord::with('items')->findOrFail($id);

            // Validate if record is already submitted
            if ($stockInRecord->isSubmitted()) {
                return redirect()->back()
                    ->with('error', 'Stock in sudah disubmit dan tidak dapat dihapus.');
            }

            $itemsCount = $stockInRecord->items->count();

            // Delete record and items (cascade)
            $stockInRecord->delete();

            $this->logStockInAction('delete_stock_in', $id, [
                'date' => $stockInRecord->date,
                'items_count' => $itemsCount,
            ]);

            return redirect()->route('stock-in.index')
                ->with('success', 'Stock in berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Failed to delete stock in record', [
                'error' => $e->getMessage(),
                'stock_in_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus stock in. Silakan coba lagi.');
        }
    }

    /**
     * Submit stock in record
     */
    public function submit(StockInSubmitRequest $request, StockInRecord $stockIn)
    {
        try {
            $validatedData = $request->validated();

            $stockInRecord = DB::transaction(function () use ($stockIn, $validatedData) {
                $record = StockInRecord::with(['items.productVariant'])
                    ->findOrFail($stockIn->id);

                // Validate if record is already submitted
                if ($record->isSubmitted()) {
                    throw new \Exception('Stock in sudah disubmit sebelumnya.');
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

                // Increment stock current for each variant using NEW quantities
                // CRITICAL DIFFERENCE: Stock In INCREMENTS stock instead of DECREMENTING like Stock Out
                foreach ($record->items as $item) {
                    $variant = $item->productVariant;
                    
                    // Increment stock current for each variant using NEW quantities
                    $variant->increment('stock_current', $item->quantity);
                }

                // Update status to 'submit'
                $record->update([
                    'status' => 'submit',
                ]);

                return $record;
            });

            $this->logStockInAction('submit_stock_in', $stockIn->id, [
                'date' => $stockInRecord->date,
                'items_count' => $stockInRecord->items->count(),
            ]);

            return redirect()->route('stock-in.index')
                ->with('success', 'Stock in berhasil disubmit dan stok telah ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Failed to submit stock in record', [
                'error' => $e->getMessage(),
                'stock_in_record_id' => $stockIn->id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal mensubmit stock in. ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Update note for stock in record
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

            $stockInRecord = StockInRecord::findOrFail($id);

            // Update only the note field
            $stockInRecord->update([
                'note' => $validatedData['note'] ?? null,
            ]);

            $this->logStockInAction('update_note_stock_in', $id, [
                'transaction_code' => $stockInRecord->transaction_code,
                'note' => $stockInRecord->note,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catatan berhasil diperbarui.',
                'data' => [
                    'id' => $stockInRecord->id,
                    'transaction_code' => $stockInRecord->transaction_code,
                    'note' => $stockInRecord->note,
                    'updated_at' => $stockInRecord->updated_at,
                ],
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update stock in note', [
                'error' => $e->getMessage(),
                'stock_in_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui catatan. Silakan coba lagi.',
            ], 500);
        }
    }
}
