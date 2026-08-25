<?php

namespace App\Services\Contracts;

use App\Models\Unit;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface UnitServiceInterface
{
    public function getAllUnits(int $perPage, array $filters = []): LengthAwarePaginator;
    public function findUnitById(string $id): ?Unit;
    public function createUnit(Request $request): Unit;
    public function updateUnit(string $id, Request $request): bool;
    public function deleteUnit(string $id): bool;
    public function restoreUnit(string $id): bool;
    public function getBaseUnits(): Collection;
    public function getConversionsForBaseUnit(string $baseUnitId): Collection;
}
