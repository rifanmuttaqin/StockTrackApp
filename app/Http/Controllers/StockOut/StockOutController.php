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

            $query = StockOutRecord::with(['items.productVariant.product']);

            // Filter by status if provided
            if ($statusFilter && in_array($statusFilter, ['draft', 'submit'])) {
                $query->where('status', $statusFilter);
            }

            $stockOutRecords = $query->orderBy('date', 'desc')->get();

            // Calculate total items across all records
            $totalItems = 0;
            foreach ($stockOutRecords as $record) {
                $totalItems += $record->items->count();
            }

            // Get stock out statistics for meta data
            $meta = [
                'total' => $stockOutRecords->count(),
                'total_items' => $totalItems,
                'draft_count' => $stockOutRecords->where('status', 'draft')->count(),
                'submit_count' => $stockOutRecords->where('status', 'submit')->count(),
            ];

            $this->logStockOutAction('view_stock_out_list', 'all', [
                'status_filter' => $statusFilter,
            ]);

            return Inertia::render('StockOut/Index', [
                'stockOutRecords' => $stockOutRecords,
                'filters' => [
                    'status' => $statusFilter,
                ],
                'meta' => $meta,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch stock out records', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('StockOut/Index', [
                'stockOutRecords' => [],
                'filters' => [
                    'status' => '',
                ],
                'meta' => [],
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
            // Get active template from cache or database
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
                $record = StockOutRecord::create([
                    'date' => $validatedData['date'],
                    'status' => 'draft',
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
                'items_count' => count($validatedData['items']),
            ]);

            return redirect()->route('stock-out.index')
                ->with('success', 'Stock out berhasil dibuat sebagai draft.');
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
            $stockOutRecord = StockOutRecord::with(['items.productVariant.product'])
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
    public function update(StockOutUpdateRequest $request, string $id)
    {
        try {
            $validatedData = $request->validated();

            $stockOutRecord = DB::transaction(function () use ($id, $validatedData) {
                $record = StockOutRecord::findOrFail($id);

                // Validate if record is already submitted (EC-PRD-022)
                if ($record->isSubmitted()) {
                    throw new \Exception('Stock out sudah disubmit dan tidak dapat diubah.');
                }

                // Update date
                $record->update([
                    'date' => $validatedData['date'],
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

            $this->logStockOutAction('update_stock_out', $id, [
                'date' => $stockOutRecord->date,
                'items_count' => count($validatedData['items']),
            ]);

            return redirect()->route('stock-out.index')
                ->with('success', 'Stock out berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Failed to update stock out record', [
                'error' => $e->getMessage(),
                'stock_out_record_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui stock out. ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Submit stock out record
     */
    public function submit(StockOutSubmitRequest $request, string $id)
    {
        try {
            $validatedData = $request->validated();

            $stockOutRecord = DB::transaction(function () use ($id) {
                $record = StockOutRecord::with(['items.productVariant'])
                    ->findOrFail($id);

                // Validate if record is already submitted (EC-PRD-022)
                if ($record->isSubmitted()) {
                    throw new \Exception('Stock out sudah disubmit sebelumnya.');
                }

                // Validate stock current >= quantity for each item
                foreach ($record->items as $item) {
                    $variant = $item->productVariant;
                    if ($variant->stock_current < $item->quantity) {
                        throw new \Exception("Stok tidak mencukupi untuk varian: {$variant->variant_name}. Stok tersedia: {$variant->stock_current}, diminta: {$item->quantity}");
                    }

                    // Decrease stock current for each variant
                    $variant->decrement('stock_current', $item->quantity);
                }

                // Update status to 'submit'
                $record->update([
                    'status' => 'submit',
                ]);

                return $record;
            });

            $this->logStockOutAction('submit_stock_out', $id, [
                'date' => $stockOutRecord->date,
                'items_count' => $stockOutRecord->items->count(),
            ]);

            return redirect()->route('stock-out.index')
                ->with('success', 'Stock out berhasil disubmit dan stok telah dikurangi.');
        } catch (\Exception $e) {
            Log::error('Failed to submit stock out record', [
                'error' => $e->getMessage(),
                'stock_out_record_id' => $id,
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
}
