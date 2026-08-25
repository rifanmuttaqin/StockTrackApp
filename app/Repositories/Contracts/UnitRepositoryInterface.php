<?php

namespace App\Repositories\Contracts;

use App\Models\Unit;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface UnitRepositoryInterface
{
    public function getAllUnits(int $perPage, array $filters = []): LengthAwarePaginator;
    public function findUnitById(string $id): ?Unit;
    public function createUnit(array $data): Unit;
    public function updateUnit(string $id, array $data): bool;
    public function deleteUnit(string $id): bool;
    public function restoreUnit(string $id): bool;
    public function getBaseUnits(): Collection;
    public function getConversionsForBaseUnit(string $baseUnitId): Collection;
    public function getVariantsCount(string $unitId): int;
    public function getConversionsCount(string $unitId): int;
}
