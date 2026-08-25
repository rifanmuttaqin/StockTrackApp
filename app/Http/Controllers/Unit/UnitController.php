<?php

namespace App\Http\Controllers\Unit;

use App\Http\Controllers\Controller;
use App\Http\Requests\Unit\UnitCreateRequest;
use App\Http\Requests\Unit\UnitUpdateRequest;
use App\Http\Requests\Product\BulkAssignUnitsRequest;
use App\Models\ProductVariant;
use App\Services\Contracts\UnitServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    protected UnitServiceInterface $unitService;

    public function __construct(UnitServiceInterface $unitService)
    {
        $this->unitService = $unitService;

        $this->middleware('permission:units.view')->only(['index', 'show', 'getBaseUnits', 'getConversions']);
        $this->middleware('permission:units.create')->only(['create', 'store']);
        $this->middleware('permission:units.update')->only(['edit', 'update']);
        $this->middleware('permission:units.delete')->only(['destroy', 'restore']);
    }

    private function logUnitAction(string $action, string $unitId, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('Unit Management Action', [
            'action' => $action,
            'performed_by' => $currentUser->id,
            'performed_by_name' => $currentUser->name,
            'unit_id' => $unitId,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function index(Request $request): Response
    {
        try {
            $perPage = $request->get('per_page', 15);
            $filters = $request->only(['search', 'per_page', 'type', 'with_trashed']);

            $units = $this->unitService->getAllUnits($perPage, $filters);

            $meta = [
                'total' => $units->total(),
                'per_page' => $units->perPage(),
                'current_page' => $units->currentPage(),
                'last_page' => $units->lastPage(),
                'from' => $units->firstItem(),
                'to' => $units->lastItem(),
                'has_more_pages' => $units->hasMorePages(),
            ];

            return Inertia::render('Units/Index', [
                'units' => $units,
                'filters' => $filters,
                'meta' => $meta,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch units', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('Units/Index', [
                'units' => [],
                'filters' => [
                    'search' => '',
                    'per_page' => 15,
                    'type' => '',
                    'with_trashed' => '',
                ],
                'meta' => [],
                'error' => 'Gagal memuat data satuan. Silakan coba lagi.',
            ]);
        }
    }

    public function create(): Response
    {
        $baseUnits = $this->unitService->getBaseUnits();

        return Inertia::render('Units/Create', [
            'baseUnits' => $baseUnits,
        ]);
    }

    public function store(UnitCreateRequest $request)
    {
        try {
            $unit = $this->unitService->createUnit($request);

            $this->logUnitAction('create', $unit->id, [
                'name' => $unit->name,
                'abbreviation' => $unit->abbreviation,
                'type' => $unit->type,
            ]);

            return redirect()->route('units.index')
                ->with('success', 'Satuan berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Failed to create unit', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menambahkan satuan. Silakan coba lagi.')
                ->withInput();
        }
    }

    public function show(string $id): Response
    {
        try {
            $unit = $this->unitService->findUnitById($id);

            if (!$unit) {
                abort(404, 'Satuan tidak ditemukan.');
            }

            return Inertia::render('Units/Show', [
                'unit' => $unit,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch unit detail', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Satuan tidak ditemukan.');
        }
    }

    public function edit(string $id): Response
    {
        try {
            $unit = $this->unitService->findUnitById($id);

            if (!$unit) {
                abort(404, 'Satuan tidak ditemukan.');
            }

            $baseUnits = $this->unitService->getBaseUnits();

            return Inertia::render('Units/Edit', [
                'unit' => $unit,
                'baseUnits' => $baseUnits,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch unit for edit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Satuan tidak ditemukan.');
        }
    }

    public function update(UnitUpdateRequest $request, string $id)
    {
        try {
            $success = $this->unitService->updateUnit($id, $request);

            if ($success) {
                $this->logUnitAction('update', $id, [
                    'updated_fields' => array_keys($request->validated()),
                ]);

                return redirect()->route('units.index')
                    ->with('success', 'Satuan berhasil diperbarui.');
            }

            return response()->json([
                'message' => 'Konflik data. Data telah diubah oleh pengguna lain. Silakan muat ulang halaman.',
            ], 409);
        } catch (ValidationException $e) {
            Log::error('Validation failed during unit update', [
                'error' => $e->getMessage(),
                'errors' => $e->errors(),
                'unit_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to update unit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui satuan. Silakan coba lagi.')
                ->withInput();
        }
    }

    public function destroy(string $id)
    {
        try {
            $unit = $this->unitService->findUnitById($id);

            if (!$unit) {
                return redirect()->back()
                    ->with('error', 'Satuan tidak ditemukan.');
            }

            $variantsCount = $unit->variants()->count();
            $conversionsCount = $unit->conversions()->count();

            if ($variantsCount > 0) {
                return redirect()->back()
                    ->with('error', "Satuan tidak dapat dihapus karena masih digunakan oleh {$variantsCount} varian produk.");
            }

            if ($conversionsCount > 0) {
                return redirect()->back()
                    ->with('error', "Satuan tidak dapat dihapus karena masih memiliki {$conversionsCount} satuan konversi.");
            }

            $success = $this->unitService->deleteUnit($id);

            if ($success) {
                $this->logUnitAction('delete', $id, [
                    'name' => $unit->name,
                    'abbreviation' => $unit->abbreviation,
                ]);

                return redirect()->route('units.index')
                    ->with('success', 'Satuan berhasil dihapus.');
            }

            return redirect()->back()
                ->with('error', 'Gagal menghapus satuan.');
        } catch (\Exception $e) {
            Log::error('Failed to delete unit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus satuan. Silakan coba lagi.');
        }
    }

    public function restore(string $id)
    {
        try {
            $success = $this->unitService->restoreUnit($id);

            if ($success) {
                $this->logUnitAction('restore', $id);

                return redirect()->route('units.index')
                    ->with('success', 'Satuan berhasil dipulihkan.');
            }

            return redirect()->back()
                ->with('error', 'Gagal memulihkan satuan.');
        } catch (\Exception $e) {
            Log::error('Failed to restore unit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memulihkan satuan. Silakan coba lagi.');
        }
    }

    public function getBaseUnits()
    {
        try {
            $baseUnits = $this->unitService->getBaseUnits();

            return response()->json([
                'data' => $baseUnits,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch base units', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Gagal memuat data satuan dasar.',
            ], 500);
        }
    }

    public function getConversions(string $id)
    {
        try {
            $conversions = $this->unitService->getConversionsForBaseUnit($id);

            return response()->json([
                'data' => $conversions,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch conversions', [
                'error' => $e->getMessage(),
                'base_unit_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Gagal memuat data konversi satuan.',
            ], 500);
        }
    }

    public function bulkAssignUnits(BulkAssignUnitsRequest $request)
    {
        try {
            $assignments = $request->validated('assignments');
            $updated = 0;
            $skipped = 0;

            DB::beginTransaction();

            foreach ($assignments as $assignment) {
                $variant = ProductVariant::find($assignment['variant_id']);

                if (!$variant) {
                    $skipped++;
                    continue;
                }

                if ($variant->unit_id !== null) {
                    $skipped++;
                    continue;
                }

                $variant->update(['unit_id' => $assignment['unit_id']]);
                $updated++;
            }

            DB::commit();

            $this->logUnitAction('bulk_assign', 'bulk', [
                'updated' => $updated,
                'skipped' => $skipped,
            ]);

            return response()->json([
                'message' => 'Penugasan satuan selesai.',
                'updated' => $updated,
                'skipped' => $skipped,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to bulk assign units', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Gagal menugaskan satuan. Silakan coba lagi.',
            ], 500);
        }
    }
}
