<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 50);
            $table->string('abbreviation', 10);
            $table->string('type', 20)->default('base');
            $table->uuid('base_unit_id')->nullable();
            $table->decimal('multiplier', 10, 2)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('base_unit_id');
            $table->index('deleted_at');
        });

        // Self-referencing FK must be added after table creation (PostgreSQL requires
        // the referenced table's PK to exist before adding a FK constraint)
        Schema::table('units', function (Blueprint $table) {
            $table->foreign('base_unit_id')
                  ->references('id')
                  ->on('units')
                  ->onDelete('restrict');
        });

        // Partial unique index: LOWER(name) WHERE deleted_at IS NULL
        DB::statement('CREATE UNIQUE INDEX units_name_unique_active ON units (LOWER(name)) WHERE deleted_at IS NULL');

        // Partial unique index: LOWER(abbreviation) WHERE deleted_at IS NULL
        DB::statement('CREATE UNIQUE INDEX units_abbreviation_unique_active ON units (LOWER(abbreviation)) WHERE deleted_at IS NULL');

        // Partial unique index: (base_unit_id) WHERE is_primary = TRUE AND type = 'conversion' AND deleted_at IS NULL
        DB::statement('CREATE UNIQUE INDEX units_base_unit_primary_unique_active ON units (base_unit_id) WHERE is_primary = TRUE AND type = \'conversion\' AND deleted_at IS NULL');

        // Partial index: type WHERE deleted_at IS NULL
        DB::statement('CREATE INDEX units_type_active ON units (type) WHERE deleted_at IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
