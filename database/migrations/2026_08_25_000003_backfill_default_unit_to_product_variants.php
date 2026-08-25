<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $pcsUnit = DB::table('units')
            ->where('name', 'Pcs')
            ->whereNull('deleted_at')
            ->first();

        if (!$pcsUnit) {
            $id = Uuid::uuid4()->toString();
            DB::table('units')->insert([
                'id'            => $id,
                'name'          => 'Pcs',
                'abbreviation'  => 'Pcs',
                'type'          => 'base',
                'base_unit_id'  => null,
                'multiplier'    => null,
                'is_primary'    => false,
                'description'   => 'Default unit (Pieces)',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
            $pcsUnit = (object) ['id' => $id];
        }

        $updated = DB::table('product_variants')
            ->whereNull('unit_id')
            ->whereNull('deleted_at')
            ->update(['unit_id' => $pcsUnit->id, 'updated_at' => now()]);

        Log::info("Backfill default unit: assigned Pcs unit ({$pcsUnit->id}) to {$updated} product variants.");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $pcsUnit = DB::table('units')
            ->where('name', 'Pcs')
            ->first();

        if ($pcsUnit) {
            DB::table('product_variants')
                ->where('unit_id', $pcsUnit->id)
                ->update(['unit_id' => null, 'updated_at' => now()]);
        }
    }
};
