<?php

namespace App\Services\Unit;

use App\Models\Unit;
use App\Repositories\Contracts\UnitRepositoryInterface;
use App\Services\Contracts\UnitServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UnitService implements UnitServiceInterface
{
    protected UnitRepositoryInterface $unitRepository;

    public function __construct(UnitRepositoryInterface $unitRepository)
    {
        $this->unitRepository = $unitRepository;
    }

    public function getAllUnits(int $perPage, array $filters = []): LengthAwarePaginator
    {
        Log::info('UnitService::getAllUnits - Fetching all units', [
            'per_page' => $perPage,
            'filters' => $filters,
        ]);

        return $this->unitRepository->getAllUnits($perPage, $filters);
    }

    public function findUnitById(string $id): ?Unit
    {
        Log::info('UnitService::findUnitById - Finding unit', [
            'unit_id' => $id,
        ]);

        return $this->unitRepository->findUnitById($id);
    }

    public function createUnit(Request $request): Unit
    {
        Log::info('UnitService::createUnit - Starting unit creation', [
            'request_type' => get_class($request),
        ]);

        try {
            $validatedData = $request->validated();

            Log::info('UnitService::createUnit - Validated data', [
                'data' => $validatedData,
            ]);

            $unit = $this->unitRepository->createUnit($validatedData);

            Log::info('Unit Management Action', [
                'action' => 'create',
                'unit_id' => $unit->id,
                'unit_name' => $unit->name,
                'performed_by' => Auth::id(),
                'performed_by_name' => Auth::user()?->name,
                'timestamp' => now()->toISOString(),
            ]);

            return $unit;
        } catch (\Exception $e) {
            Log::error('UnitService::createUnit - Failed to create unit', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function updateUnit(string $id, Request $request): bool
    {
        Log::info('UnitService::updateUnit - Starting unit update', [
            'unit_id' => $id,
            'request_type' => get_class($request),
        ]);

        try {
            $unit = $this->unitRepository->findUnitById($id);
            if (!$unit) {
                Log::warning('UnitService::updateUnit - Unit not found', [
                    'unit_id' => $id,
                ]);
                throw new \Exception('Unit not found');
            }

            $validatedData = $request->validated();

            if (isset($validatedData['updated_at'])) {
                $submittedUpdatedAt = $validatedData['updated_at'];
                $currentUpdatedAt = $unit->updated_at instanceof \Carbon\Carbon
                    ? $unit->updated_at->toISOString()
                    : (string) $unit->updated_at;

                $submitted = \Carbon\Carbon::parse($submittedUpdatedAt)->toISOString();

                if ($submitted !== $currentUpdatedAt) {
                    Log::warning('UnitService::updateUnit - Optimistic locking conflict', [
                        'unit_id' => $id,
                        'submitted_updated_at' => $submitted,
                        'current_updated_at' => $currentUpdatedAt,
                    ]);
                    return false;
                }

                unset($validatedData['updated_at']);
            }

            $oldMultiplier = $unit->multiplier;
            $newMultiplier = $validatedData['multiplier'] ?? null;

            Log::info('UnitService::updateUnit - Validated data', [
                'unit_id' => $id,
                'data' => $validatedData,
            ]);

            $result = $this->unitRepository->updateUnit($id, $validatedData);

            if ($result) {
                Log::info('UnitService::updateUnit - Unit updated successfully', [
                    'unit_id' => $id,
                ]);

                if ($newMultiplier !== null && (string) $oldMultiplier !== (string) $newMultiplier) {
                    Log::info('Unit Management Action', [
                        'action' => 'update_multiplier',
                        'unit_id' => $unit->id,
                        'unit_name' => $unit->name,
                        'old_multiplier' => $oldMultiplier,
                        'new_multiplier' => $newMultiplier,
                        'performed_by' => Auth::id(),
                        'performed_by_name' => Auth::user()?->name,
                        'timestamp' => now()->toISOString(),
                    ]);
                }
            } else {
                Log::warning('UnitService::updateUnit - Unit update failed', [
                    'unit_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('UnitService::updateUnit - Failed to update unit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function deleteUnit(string $id): bool
    {
        Log::info('UnitService::deleteUnit - Starting unit deletion', [
            'unit_id' => $id,
        ]);

        try {
            $unit = $this->unitRepository->findUnitById($id);
            if (!$unit) {
                Log::warning('UnitService::deleteUnit - Unit not found', [
                    'unit_id' => $id,
                ]);
                throw new \Exception('Unit not found');
            }

            $result = $this->unitRepository->deleteUnit($id);

            if ($result) {
                Log::info('Unit Management Action', [
                    'action' => 'delete',
                    'unit_id' => $unit->id,
                    'unit_name' => $unit->name,
                    'performed_by' => Auth::id(),
                    'performed_by_name' => Auth::user()?->name,
                    'timestamp' => now()->toISOString(),
                ]);
            } else {
                Log::warning('UnitService::deleteUnit - Unit deletion failed', [
                    'unit_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('UnitService::deleteUnit - Failed to delete unit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function restoreUnit(string $id): bool
    {
        Log::info('UnitService::restoreUnit - Starting unit restoration', [
            'unit_id' => $id,
        ]);

        try {
            $result = $this->unitRepository->restoreUnit($id);

            if ($result) {
                $unit = $this->unitRepository->findUnitById($id);

                Log::info('Unit Management Action', [
                    'action' => 'restore',
                    'unit_id' => $id,
                    'unit_name' => $unit?->name,
                    'performed_by' => Auth::id(),
                    'performed_by_name' => Auth::user()?->name,
                    'timestamp' => now()->toISOString(),
                ]);
            } else {
                Log::warning('UnitService::restoreUnit - Unit restoration failed', [
                    'unit_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('UnitService::restoreUnit - Failed to restore unit', [
                'error' => $e->getMessage(),
                'unit_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function getBaseUnits(): Collection
    {
        Log::info('UnitService::getBaseUnits - Fetching base units');

        return $this->unitRepository->getBaseUnits();
    }

    public function getConversionsForBaseUnit(string $baseUnitId): Collection
    {
        Log::info('UnitService::getConversionsForBaseUnit - Fetching conversions', [
            'base_unit_id' => $baseUnitId,
        ]);

        return $this->unitRepository->getConversionsForBaseUnit($baseUnitId);
    }
}
