<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Base units — use DB query builder for idempotent seeding
        // (Eloquent updateOrCreate can bypass boot() UUID generation in some cases)
        $pcsId = $this->upsertBaseUnit('Pcs', 'pcs', 'Satuan dasar (pieces)');
        $this->upsertBaseUnit('Kg', 'kg', 'Kilogram');
        $this->upsertBaseUnit('Liter', 'ltr', 'Liter');
        $this->upsertBaseUnit('Meter', 'm', 'Meter');

        // Conversion units (all base_unit_id → Pcs)
        $this->upsertConversionUnit('Karton', 'ktg', $pcsId, 10, true, '1 Karton = 10 Pcs');
        $this->upsertConversionUnit('Box', 'box', $pcsId, 24, false, '1 Box = 24 Pcs');
        $this->upsertConversionUnit('Lusin', 'lsn', $pcsId, 12, false, '1 Lusin = 12 Pcs');
        $this->upsertConversionUnit('Dus', 'dus', $pcsId, 100, false, '1 Dus = 100 Pcs');
    }

    private function upsertBaseUnit(string $name, string $abbreviation, ?string $description = null): string
    {
        $existing = DB::table('units')
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->where('type', 'base')
            ->first();

        if ($existing) {
            return $existing->id;
        }

        $id = (string) Str::uuid();
        DB::table('units')->insert([
            'id' => $id,
            'name' => $name,
            'abbreviation' => $abbreviation,
            'type' => 'base',
            'description' => $description,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    private function upsertConversionUnit(
        string $name,
        string $abbreviation,
        string $baseUnitId,
        float $multiplier,
        bool $isPrimary,
        ?string $description = null
    ): void {
        $existing = DB::table('units')
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->where('type', 'conversion')
            ->first();

        if ($existing) {
            DB::table('units')
                ->where('id', $existing->id)
                ->update([
                    'abbreviation' => $abbreviation,
                    'base_unit_id' => $baseUnitId,
                    'multiplier' => $multiplier,
                    'is_primary' => $isPrimary,
                    'description' => $description,
                    'updated_at' => now(),
                ]);
            return;
        }

        DB::table('units')->insert([
            'id' => (string) Str::uuid(),
            'name' => $name,
            'abbreviation' => $abbreviation,
            'type' => 'conversion',
            'base_unit_id' => $baseUnitId,
            'multiplier' => $multiplier,
            'is_primary' => $isPrimary,
            'description' => $description,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
