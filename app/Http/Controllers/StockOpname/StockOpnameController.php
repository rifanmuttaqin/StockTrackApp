<?php

namespace App\Http\Controllers\StockOpname;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockOpname\StockOpnameCreateRequest;
use App\Http\Requests\StockOpname\StockOpnameSubmitRequest;
use App\Http\Requests\StockOpname\StockOpnameUpdateNoteRequest;
use App\Http\Requests\StockOpname\StockOpnameUpdateRequest;
use App\Models\ProductVariant;
use App\Models\StockOpnameAuditLog;
use App\Models\StockOpnameItem;
use App\Models\StockOpnameRecord;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class StockOpnameController extends Controller
{
    /**
     * Log stock opname management actions for audit trail
     */
    private function logStockOpnameAction(string $action, string $recordId, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('Stock Opname Management Action', [
            'action' => $action,
            'performed_by' => $currentUser?->id,
            'performed_by_name' => $currentUser?->name,
            'stock_opname_record_id' => $recordId,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Display a listing of stock opname records
     */
    public function index(Request $request): Response
    {
        try {
            $statusFilter = $request->get('status');
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 10);

            $query = StockOpnameRecord::with(['items.productVariant', 'items.productVariant.product', 'creator', 'submitter']);

            if ($statusFilter && in_array($statusFilter, ['draft', 'submit'])) {
                $query->where('status', $statusFilter);
            }

            $paginatedRecords = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);

            // Calculate statistics
            $baseQuery = clone $query;
            if ($statusFilter && in_array($statusFilter, ['draft', 'submit'])) {
                $baseQuery->where('status', $statusFilter);
            }

            $totalDraft = (clone $baseQuery)->where('status', 'draft')->count();
            $totalSubmit = (clone $baseQuery)->where('status', 'submit')->count();

            // Calculate shortage/surplus from submitted records
            $submittedItems = StockOpnameItem::whereHas('record', function ($q) use ($statusFilter) {
                $q->where('status', 'submit');
                if ($statusFilter && in_array($statusFilter, ['draft', 'submit'])) {
                    $q->where('status', $statusFilter);
                }
            })->get();

            $totalShortage = (int) $submittedItems->where('difference', '<', 0)->sum('difference');
            $totalShortage = abs($totalShortage);
            $totalSurplus = (int) $submittedItems->where('difference', '>', 0)->sum('difference');
            $totalMatching = (int) $submittedItems->where('difference', '=', 0)->count();

            $pagination = [
                'current_page' => $paginatedRecords->currentPage(),
                'last_page' => $paginatedRecords->lastPage(),
                'per_page' => $paginatedRecords->perPage(),
                'total' => $paginatedRecords->total(),
                'from' => $paginatedRecords->firstItem(),
                'to' => $paginatedRecords->lastItem(),
            ];

            $statistics = [
                'total_draft' => $totalDraft,
                'total_submit' => $totalSubmit,
                'total_shortage' => $totalShortage,
                'total_surplus' => $totalSurplus,
                'total_matching' => $totalMatching,
            ];

            $this->logStockOpnameAction('view_stock_opname_list', 'all', [
                'status_filter' => $statusFilter,
                'page' => $page,
                'per_page' => $perPage,
            ]);

            return Inertia::render('StockOpname/Index', [
                'stockOpnameRecords' => $paginatedRecords->items(),
                'pagination' => $pagination,
                'statistics' => $statistics,
                'filters' => [
                    'status' => $statusFilter,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch stock opname records', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('StockOpname/Index', [
                'stockOpnameRecords' => [],
                'pagination' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 10,
                    'total' => 0,
                    'from' => null,
                    'to' => null,
                ],
                'statistics' => [
                    'total_draft' => 0,
                    'total_submit' => 0,
                    'total_shortage' => 0,
                    'total_surplus' => 0,
                    'total_matching' => 0,
                ],
                'filters' => [
                    'status' => '',
                ],
                'error' => 'Gagal memuat data stock opname. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Show form for creating a new stock opname record
     */
    public function create(): Response
    {
        try {
            $activeTemplate = Cache::remember('active_template', 60, function () {
                return Template::with(['items.productVariant.product'])
                    ->where('is_active', true)
                    ->first();
            });

            if (!$activeTemplate) {
                return Inertia::render('StockOpname/Create', [
                    'activeTemplate' => null,
                    'defaultDate' => now()->toDateString(),
                    'error' => 'Tidak ada template aktif. Silakan aktifkan template terlebih dahulu.',
                ]);
            }

            $this->logStockOpnameAction('view_stock_opname_create_form', 'new');

            return Inertia::render('StockOpname/Create', [
                'activeTemplate' => $activeTemplate,
                'defaultDate' => now()->toDateString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load active template for stock opname creation', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('StockOpname/Create', [
                'activeTemplate' => null,
                'defaultDate' => now()->toDateString(),
                'error' => 'Gagal memuat data template aktif. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Store a newly created stock opname record.
     * action=store: save as draft.
     * action=submit: create draft + submit (adjust stock) in one transaction.
     */
    public function store(StockOpnameCreateRequest $request)
    {
        try {
            $validatedData = $request->validated();
            $isSubmit = ($validatedData['action'] ?? 'store') === 'submit';

            Log::info('StockOpname store called', [
                'action' => $validatedData['action'] ?? 'store',
                'is_submit' => $isSubmit,
                'items_count' => count($validatedData['items'] ?? []),
                'performed_by' => Auth::id(),
            ]);

            $record = DB::transaction(function () use ($validatedData, $isSubmit) {
                $opname = StockOpnameRecord::create([
                    'date' => $validatedData['date'],
                    'status' => $isSubmit ? 'submit' : 'draft',
                    'note' => $validatedData['note'] ?? null,
                    'created_by' => Auth::id(),
                ]);

                foreach ($validatedData['items'] as $item) {
                    $variant = ProductVariant::lockForUpdate()->findOrFail($item['product_variant_id']);
                    $systemStock = $variant->stock_current;
                    $physicalStock = $item['physical_stock'] ?? null;

                    if ($isSubmit) {
                        // Submit: snapshot system stock saat submit, hitung difference
                        $difference = $physicalStock - $systemStock;
                        $opname->items()->create([
                            'product_variant_id' => $item['product_variant_id'],
                            'system_stock_draft' => $systemStock,
                            'system_stock_submit' => $systemStock,
                            'physical_stock' => $physicalStock,
                            'difference' => $difference,
                        ]);
                        // Adjust stock: set ke physical_stock
                        $variant->stock_current = $physicalStock;
                        $variant->save();
                    } else {
                        // Draft: simpan apa adanya
                        $difference = $physicalStock !== null ? ($physicalStock - $systemStock) : null;
                        $opname->items()->create([
                            'product_variant_id' => $item['product_variant_id'],
                            'system_stock_draft' => $systemStock,
                            'system_stock_submit' => 0,
                            'physical_stock' => $physicalStock,
                            'difference' => $difference,
                        ]);
                    }
                }

                if ($isSubmit) {
                    $opname->update([
                        'submitted_by' => Auth::id(),
                        'submitted_at' => now(),
                    ]);
                }

                // Audit trail
                StockOpnameAuditLog::create([
                    'stock_opname_record_id' => $opname->id,
                    'user_id' => Auth::id(),
                    'action' => $isSubmit ? 'submitted' : 'created',
                    'new_values' => $opname->load('items')->toArray(),
                    'created_at' => now(),
                ]);

                return $opname;
            });

            Cache::forget('active_template');

            $this->logStockOpnameAction(
                $isSubmit ? 'create_and_submit_stock_opname' : 'create_stock_opname',
                $record->id,
                [
                    'date' => $record->date,
                    'status' => $record->status,
                    'transaction_code' => $record->transaction_code,
                    'items_count' => count($validatedData['items']),
                ]
            );

            return redirect()->route('stock-opname.index')
                ->with('success', $isSubmit
                    ? 'Stock opname berhasil disubmit dan stok produk diperbarui.'
                    : 'Stock opname berhasil disimpan sebagai draft.');
        } catch (\Exception $e) {
            Log::error('Failed to create stock opname record', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menyimpan: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Display the specified stock opname record
     */
    public function show(string $id): Response
    {
        try {
            $record = StockOpnameRecord::with([
                'items.productVariant',
                'items.productVariant.product',
                'creator',
                'submitter',
                'auditLogs.user',
            ])->findOrFail($id);

            $this->logStockOpnameAction('view_stock_opname_detail', $id);

            return Inertia::render('StockOpname/Show', [
                'stockOpnameRecord' => $record,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch stock opname record', [
                'error' => $e->getMessage(),
                'stock_opname_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Stock opname tidak ditemukan.');
        }
    }

    /**
     * Show form for editing specified stock opname record
     */
    public function edit(string $id): Response
    {
        try {
            $record = StockOpnameRecord::with([
                'items.productVariant',
                'items.productVariant.product',
            ])->findOrFail($id);

            if ($record->isSubmitted()) {
                return Inertia::render('StockOpname/Edit', [
                    'stockOpnameRecord' => null,
                    'error' => 'Stock opname sudah disubmit dan tidak dapat diubah.',
                ]);
            }

            $this->logStockOpnameAction('view_stock_opname_edit_form', $id);

            return Inertia::render('StockOpname/Edit', [
                'stockOpnameRecord' => $record,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch stock opname record for edit', [
                'error' => $e->getMessage(),
                'stock_opname_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Stock opname tidak ditemukan.');
        }
    }

    /**
     * Update specified stock opname record (with optimistic locking)
     */
    public function update(StockOpnameUpdateRequest $request, string $id)
    {
        try {
            $validatedData = $request->validated();

            DB::transaction(function () use ($id, $validatedData) {
                // Lock record for update
                $record = StockOpnameRecord::lockForUpdate()->findOrFail($id);

                if ($record->isSubmitted()) {
                    throw new \Exception('Dokumen stock opname ini sudah disubmit sebelumnya.');
                }

                // Optimistic Locking verification
                if ($record->updated_at->format('Y-m-d H:i:s') !== $validatedData['last_updated_at']) {
                    throw new \Exception('Data telah diperbarui oleh pengguna lain. Silakan reload data.');
                }

                $oldValues = $record->load('items')->toArray();

                $record->update([
                    'date' => $validatedData['date'],
                    'note' => $validatedData['note'] ?? null,
                ]);

                // Update items without delete-and-recreate to preserve created_at
                foreach ($validatedData['items'] as $itemData) {
                    $item = StockOpnameItem::where('stock_opname_record_id', $record->id)
                        ->where('product_variant_id', $itemData['product_variant_id'])
                        ->first();

                    $physicalStock = $itemData['physical_stock'] ?? null;

                    if ($item) {
                        $difference = $physicalStock !== null ? ($physicalStock - $item->system_stock_draft) : null;
                        $item->update([
                            'physical_stock' => $physicalStock,
                            'difference' => $difference,
                        ]);
                    }
                }

                // Audit trail: updated_draft
                StockOpnameAuditLog::create([
                    'stock_opname_record_id' => $record->id,
                    'user_id' => Auth::id(),
                    'action' => 'updated_draft',
                    'old_values' => $oldValues,
                    'new_values' => $record->load('items')->toArray(),
                    'created_at' => now(),
                ]);
            });

            $this->logStockOpnameAction('update_stock_opname', $id);

            return redirect()->route('stock-opname.index')
                ->with('success', 'Draft stock opname berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Failed to update stock opname record', [
                'error' => $e->getMessage(),
                'stock_opname_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui draft: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove specified stock opname record (soft delete)
     */
    public function destroy(string $id)
    {
        try {
            $record = StockOpnameRecord::findOrFail($id);

            // Ownership check
            if (!$this->user()->hasRole('admin') &&
                !$this->user()->hasPermissionTo('stock_opname.bypass_ownership') &&
                $record->created_by !== Auth::id()) {
                abort(403, 'Anda tidak memiliki akses untuk menghapus draft ini.');
            }

            if ($record->isSubmitted()) {
                return redirect()->back()
                    ->with('error', 'Dokumen yang sudah disubmit tidak dapat dihapus.');
            }

            $oldValues = $record->load('items')->toArray();

            $record->delete();

            // Audit trail: deleted
            StockOpnameAuditLog::create([
                'stock_opname_record_id' => $id,
                'user_id' => Auth::id(),
                'action' => 'deleted',
                'old_values' => $oldValues,
                'created_at' => now(),
            ]);

            $this->logStockOpnameAction('delete_stock_opname', $id);

            return redirect()->route('stock-opname.index')
                ->with('success', 'Draft stock opname berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Failed to delete stock opname record', [
                'error' => $e->getMessage(),
                'stock_opname_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus draft: ' . $e->getMessage());
        }
    }

    /**
     * Submit stock opname record (with row-level locking and idempotency)
     */
    public function submit(StockOpnameSubmitRequest $request, string $id)
    {
        try {
            $validatedData = $request->validated();

            $result = DB::transaction(function () use ($id, $validatedData) {
                // 1. Lock record for idempotency
                $record = StockOpnameRecord::lockForUpdate()->findOrFail($id);

                if ($record->isSubmitted()) {
                    throw new \Exception('Dokumen stock opname ini sudah disubmit sebelumnya.');
                }

                // 2. Optimistic Locking verification
                if ($record->updated_at->format('Y-m-d H:i:s') !== $validatedData['last_updated_at']) {
                    throw new \Exception('Data telah diperbarui oleh pengguna lain. Silakan reload data.');
                }

                // 3. Update physical stock items before submit
                foreach ($validatedData['items'] as $itemData) {
                    $item = StockOpnameItem::where('stock_opname_record_id', $record->id)
                        ->where('product_variant_id', $itemData['product_variant_id'])
                        ->firstOrFail();

                    $item->update([
                        'physical_stock' => $itemData['physical_stock'],
                    ]);
                }

                // 4. Change status to submit and record audit user
                $record->update([
                    'status' => 'submit',
                    'submitted_by' => Auth::id(),
                    'submitted_at' => now(),
                ]);

                // 5. Dispatch synchronous event (adjusts stock within active transaction)
                event(new \App\Events\StockOpnameSubmitted($record));

                // Audit trail: submitted
                StockOpnameAuditLog::create([
                    'stock_opname_record_id' => $record->id,
                    'user_id' => Auth::id(),
                    'action' => 'submitted',
                    'new_values' => $record->load('items')->toArray(),
                    'created_at' => now(),
                ]);

                return $record;
            });

            $this->logStockOpnameAction('submit_stock_opname', $id);

            return redirect()->route('stock-opname.index')
                ->with('success', 'Stock opname berhasil disubmit. Kuantitas stok produk diperbarui.');
        } catch (\Exception $e) {
            Log::error('Stock opname submit failure', [
                'record_id' => $id,
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memproses submit: ' . $e->getMessage());
        }
    }

    /**
     * Update note for stock opname record (only allowed for draft status)
     */
    public function updateNote(StockOpnameUpdateNoteRequest $request, string $id)
    {
        try {
            $record = StockOpnameRecord::findOrFail($id);

            // Immutability check: block update on submitted documents
            if ($record->isSubmitted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak: Catatan dokumen yang telah disubmit bersifat permanen (immutable).'
                ], 403);
            }

            $validated = $request->validated();
            $oldNote = $record->note;

            $record->update([
                'note' => $validated['note'] ?? null,
            ]);

            // Audit trail: updated_note
            StockOpnameAuditLog::create([
                'stock_opname_record_id' => $record->id,
                'user_id' => Auth::id(),
                'action' => 'updated_note',
                'old_values' => ['note' => $oldNote],
                'new_values' => ['note' => $record->note],
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catatan berhasil diperbarui.',
                'data' => [
                    'id' => $record->id,
                    'note' => $record->note,
                    'updated_at' => $record->updated_at,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update stock opname note', [
                'error' => $e->getMessage(),
                'stock_opname_record_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui catatan. Silakan coba lagi.',
            ], 500);
        }
    }
}
