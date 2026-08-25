<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Base units
        $pcs = Unit::updateOrCreate(
            ['name' => 'Pcs'],
            [
                'abbreviation' => 'pcs',
                'type' => 'base',
            ]
        );

        Unit::updateOrCreate(
            ['name' => 'Kg'],
            [
                'abbreviation' => 'kg',
                'type' => 'base',
            ]
        );

        Unit::updateOrCreate(
            ['name' => 'Liter'],
            [
                'abbreviation' => 'ltr',
                'type' => 'base',
            ]
        );

        Unit::updateOrCreate(
            ['name' => 'Meter'],
            [
                'abbreviation' => 'm',
                'type' => 'base',
            ]
        );

        // Conversion units (all base_unit_id → Pcs)
        Unit::updateOrCreate(
            ['name' => 'Karton'],
            [
                'abbreviation' => 'ktg',
                'type' => 'conversion',
                'base_unit_id' => $pcs->id,
                'multiplier' => 10,
                'is_primary' => true,
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
            ]
        );
    }
}
