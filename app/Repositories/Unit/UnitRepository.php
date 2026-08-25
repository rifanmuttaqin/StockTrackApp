<?php

namespace App\Repositories\Unit;

use App\Models\Unit;
use App\Repositories\Contracts\UnitRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UnitRepository implements UnitRepositoryInterface
{
    public function getAllUnits(int $perPage, array $filters = []): LengthAwarePaginator
    {
        $withTrashed = $filters['with_trashed'] ?? false;

        if ($withTrashed) {
            $query = Unit::withTrashed()->with('baseUnit');
        } else {
            $query = Unit::with('baseUnit');
        }

        $query->withCount(['variants as variants_count', 'conversions as conversions_count']);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $keywords = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY);

            $query->where(function ($q) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $q->where(function ($q) use ($keyword) {
                        $q->where('name', 'ILIKE', "%{$keyword}%")
                            ->orWhere('abbreviation', 'ILIKE', "%{$keyword}%");
                    });
                }
            });
        }

        $sortField = $filters['sort'] ?? 'created_at';
        $sortOrder = $filters['order'] ?? 'desc';

        $allowedSortFields = ['name', 'abbreviation', 'type', 'created_at', 'updated_at'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return $query->paginate($perPage);
    }

    public function findUnitById(string $id): ?Unit
    {
        return Unit::with(['baseUnit', 'conversions'])->find($id);
    }

    public function createUnit(array $data): Unit
    {
        DB::beginTransaction();

        try {
            if (($data['type'] ?? null) === 'conversion' && !empty($data['is_primary']) && !empty($data['base_unit_id'])) {
                Unit::where('base_unit_id', $data['base_unit_id'])
                    ->where('is_primary', true)
                    ->update(['is_primary' => false]);
            }

            $unit = Unit::create($data);

            DB::commit();

            $this->invalidateUnitCache($unit->base_unit_id);

            return $unit;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create unit', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            throw $e;
        }
    }

    public function updateUnit(string $id, array $data): bool
    {
        DB::beginTransaction();

        try {
            $unit = Unit::findOrFail($id);

            if (!empty($data['is_primary']) && !empty($unit->base_unit_id)) {
                Unit::where('base_unit_id', $unit->base_unit_id)
                    ->where('id', '!=', $id)
                    ->where('is_primary', true)
                    ->update(['is_primary' => false]);
            }

            $unit->update($data);

            DB::commit();

            $this->invalidateUnitCache($unit->base_unit_id);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update unit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
                'data' => $data,
            ]);
            throw $e;
        }
    }

    public function deleteUnit(string $id): bool
    {
        DB::beginTransaction();

        try {
            $unit = Unit::findOrFail($id);
            $baseUnitId = $unit->base_unit_id;

            $unit->delete();

            DB::commit();

            $this->invalidateUnitCache($baseUnitId);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete unit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
            ]);
            throw $e;
        }
    }

    public function restoreUnit(string $id): bool
    {
        DB::beginTransaction();

        try {
            $unit = Unit::withTrashed()->findOrFail($id);

            if (!$unit->trashed()) {
                throw new \Exception('Unit is not in deleted status');
            }

            $baseUnitId = $unit->base_unit_id;

            $unit->restore();

            DB::commit();

            $this->invalidateUnitCache($baseUnitId);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to restore unit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
            ]);
            throw $e;
        }
    }

    public function getBaseUnits(): Collection
    {
        return Cache::remember('units:base', 86400, function () {
            return Unit::base()->active()->orderBy('name')->get();
        });
    }

    public function getConversionsForBaseUnit(string $baseUnitId): Collection
    {
        return Cache::remember("units:conversions:{$baseUnitId}", 86400, function () use ($baseUnitId) {
            return Unit::where('base_unit_id', $baseUnitId)
                ->active()
                ->orderByDesc('is_primary')
                ->orderBy('created_at')
                ->get();
        });
    }

    public function getVariantsCount(string $unitId): int
    {
        return Unit::findOrFail($unitId)->variants()->count();
    }

    public function getConversionsCount(string $unitId): int
    {
        return Unit::findOrFail($unitId)->conversions()->count();
    }

    private function invalidateUnitCache(?string $baseUnitId = null): void
    {
        Cache::forget('units:all');
        Cache::forget('units:base');
        if ($baseUnitId) {
            Cache::forget("units:conversions:{$baseUnitId}");
        }
    }
}
