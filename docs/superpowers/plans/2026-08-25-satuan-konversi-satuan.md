# Satuan & Konversi Satuan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit of measure management and unit conversion to the product master, enabling stock display in multiple units across products, reports, and dashboard.

**Architecture:** New `Unit` model with self-referencing FK (base/conversion types), cached repository layer, optimistic locking for multiplier edits. Unit data embedded additively into existing product/report responses. Frontend gets new CRUD pages for units + updates to product and report pages.

**Tech Stack:** Laravel 12, PostgreSQL, React 18, Inertia.js v2, Tailwind CSS, Spatie Permission

---

## File Structure

### New Files (Backend)
- `database/migrations/2026_08_25_000001_create_units_table.php` — Units table with soft delete, unique indexes, is_primary
- `database/migrations/2026_08_25_000002_add_unit_id_to_product_variants_table.php` — Add unit_id FK to product_variants
- `database/migrations/2026_08_25_000003_backfill_default_unit_to_product_variants.php` — Backfill "Pcs" to all existing variants
- `database/seeders/UnitSeeder.php` — Idempotent seeder for default units
- `app/Models/Unit.php` — Unit model with self-referencing, SoftDeletes, scopes, accessors
- `app/Repositories/Contracts/UnitRepositoryInterface.php` — Repository interface
- `app/Repositories/Unit/UnitRepository.php` — Repository with caching
- `app/Services/Contracts/UnitServiceInterface.php` — Service interface
- `app/Services/Unit/UnitService.php` — Service with audit log, optimistic locking, is_primary swap
- `app/Http/Controllers/Unit/UnitController.php` — CRUD controller
- `app/Http/Requests/Unit/UnitCreateRequest.php` — Conditional validation (base vs conversion)
- `app/Http/Requests/Unit/UnitUpdateRequest.php` — Update validation with optimistic locking
- `app/Http/Requests/Product/BulkAssignUnitsRequest.php` — Bulk-assign validation (max 500)
- `routes/units.php` — Unit routes

### New Files (Frontend)
- `resources/js/Pages/Units/Index.jsx` — Unit list with tabs (Base/Conversion), soft delete toggle
- `resources/js/Pages/Units/Create.jsx` — Create form with type toggle, conditional fields
- `resources/js/Pages/Units/Edit.jsx` — Edit form with optimistic locking
- `resources/js/Pages/Units/Show.jsx` — Unit detail view

### Modified Files (Backend)
- `app/Models/ProductVariant.php` — Add unit_id to fillable, baseUnit relation
- `app/Repositories/Product/ProductRepository.php` — Eager load unit+conversions, transform data
- `app/Repositories/Contracts/ProductRepositoryInterface.php` — Add bulkAssignUnits method
- `app/Services/Product/ProductService.php` — Add bulkAssignUnits method
- `app/Services/Contracts/ProductServiceInterface.php` — Add bulkAssignUnits method
- `app/Http/Requests/Product/ProductCreateRequest.php` — Add variants.*.unit_id validation
- `app/Http/Requests/Product/ProductUpdateRequest.php` — Add variants.*.unit_id validation
- `app/Http/Controllers/Product/ProductController.php` — Add bulkAssignUnits action, pass baseUnits to create/edit
- `app/Http/Controllers/StockIn/StockInReportController.php` — Load unit+conversions for variants
- `app/Http/Controllers/StockOut/StockOutReportController.php` — Load unit+conversions for variants + export
- `app/Http/Controllers/StockOpname/StockOpnameReportController.php` — Load unit+conversions for variants + export
- `app/Http/Controllers/Dashboard/DashboardController.php` — Include unit info in low stock products
- `app/Providers/RepositoryServiceProvider.php` — Bind Unit interfaces
- `routes/web.php` — Include units.php route file
- `database/seeders/RoleSeeder.php` — Add units.* permissions to roles

### Modified Files (Frontend)
- `resources/js/Pages/Products/Index.jsx` — Bulk-assign button, unit-aware stock display
- `resources/js/Pages/Products/Create.jsx` — Unit dropdown per variant
- `resources/js/Pages/Products/Edit.jsx` — Unit dropdown per variant
- `resources/js/Pages/Products/Show.jsx` — Unit info + conversions on variant detail
- `resources/js/Pages/Reports/StockIn/Index.jsx` — Unit filter dropdown, conversion display
- `resources/js/Pages/Reports/StockOut/Index.jsx` — Unit filter dropdown, conversion display
- `resources/js/Pages/Reports/StockOpname/Index.jsx` — Unit filter dropdown, conversion display
- `resources/js/Pages/Dashboard/Index.jsx` — Dynamic unit in tooltips
- `resources/js/Components/Layouts/Sidebar.jsx` — Add "Satuan" menu under Produk
- `resources/js/Utils/constants.js` — Add UNITS permission constants

---

## Task 1: Database Migrations

**Files:**
- Create: `database/migrations/2026_08_25_000001_create_units_table.php`
- Create: `database/migrations/2026_08_25_000002_add_unit_id_to_product_variants_table.php`
- Create: `database/migrations/2026_08_25_000003_backfill_default_unit_to_product_variants.php`

- [ ] **Step 1: Create units table migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 50);
            $table->string('abbreviation', 10);
            $table->string('type', 20)->default('base');
            $table->foreignUuid('base_unit_id')->nullable()
                ->references('id')->on('units')->onDelete('restrict');
            $table->decimal('multiplier', 10, 2)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('units', function (Blueprint $table) {
            $table->index('base_unit_id');
            $table->index('deleted_at');
        });

        DB::statement('CREATE UNIQUE INDEX uq_units_name_lower ON units (LOWER(name)) WHERE deleted_at IS NULL');
        DB::statement('CREATE UNIQUE INDEX uq_units_abbreviation_lower ON units (LOWER(abbreviation)) WHERE deleted_at IS NULL');
        DB::statement('CREATE UNIQUE INDEX uq_units_primary_per_base ON units (base_unit_id) WHERE is_primary = TRUE AND type = \'conversion\' AND deleted_at IS NULL');
        DB::statement('CREATE INDEX idx_units_type ON units(type) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
```

- [ ] **Step 2: Create add unit_id to product_variants migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->foreignUuid('unit_id')->nullable()
                ->references('id')->on('units')->onDelete('set null');
            $table->index('unit_id');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropForeign(['unit_id']);
            $table->dropIndex(['unit_id']);
            $table->dropColumn('unit_id');
        });
    }
};
```

- [ ] **Step 3: Create backfill migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $pcsUnit = DB::table('units')
            ->where('type', 'base')
            ->whereRaw('LOWER(name) = ?', ['pcs'])
            ->first();

        if (!$pcsUnit) {
            $pcsId = (string) Str::uuid();
            DB::table('units')->insert([
                'id' => $pcsId,
                'name' => 'Pcs',
                'abbreviation' => 'pcs',
                'type' => 'base',
                'description' => 'Satuan dasar default (pieces)',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $pcsId = $pcsUnit->id;
        }

        $affected = DB::table('product_variants')
            ->whereNull('unit_id')
            ->whereNull('deleted_at')
            ->update(['unit_id' => $pcsId]);

        Log::info('Unit backfill completed', [
            'default_unit' => 'Pcs',
            'default_unit_id' => $pcsId,
            'variants_updated' => $affected,
        ]);
    }

    public function down(): void
    {
        $pcsUnit = DB::table('units')
            ->whereRaw('LOWER(name) = ?', ['pcs'])
            ->where('type', 'base')
            ->first();

        if ($pcsUnit) {
            DB::table('product_variants')
                ->where('unit_id', $pcsUnit->id)
                ->update(['unit_id' => null]);
        }
    }
};
```

- [ ] **Step 4: Run migrations**

Run: `php artisan migrate`
Expected: All 3 migrations run successfully

- [ ] **Step 5: Verify migration rollback**

Run: `php artisan migrate:rollback --step=3`
Expected: Rollback succeeds
Run: `php artisan migrate`
Expected: Re-migrate succeeds

- [ ] **Step 6: Commit**

```bash
git add database/migrations/2026_08_25_000001_create_units_table.php database/migrations/2026_08_25_000002_add_unit_id_to_product_variants_table.php database/migrations/2026_08_25_000003_backfill_default_unit_to_product_variants.php
git commit -m "feat: add units table, unit_id on product_variants, and backfill migration"
```

---

## Task 2: Unit Model + Update ProductVariant Model

**Files:**
- Create: `app/Models/Unit.php`
- Modify: `app/Models/ProductVariant.php`

- [ ] **Step 1: Create Unit model**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Unit extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });
    }

    protected $fillable = [
        'name',
        'abbreviation',
        'type',
        'base_unit_id',
        'multiplier',
        'is_primary',
        'description',
    ];

    protected $appends = [
        'full_name',
        'variants_count',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'base_unit_id' => 'string',
            'multiplier' => 'decimal:2',
            'is_primary' => 'boolean',
        ];
    }

    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    public function conversions(): HasMany
    {
        return $this->hasMany(Unit::class, 'base_unit_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'unit_id');
    }

    public function scopeBase($query)
    {
        return $query->where('type', 'base');
    }

    public function scopeConversion($query)
    {
        return $query->where('type', 'conversion');
    }

    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    public function getFullNameAttribute(): ?string
    {
        if ($this->type !== 'conversion' || !$this->baseUnit) {
            return null;
        }

        $multiplier = number_format($this->multiplier, 2, '.', '');
        if (floor($this->multiplier) == $this->multiplier) {
            $multiplier = (int) $this->multiplier;
        }

        return "1 {$this->name} = {$multiplier} {$this->baseUnit->name}";
    }

    public function getVariantsCountAttribute(): int
    {
        return $this->variants()->count();
    }
}
```

- [ ] **Step 2: Update ProductVariant model — add unit_id to fillable and baseUnit relation**

In `app/Models/ProductVariant.php`:

Add to `$fillable`:
```php
'unit_id',
```

Add to `casts()`:
```php
'unit_id' => 'string',
```

Add relation method:
```php
public function baseUnit(): BelongsTo
{
    return $this->belongsTo(Unit::class, 'unit_id');
}
```

- [ ] **Step 3: Commit**

```bash
git add app/Models/Unit.php app/Models/ProductVariant.php
git commit -m "feat: add Unit model and update ProductVariant with unit_id relation"
```

---

## Task 3: Unit Seeder + Permission Seeder Update

**Files:**
- Create: `database/seeders/UnitSeeder.php`
- Modify: `database/seeders/RoleSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

- [ ] **Step 1: Create UnitSeeder**

```php
<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $pcs = Unit::updateOrCreate(
            ['name' => 'Pcs'],
            [
                'abbreviation' => 'pcs',
                'type' => 'base',
                'description' => 'Pieces - satuan dasar',
            ]
        );

        $kg = Unit::updateOrCreate(
            ['name' => 'Kg'],
            [
                'abbreviation' => 'kg',
                'type' => 'base',
                'description' => 'Kilogram - satuan dasar',
            ]
        );

        $liter = Unit::updateOrCreate(
            ['name' => 'Liter'],
            [
                'abbreviation' => 'ltr',
                'type' => 'base',
                'description' => 'Liter - satuan dasar',
            ]
        );

        $meter = Unit::updateOrCreate(
            ['name' => 'Meter'],
            [
                'abbreviation' => 'm',
                'type' => 'base',
                'description' => 'Meter - satuan dasar',
            ]
        );

        Unit::updateOrCreate(
            ['name' => 'Karton'],
            [
                'abbreviation' => 'ktg',
                'type' => 'conversion',
                'base_unit_id' => $pcs->id,
                'multiplier' => 10,
                'is_primary' => true,
                'description' => '1 Karton = 10 Pcs',
            ]
        );

        Unit::updateOrCreate(
            ['name' => 'Box'],
            [
                'abbreviation' => 'box',
                'type' => 'conversion',
                'base_unit_id' => $pcs->id,
                'multiplier' => 24,
                'is_primary' => false,
                'description' => '1 Box = 24 Pcs',
            ]
        );

        Unit::updateOrCreate(
            ['name' => 'Lusin'],
            [
                'abbreviation' => 'lsn',
                'type' => 'conversion',
                'base_unit_id' => $pcs->id,
                'multiplier' => 12,
                'is_primary' => false,
                'description' => '1 Lusin = 12 Pcs',
            ]
        );

        Unit::updateOrCreate(
            ['name' => 'Dus'],
            [
                'abbreviation' => 'dus',
                'type' => 'conversion',
                'base_unit_id' => $pcs->id,
                'multiplier' => 100,
                'is_primary' => false,
                'description' => '1 Dus = 100 Pcs',
            ]
        );
    }
}
```

- [ ] **Step 2: Update RoleSeeder — add units.* permissions to admin and warehouse_supervisor roles**

In `database/seeders/RoleSeeder.php`, add to the `admin` role permissions array:
```php
['name' => 'units.view', 'display_name' => 'View Units', 'description' => 'Melihat daftar satuan'],
['name' => 'units.create', 'display_name' => 'Create Units', 'description' => 'Membuat satuan baru'],
['name' => 'units.update', 'display_name' => 'Update Units', 'description' => 'Mengedit data satuan'],
['name' => 'units.delete', 'display_name' => 'Delete Units', 'description' => 'Menghapus satuan'],
```

Add to `warehouse_supervisor` role:
```php
['name' => 'units.view', 'display_name' => 'View Units', 'description' => 'Melihat daftar satuan'],
['name' => 'units.create', 'display_name' => 'Create Units', 'description' => 'Membuat satuan baru'],
['name' => 'units.update', 'display_name' => 'Update Units', 'description' => 'Mengedit data satuan'],
['name' => 'units.delete', 'display_name' => 'Delete Units', 'description' => 'Menghapus satuan'],
```

Add to `inventory_staff` role:
```php
['name' => 'units.view', 'display_name' => 'View Units', 'description' => 'Melihat daftar satuan'],
```

- [ ] **Step 3: Update DatabaseSeeder to call UnitSeeder**

Add after existing seeders:
```php
$this->call(UnitSeeder::class);
```

- [ ] **Step 4: Run seeder**

Run: `php artisan db:seed --class=UnitSeeder`
Expected: Units created successfully

- [ ] **Step 5: Verify idempotency**

Run: `php artisan db:seed --class=UnitSeeder`
Expected: No duplicate records

- [ ] **Step 6: Commit**

```bash
git add database/seeders/UnitSeeder.php database/seeders/RoleSeeder.php database/seeders/DatabaseSeeder.php
git commit -m "feat: add UnitSeeder and units.* permissions to roles"
```

---

## Task 4: Unit Repository (Interface + Implementation with Caching)

**Files:**
- Create: `app/Repositories/Contracts/UnitRepositoryInterface.php`
- Create: `app/Repositories/Unit/UnitRepository.php`

- [ ] **Step 1: Create UnitRepositoryInterface**

```php
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
```

- [ ] **Step 2: Create UnitRepository implementation**

```php
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
        $query = Unit::with(['baseUnit'])
            ->withCount(['variants as variants_count', 'conversions as conversions_count']);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                    ->orWhere('abbreviation', 'ILIKE', "%{$search}%");
            });
        }

        if (!empty($filters['with_trashed'])) {
            $query->withTrashed();
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
            if (($data['type'] ?? '') === 'conversion' && ($data['is_primary'] ?? false)) {
                $this->unsetPrimaryForBaseUnit($data['base_unit_id']);
            }

            $unit = Unit::create($data);

            DB::commit();

            $this->invalidateUnitCache($data['base_unit_id'] ?? null);

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

            if (($data['is_primary'] ?? false) && !$unit->is_primary) {
                $baseUnitId = $data['base_unit_id'] ?? $unit->base_unit_id;
                $this->unsetPrimaryForBaseUnit($baseUnitId);
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
            $unit->delete();

            DB::commit();

            $this->invalidateUnitCache($unit->base_unit_id);

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
            $unit->restore();

            DB::commit();

            $this->invalidateUnitCache($unit->base_unit_id);

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
            return Unit::where('type', 'base')
                ->whereNull('deleted_at')
                ->orderBy('name')
                ->get();
        });
    }

    public function getConversionsForBaseUnit(string $baseUnitId): Collection
    {
        return Cache::remember("units:conversions:{$baseUnitId}", 86400, function () use ($baseUnitId) {
            return Unit::where('type', 'conversion')
                ->where('base_unit_id', $baseUnitId)
                ->whereNull('deleted_at')
                ->orderBy('is_primary', 'desc')
                ->orderBy('created_at')
                ->get();
        });
    }

    public function getVariantsCount(string $unitId): int
    {
        return Unit::findOrFail($unitId)->variants_count;
    }

    public function getConversionsCount(string $unitId): int
    {
        return Unit::findOrFail($unitId)->conversions_count;
    }

    private function unsetPrimaryForBaseUnit(string $baseUnitId): void
    {
        Unit::where('base_unit_id', $baseUnitId)
            ->where('is_primary', true)
            ->update(['is_primary' => false]);
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
```

- [ ] **Step 3: Commit**

```bash
git add app/Repositories/Contracts/UnitRepositoryInterface.php app/Repositories/Unit/UnitRepository.php
git commit -m "feat: add Unit repository with caching and is_primary swap logic"
```

---

## Task 5: Unit Service (Interface + Implementation with Audit Log + Optimistic Locking)

**Files:**
- Create: `app/Services/Contracts/UnitServiceInterface.php`
- Create: `app/Services/Unit/UnitService.php`

- [ ] **Step 1: Create UnitServiceInterface**

```php
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
```

- [ ] **Step 2: Create UnitService implementation**

```php
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
        Log::info('UnitService::createUnit - Starting unit creation');

        try {
            $validatedData = $request->validated();

            $unit = $this->unitRepository->createUnit($validatedData);

            $this->logUnitAction('create_unit', $unit->id, [
                'name' => $unit->name,
                'type' => $unit->type,
            ]);

            Log::info('UnitService::createUnit - Unit created successfully', [
                'unit_id' => $unit->id,
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
        ]);

        try {
            $unit = $this->unitRepository->findUnitById($id);
            if (!$unit) {
                throw new \Exception('Unit not found');
            }

            $validatedData = $request->validated();

            // Optimistic locking check
            if (isset($validatedData['updated_at'])) {
                $submittedUpdatedAt = strtotime($validatedData['updated_at']);
                $currentUpdatedAt = strtotime($unit->updated_at->toDateTimeString());

                if ($submittedUpdatedAt !== $currentUpdatedAt) {
                    Log::warning('UnitService::updateUnit - Optimistic locking conflict', [
                        'unit_id' => $id,
                        'submitted_updated_at' => $validatedData['updated_at'],
                        'current_updated_at' => $unit->updated_at->toDateTimeString(),
                    ]);
                    return false; // Caller should return 409
                }
            }

            unset($validatedData['updated_at']);

            // Audit log for multiplier changes
            if (isset($validatedData['multiplier']) && $unit->type === 'conversion') {
                $oldMultiplier = $unit->multiplier;
                $newMultiplier = $validatedData['multiplier'];

                if ($oldMultiplier != $newMultiplier) {
                    $this->logUnitAction('update_multiplier', $unit->id, [
                        'unit_name' => $unit->name,
                        'old_multiplier' => $oldMultiplier,
                        'new_multiplier' => $newMultiplier,
                    ]);
                }
            }

            $result = $this->unitRepository->updateUnit($id, $validatedData);

            if ($result) {
                $this->logUnitAction('update_unit', $unit->id, [
                    'unit_name' => $unit->name,
                    'updated_fields' => array_keys($validatedData),
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
                throw new \Exception('Unit not found');
            }

            $result = $this->unitRepository->deleteUnit($id);

            if ($result) {
                $this->logUnitAction('delete_unit', $unit->id, [
                    'unit_name' => $unit->name,
                    'unit_type' => $unit->type,
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
                $this->logUnitAction('restore_unit', $id);
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
        return $this->unitRepository->getBaseUnits();
    }

    public function getConversionsForBaseUnit(string $baseUnitId): Collection
    {
        return $this->unitRepository->getConversionsForBaseUnit($baseUnitId);
    }

    private function logUnitAction(string $action, string $unitId, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('Unit Management Action', [
            'action' => $action,
            'unit_id' => $unitId,
            'performed_by' => $currentUser?->id,
            'performed_by_name' => $currentUser?->name,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/Services/Contracts/UnitServiceInterface.php app/Services/Unit/UnitService.php
git commit -m "feat: add Unit service with audit log and optimistic locking"
```

---

## Task 6: Unit Controller + Form Requests + Routes

**Files:**
- Create: `app/Http/Controllers/Unit/UnitController.php`
- Create: `app/Http/Requests/Unit/UnitCreateRequest.php`
- Create: `app/Http/Requests/Unit/UnitUpdateRequest.php`
- Create: `app/Http/Requests/Product/BulkAssignUnitsRequest.php`
- Create: `routes/units.php`
- Modify: `routes/web.php`
- Modify: `app/Providers/RepositoryServiceProvider.php`

- [ ] **Step 1: Create UnitCreateRequest**

```php
<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UnitCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'units.create');
    }

    public function rules(): array
    {
        $rules = [
            'name' => 'required|string|max:50|unique:units,name,NULL,id,deleted_at,NULL',
            'abbreviation' => 'required|string|max:10|unique:units,abbreviation,NULL,id,deleted_at,NULL',
            'type' => 'required|in:base,conversion',
            'description' => 'nullable|string',
        ];

        if ($this->input('type') === 'conversion') {
            $rules['base_unit_id'] = 'required|exists:units,id,type,base';
            $rules['multiplier'] = 'required|numeric|min:0.01';
            $rules['is_primary'] = 'boolean';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama satuan harus diisi',
            'name.max' => 'Nama satuan maksimal 50 karakter',
            'name.unique' => 'Nama satuan sudah digunakan',
            'abbreviation.required' => 'Singkatan harus diisi',
            'abbreviation.max' => 'Singkatan maksimal 10 karakter',
            'abbreviation.unique' => 'Singkatan sudah digunakan',
            'type.required' => 'Tipe satuan harus dipilih',
            'type.in' => 'Tipe satuan harus base atau conversion',
            'base_unit_id.required' => 'Satuan dasar tujuan harus dipilih',
            'base_unit_id.exists' => 'Satuan dasar tujuan tidak valid',
            'multiplier.required' => 'Nilai konversi harus diisi',
            'multiplier.min' => 'Nilai konversi minimal 0.01',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('type') === 'conversion') {
                $baseUnitId = $this->input('base_unit_id');
                if ($baseUnitId && $this->route('unit') && $this->route('unit')->id === $baseUnitId) {
                    $validator->errors()->add('base_unit_id', 'Satuan dasar tujuan tidak boleh merujuk ke diri sendiri');
                }
            }
        });
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422)
        );
    }

    private function userHasRole($user, string $role): bool
    {
        return $user->roles()->where('name', $role)->exists();
    }

    private function userHasPermission($user, string $permission): bool
    {
        return $user->permissions()->where('name', $permission)->exists() ||
               $user->roles()->whereHas('permissions', function ($query) use ($permission) {
                   $query->where('name', $permission);
               })->exists();
    }
}
```

- [ ] **Step 2: Create UnitUpdateRequest**

```php
<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UnitUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'units.update');
    }

    public function rules(): array
    {
        $unitId = $this->route('unit')?->id;

        $rules = [
            'name' => 'required|string|max:50|unique:units,name,' . $unitId . ',id,deleted_at,NULL',
            'abbreviation' => 'required|string|max:10|unique:units,abbreviation,' . $unitId . ',id,deleted_at,NULL',
            'description' => 'nullable|string',
            'updated_at' => 'required|string',
        ];

        $unit = $this->route('unit');
        if ($unit && $unit->type === 'conversion') {
            $rules['multiplier'] = 'required|numeric|min:0.01';
            $rules['is_primary'] = 'boolean';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama satuan harus diisi',
            'name.max' => 'Nama satuan maksimal 50 karakter',
            'name.unique' => 'Nama satuan sudah digunakan',
            'abbreviation.required' => 'Singkatan harus diisi',
            'abbreviation.max' => 'Singkatan maksimal 10 karakter',
            'abbreviation.unique' => 'Singkatan sudah digunakan',
            'multiplier.required' => 'Nilai konversi harus diisi',
            'multiplier.min' => 'Nilai konversi minimal 0.01',
            'updated_at.required' => 'Data timestamp diperlukan untuk optimistic locking',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422)
        );
    }

    private function userHasRole($user, string $role): bool
    {
        return $user->roles()->where('name', $role)->exists();
    }

    private function userHasPermission($user, string $permission): bool
    {
        return $user->permissions()->where('name', $permission)->exists() ||
               $user->roles()->whereHas('permissions', function ($query) use ($permission) {
                   $query->where('name', $permission);
               })->exists();
    }
}
```

- [ ] **Step 3: Create BulkAssignUnitsRequest**

```php
<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BulkAssignUnitsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();
        return $this->userHasRole($user, 'admin') || $this->userHasPermission($user, 'products.update');
    }

    public function rules(): array
    {
        return [
            'assignments' => 'required|array|min:1|max:500',
            'assignments.*.variant_id' => 'required|exists:product_variants,id',
            'assignments.*.unit_id' => 'required|exists:units,id,type,base',
        ];
    }

    public function messages(): array
    {
        return [
            'assignments.required' => 'Data assignment harus diisi',
            'assignments.max' => 'Maksimal 500 varian per request',
            'assignments.*.variant_id.required' => 'ID varian harus diisi',
            'assignments.*.variant_id.exists' => 'Varian tidak ditemukan',
            'assignments.*.unit_id.required' => 'Satuan dasar harus dipilih',
            'assignments.*.unit_id.exists' => 'Satuan dasar tidak valid',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422)
        );
    }

    private function userHasRole($user, string $role): bool
    {
        return $user->roles()->where('name', $role)->exists();
    }

    private function userHasPermission($user, string $permission): bool
    {
        return $user->permissions()->where('name', $permission)->exists() ||
               $user->roles()->whereHas('permissions', function ($query) use ($permission) {
                   $query->where('name', $permission);
               })->exists();
    }
}
```

- [ ] **Step 4: Create UnitController**

```php
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
        Log::info('Unit Controller Action', [
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
            $filters = $request->only(['search', 'type', 'with_trashed', 'per_page']);

            $units = $this->unitService->getAllUnits($perPage, $filters);

            $meta = [
                'total' => $units->total(),
                'per_page' => $units->perPage(),
                'current_page' => $units->currentPage(),
                'last_page' => $units->lastPage(),
                'from' => $units->firstItem(),
                'to' => $units->lastItem(),
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
                'filters' => $request->only(['search', 'type', 'with_trashed']),
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
            ]);
            abort(404, 'Satuan tidak ditemukan.');
        }
    }

    public function update(UnitUpdateRequest $request, string $id)
    {
        try {
            $result = $this->unitService->updateUnit($id, $request);

            if ($result === false) {
                return response()->json([
                    'message' => 'Data telah diubah oleh pengguna lain, silakan refresh dan coba lagi',
                ], 409);
            }

            return redirect()->route('units.index')
                ->with('success', 'Satuan berhasil diperbarui.');
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
                return redirect()->back()->with('error', 'Satuan tidak ditemukan.');
            }

            // Check if unit is used by variants
            if ($unit->type === 'base') {
                $variantsCount = $unit->variants_count;
                if ($variantsCount > 0) {
                    return redirect()->back()
                        ->with('error', "Satuan tidak dapat dihapus karena masih digunakan oleh {$variantsCount} varian produk.");
                }

                // Check if unit is referenced by conversions
                $conversionsCount = $unit->conversions_count;
                if ($conversionsCount > 0) {
                    return redirect()->back()
                        ->with('error', "Satuan dasar tidak dapat dihapus karena masih dirujuk oleh {$conversionsCount} satuan konversi.");
                }
            }

            $success = $this->unitService->deleteUnit($id);

            if ($success) {
                return redirect()->route('units.index')
                    ->with('success', 'Satuan berhasil dihapus.');
            }

            return redirect()->back()->with('error', 'Gagal menghapus satuan.');
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
                return redirect()->route('units.index')
                    ->with('success', 'Satuan berhasil dipulihkan.');
            }

            return redirect()->back()->with('error', 'Gagal memulihkan satuan.');
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

    // API endpoints for dropdowns
    public function getBaseUnits()
    {
        try {
            $baseUnits = $this->unitService->getBaseUnits();
            return response()->json(['data' => $baseUnits]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch base units', ['error' => $e->getMessage()]);
            return response()->json(['data' => []]);
        }
    }

    public function getConversions(string $baseUnitId)
    {
        try {
            $conversions = $this->unitService->getConversionsForBaseUnit($baseUnitId);
            return response()->json(['data' => $conversions]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch conversions', ['error' => $e->getMessage()]);
            return response()->json(['data' => []]);
        }
    }

    // Bulk assign units to variants
    public function bulkAssignUnits(BulkAssignUnitsRequest $request)
    {
        try {
            $assignments = $request->validated()['assignments'];
            $skipped = [];
            $updated = 0;

            DB::beginTransaction();

            foreach ($assignments as $assignment) {
                $variant = ProductVariant::find($assignment['variant_id']);

                if ($variant && $variant->unit_id === null) {
                    $variant->update(['unit_id' => $assignment['unit_id']]);
                    $updated++;
                } elseif ($variant) {
                    $skipped[] = $assignment['variant_id'];
                }
            }

            DB::commit();

            Log::info('Bulk assign units completed', [
                'updated' => $updated,
                'skipped' => count($skipped),
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => "{$updated} varian berhasil diperbarui.",
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
                'message' => 'Gagal mengatur satuan. Silakan coba lagi.',
            ], 500);
        }
    }
}
```

- [ ] **Step 5: Create routes/units.php**

```php
<?php

use App\Http\Controllers\Unit\UnitController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Web routes (Inertia pages)
    Route::get('/units', [UnitController::class, 'index'])
        ->name('units.index')
        ->middleware('permission:units.view');

    Route::get('/units/create', [UnitController::class, 'create'])
        ->name('units.create')
        ->middleware('permission:units.create');

    Route::post('/units', [UnitController::class, 'store'])
        ->name('units.store')
        ->middleware('permission:units.create');

    Route::get('/units/{unit}', [UnitController::class, 'show'])
        ->name('units.show')
        ->middleware('permission:units.view');

    Route::get('/units/{unit}/edit', [UnitController::class, 'edit'])
        ->name('units.edit')
        ->middleware('permission:units.update');

    Route::put('/units/{unit}', [UnitController::class, 'update'])
        ->name('units.update')
        ->middleware('permission:units.update');

    Route::delete('/units/{unit}', [UnitController::class, 'destroy'])
        ->name('units.destroy')
        ->middleware('permission:units.delete');

    Route::post('/units/{unit}/restore', [UnitController::class, 'restore'])
        ->name('units.restore')
        ->middleware('permission:units.delete');

    // API routes (JSON responses for dropdowns)
    Route::get('/api/units/base', [UnitController::class, 'getBaseUnits'])
        ->name('api.units.base')
        ->middleware('permission:units.view');

    Route::get('/api/units/conversions/{baseUnit}', [UnitController::class, 'getConversions'])
        ->name('api.units.conversions')
        ->middleware('permission:units.view');

    // Bulk assign
    Route::post('/products/bulk-assign-units', [UnitController::class, 'bulkAssignUnits'])
        ->name('products.bulk-assign-units')
        ->middleware('permission:products.update');
});
```

- [ ] **Step 6: Update routes/web.php — include units.php**

Add after the existing `require` statements:
```php
require __DIR__.'/units.php';
```

- [ ] **Step 7: Update RepositoryServiceProvider — bind Unit interfaces**

Add to `register()`:
```php
use App\Repositories\Contracts\UnitRepositoryInterface;
use App\Repositories\Unit\UnitRepository;
use App\Services\Contracts\UnitServiceInterface;
use App\Services\Unit\UnitService;

// In register():
$this->app->bind(UnitRepositoryInterface::class, UnitRepository::class);
$this->app->bind(UnitServiceInterface::class, UnitService::class);
```

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/Unit/ app/Http/Requests/Unit/ app/Http/Requests/Product/BulkAssignUnitsRequest.php routes/units.php routes/web.php app/Providers/RepositoryServiceProvider.php
git commit -m "feat: add Unit controller, form requests, routes, and DI bindings"
```

---

## Task 7: Update ProductRepository — Eager Load Unit + Conversions

**Files:**
- Modify: `app/Repositories/Product/ProductRepository.php`
- Modify: `app/Repositories/Contracts/ProductRepositoryInterface.php`

- [ ] **Step 1: Update ProductRepositoryInterface — add bulkAssignUnits**

Add method:
```php
/**
 * Bulk assign units to variants
 */
public function bulkAssignUnits(array $assignments): array;
```

- [ ] **Step 2: Update ProductRepository — modify getAllProducts and findProductById to load unit data**

In `getAllProducts()`, change the eager loading from `with('variants')` to:
```php
with(['variants.baseUnit', 'variants.baseUnit.conversions'])
```

Update the variant transform closure to include unit data:
```php
$product->variants->transform(function ($variant) use (&$totalStock) {
    $totalStock += $variant->stock_current;

    $unitData = null;
    $conversionsData = [];

    if ($variant->baseUnit) {
        $unitData = [
            'id' => $variant->baseUnit->id,
            'name' => $variant->baseUnit->name,
            'abbreviation' => $variant->baseUnit->abbreviation,
            'type' => $variant->baseUnit->type,
        ];

        if ($variant->baseUnit->conversions) {
            foreach ($variant->baseUnit->conversions as $conversion) {
                $convertedStock = $conversion->multiplier > 0
                    ? round($variant->stock_current / $conversion->multiplier, 2)
                    : 0;

                $conversionsData[] = [
                    'id' => $conversion->id,
                    'name' => $conversion->name,
                    'abbreviation' => $conversion->abbreviation,
                    'multiplier' => (float) $conversion->multiplier,
                    'is_primary' => $conversion->is_primary,
                    'converted_stock' => $convertedStock,
                ];
            }
        }
    }

    return [
        'id' => $variant->id,
        'name' => $variant->variant_name,
        'sku' => $variant->sku,
        'stock_current' => $variant->stock_current,
        'stock_threshold' => $variant->stock_threshold ?? 0,
        'product_id' => $variant->product_id,
        'unit' => $unitData,
        'conversions' => $conversionsData,
    ];
});
```

Apply the same changes to `findProductById()`, `createProduct()`, `updateProduct()`, and `searchProducts()`.

- [ ] **Step 3: Update ProductCreateRequest and ProductUpdateRequest — add unit_id validation**

In both `ProductCreateRequest.php` and `ProductUpdateRequest.php`, add to `rules()`:
```php
'variants.*.unit_id' => 'nullable|exists:units,id,type,base',
```

Add to `messages()`:
```php
'variants.*.unit_id.exists' => 'Satuan dasar tidak valid',
```

- [ ] **Step 4: Update ProductRepository createProduct and updateProduct — save unit_id**

In `createProduct()`, add to the variant create data:
```php
'unit_id' => $variantData['unit_id'] ?? null,
```

In `updateProduct()`, add to both variant update and create data:
```php
'unit_id' => $variantData['unit_id'] ?? null,
```

- [ ] **Step 5: Commit**

```bash
git add app/Repositories/Product/ProductRepository.php app/Repositories/Contracts/ProductRepositoryInterface.php app/Http/Requests/Product/ProductCreateRequest.php app/Http/Requests/Product/ProductUpdateRequest.php
git commit -m "feat: update ProductRepository to eager load unit+conversions and save unit_id"
```

---

## Task 8: Update ProductController — Pass Base Units to Create/Edit + Bulk Assign

**Files:**
- Modify: `app/Http/Controllers/Product/ProductController.php`

- [ ] **Step 1: Update ProductController create() and edit() to pass baseUnits**

Inject `UnitServiceInterface` via constructor:
```php
use App\Services\Contracts\UnitServiceInterface;

protected UnitServiceInterface $unitService;

public function __construct(ProductServiceInterface $productService, UnitServiceInterface $unitService)
{
    $this->productService = $productService;
    $this->unitService = $unitService;
    // ... existing middleware
}
```

Update `create()`:
```php
public function create(): Response
{
    $baseUnits = $this->unitService->getBaseUnits();

    return Inertia::render('Products/Create', [
        'baseUnits' => $baseUnits,
    ]);
}
```

Update `edit()`:
```php
public function edit(string $id): Response
{
    try {
        $product = $this->productService->findProductById($id);

        if (!$product) {
            abort(404, 'Produk tidak ditemukan.');
        }

        $baseUnits = $this->unitService->getBaseUnits();

        $this->logProductAction('view_product_edit_form', $id);

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'baseUnits' => $baseUnits,
        ]);
    } catch (\Exception $e) {
        // ... existing error handling
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Http/Controllers/Product/ProductController.php
git commit -m "feat: pass baseUnits to product create/edit forms"
```

---

## Task 9: Update Report Controllers — Include Unit Data

**Files:**
- Modify: `app/Http/Controllers/StockIn/StockInReportController.php`
- Modify: `app/Http/Controllers/StockOut/StockOutReportController.php`
- Modify: `app/Http/Controllers/StockOpname/StockOpnameReportController.php`

- [ ] **Step 1: Update StockInReportController**

In `index()`, update the eager loading from:
```php
StockInRecord::with(['items.productVariant', 'items.productVariant.product'])
```
to:
```php
StockInRecord::with(['items.productVariant.baseUnit', 'items.productVariant.baseUnit.conversions', 'items.productVariant.product'])
```

Update the products query from:
```php
Product::with('variants')
```
to:
```php
Product::with(['variants.baseUnit', 'variants.baseUnit.conversions'])
```

Add unit data to the variant data in the report:
```php
$productData['variants'][] = [
    'id' => $variant->id,
    'name' => $variant->variant_name,
    'sku' => $variant->sku,
    'stock' => $variant->stock_current,
    'stock_in_by_date' => $stockInByDate,
    'average' => $average,
    'total' => $total,
    'unit' => $variant->baseUnit ? [
        'id' => $variant->baseUnit->id,
        'name' => $variant->baseUnit->name,
        'abbreviation' => $variant->baseUnit->abbreviation,
    ] : null,
    'conversions' => $variant->baseUnit && $variant->baseUnit->conversions
        ? $variant->baseUnit->conversions->map(fn($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'abbreviation' => $c->abbreviation,
            'multiplier' => (float) $c->multiplier,
            'is_primary' => $c->is_primary,
        ])->toArray()
        : [],
];
```

- [ ] **Step 2: Update StockOutReportController — same pattern as StockIn**

Apply the same eager loading and data structure changes to both `index()` and `exportJson()` methods.

In `exportJson()`, add unit data to the variantsData array:
```php
'unit' => $variant->baseUnit ? [
    'id' => $variant->baseUnit->id,
    'name' => $variant->baseUnit->name,
    'abbreviation' => $variant->baseUnit->abbreviation,
] : null,
'conversions' => $variant->baseUnit && $variant->baseUnit->conversions
    ? $variant->baseUnit->conversions->map(fn($c) => [
        'id' => $c->id,
        'name' => $c->name,
        'abbreviation' => $c->abbreviation,
        'multiplier' => (float) $c->multiplier,
        'is_primary' => $c->is_primary,
    ])->toArray()
    : [],
```

- [ ] **Step 3: Update StockOpnameReportController — same pattern**

Apply the same eager loading changes. In `export()` CSV, add a 'Satuan' column after 'Nama Varian'.

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/StockIn/StockInReportController.php app/Http/Controllers/StockOut/StockOutReportController.php app/Http/Controllers/StockOpname/StockOpnameReportController.php
git commit -m "feat: include unit data in stock report controllers"
```

---

## Task 10: Update Dashboard — Dynamic Unit in Low Stock Products

**Files:**
- Modify: `app/Http/Controllers/Dashboard/DashboardController.php`

- [ ] **Step 1: Update getLowStockProducts to include unit info**

Change the query to join with units:
```php
private function getLowStockProducts(int $threshold): array
{
    return DB::table('product_variants')
        ->join('products', 'product_variants.product_id', '=', 'products.id')
        ->leftJoin('units', 'product_variants.unit_id', '=', 'units.id')
        ->where('product_variants.stock_current', '<=', $threshold)
        ->orderBy('product_variants.stock_current', 'asc')
        ->limit(10)
        ->select(
            'products.name as product_name',
            'product_variants.variant_name',
            'product_variants.stock_current',
            'units.abbreviation as unit_abbreviation'
        )
        ->get()
        ->toArray();
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Http/Controllers/Dashboard/DashboardController.php
git commit -m "feat: include unit abbreviation in dashboard low stock products"
```

---

## Task 11: Frontend — Units CRUD Pages

**Files:**
- Create: `resources/js/Pages/Units/Index.jsx`
- Create: `resources/js/Pages/Units/Create.jsx`
- Create: `resources/js/Pages/Units/Edit.jsx`
- Create: `resources/js/Pages/Units/Show.jsx`

- [ ] **Step 1: Create Units/Index.jsx**

Create the unit listing page with:
- Tab switching between "Satuan Dasar" and "Satuan Konversi"
- Soft delete toggle
- Search bar
- Table with columns: Name, Abbreviation, Type, Base Unit (for conversions), Multiplier, Variants Count, Actions
- Edit, Delete, Restore actions
- SweetAlert2 for delete confirmation with impact info

- [ ] **Step 2: Create Units/Create.jsx**

Create the unit creation form with:
- Radio toggle for type (Satuan Dasar / Satuan Konversi)
- Name and Abbreviation fields
- Conditional fields for conversion type: Base Unit dropdown, Multiplier input, Is Primary checkbox
- Preview text: "1 Karton = 10 Pcs"
- Description field
- Form validation and submission

- [ ] **Step 3: Create Units/Edit.jsx**

Create the unit edit form with:
- Same layout as Create but pre-filled with existing data
- Hidden updated_at field for optimistic locking
- Type field displayed as read-only badge
- For conversion: editable multiplier, is_primary checkbox

- [ ] **Step 4: Create Units/Show.jsx**

Create the unit detail page with:
- Unit info display
- For base units: list of conversions
- For conversion units: base unit info, multiplier, full_name
- Variants count

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Units/
git commit -m "feat: add Units CRUD frontend pages"
```

---

## Task 12: Frontend — Update Products Pages

**Files:**
- Modify: `resources/js/Pages/Products/Index.jsx`
- Modify: `resources/js/Pages/Products/Create.jsx`
- Modify: `resources/js/Pages/Products/Edit.jsx`
- Modify: `resources/js/Pages/Products/Show.jsx`

- [ ] **Step 1: Update Products/Index.jsx — unit-aware stock display + bulk-assign**

Replace hardcoded `unit` suffix with dynamic unit abbreviation:
```jsx
// In the stock badge display:
{product.total_stock || 0} {product.variants?.[0]?.unit?.abbreviation || 'unit'}
```

For variant detail rows, show conversions:
```jsx
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockBadgeColor(variant.stock_current)}`}>
    {variant.stock_current} {variant.unit?.abbreviation || 'unit'}
    {variant.conversions?.find(c => c.is_primary) && (
        <span className="ml-1 text-gray-500">
            ({variant.conversions.find(c => c.is_primary).converted_stock} {variant.conversions.find(c => c.is_primary).abbreviation})
        </span>
    )}
</span>
```

Add bulk-assign button in the header (next to "Tambah Produk"):
```jsx
{can('products.update') && (
    <button
        onClick={handleBulkAssign}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
    >
        Atur Satuan
    </button>
)}
```

- [ ] **Step 2: Update Products/Create.jsx — add unit dropdown per variant**

Accept `baseUnits` prop. Add a unit dropdown in each variant form section:
```jsx
<MobileFormField
    label="Satuan Dasar"
    error={errors[`variants.${index}.unit_id`]}
>
    <select
        value={variant.unit_id || ''}
        onChange={(e) => handleVariantChange(index, 'unit_id', e.target.value || null)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    >
        <option value="">Pilih satuan...</option>
        {baseUnits?.map((unit) => (
            <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.abbreviation})
            </option>
        ))}
    </select>
</MobileFormField>
```

Update `initialVariant` to include `unit_id: null`.

- [ ] **Step 3: Update Products/Edit.jsx — same unit dropdown**

Same changes as Create.jsx. Pre-select the variant's existing unit_id.

- [ ] **Step 4: Update Products/Show.jsx — show unit info and conversions**

Add unit info display for each variant:
```jsx
{variant.unit && (
    <div className="mt-2">
        <span className="text-sm text-gray-500">Satuan: </span>
        <span className="text-sm font-medium">{variant.unit.name} ({variant.unit.abbreviation})</span>
    </div>
)}
{variant.conversions?.length > 0 && (
    <div className="mt-1">
        <span className="text-sm text-gray-500">Konversi: </span>
        {variant.conversions.map((c) => (
            <span key={c.id} className="inline-flex items-center mr-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                {c.converted_stock} {c.abbreviation}
                {c.is_primary && <span className="ml-1 text-blue-600">*</span>}
            </span>
        ))}
    </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Products/
git commit -m "feat: update Products pages with unit dropdown, stock display, and conversions"
```

---

## Task 13: Frontend — Update Report Pages with Unit Filter

**Files:**
- Modify: `resources/js/Pages/Reports/StockIn/Index.jsx`
- Modify: `resources/js/Pages/Reports/StockOut/Index.jsx`
- Modify: `resources/js/Pages/Reports/StockOpname/Index.jsx`

- [ ] **Step 1: Update Reports/StockIn/Index.jsx**

Add a unit conversion filter dropdown in the filter section. When a conversion unit is selected, multiply displayed quantities by the conversion rate. Add a note at the bottom: "Konversi menggunakan rate yang berlaku saat ini. Rate dapat berubah jika admin memperbarui multiplier."

- [ ] **Step 2: Update Reports/StockOut/Index.jsx**

Same pattern as StockIn. Include unit info in variant data display.

- [ ] **Step 3: Update Reports/StockOpname/Index.jsx**

Same pattern. Add unit column to the report table.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Reports/
git commit -m "feat: add unit conversion filter to stock report pages"
```

---

## Task 14: Frontend — Update Sidebar + Dashboard + Constants

**Files:**
- Modify: `resources/js/Components/Layouts/Sidebar.jsx`
- Modify: `resources/js/Pages/Dashboard/Index.jsx`
- Modify: `resources/js/Utils/constants.js`

- [ ] **Step 1: Update Sidebar.jsx — add Satuan menu**

Add "Satuan" as a submenu under "Produk":
```jsx
{
    name: 'Produk',
    icon: CubeIcon,
    permission: 'create_stock_entries',
    subMenu: [
        {
            name: 'Daftar Produk',
            href: '/products',
            permission: 'create_stock_entries',
        },
        {
            name: 'Satuan',
            href: '/units',
            permission: 'units.view',
        },
    ],
},
```

- [ ] **Step 2: Update Dashboard/Index.jsx — dynamic unit in tooltips**

Update the low stock products table to display `unit_abbreviation` instead of hardcoded "unit":
```jsx
{product.unit_abbreviation || 'unit'}
```

- [ ] **Step 3: Update constants.js — add UNITS permissions**

Add to PERMISSIONS:
```javascript
// Unit Management
UNITS_VIEW: 'units.view',
UNITS_CREATE: 'units.create',
UNITS_EDIT: 'units.update',
UNITS_DELETE: 'units.delete',
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Components/Layouts/Sidebar.jsx resources/js/Pages/Dashboard/Index.jsx resources/js/Utils/constants.js
git commit -m "feat: add Satuan menu to sidebar and update dashboard with dynamic units"
```

---

## Task 15: Run Full Verification

- [ ] **Step 1: Run migrations from scratch**

```bash
php artisan migrate:fresh --seed
```

Expected: All migrations run, seeders create default units

- [ ] **Step 2: Run linting**

```bash
composer analyse # or php artisan pint --test
```

- [ ] **Step 3: Run frontend build**

```bash
npm run build
```

Expected: Build succeeds without errors

- [ ] **Step 4: Manual smoke test checklist**

1. Navigate to /units — page loads, shows default units
2. Create a new base unit — success
3. Create a conversion unit — success, preview shows correctly
4. Edit a unit multiplier — optimistic locking works
5. Delete a unit — soft delete works
6. Navigate to /products/create — unit dropdown appears per variant
7. Create a product with unit assigned — unit saved
8. Navigate to /products — stock shows with unit abbreviation
9. Navigate to reports — unit filter dropdown appears
10. Dashboard — low stock shows unit abbreviation

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete satuan & konversi satuan feature"
```
