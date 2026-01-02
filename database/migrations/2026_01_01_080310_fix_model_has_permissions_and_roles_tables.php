<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tableNames = config('permission.table_names');
        $columnNames = config('permission.column_names');
        $teams = config('permission.teams');

        // Update model_has_roles table to use UUID for model_id
        Schema::table($tableNames['model_has_roles'], function (Blueprint $table) use ($columnNames, $teams) {
            // Drop existing indexes
            $table->dropIndex([$columnNames['model_morph_key'], 'model_type']);

            // Change model_id to string to support UUID
            $table->string($columnNames['model_morph_key'])->change();

            // Add index for the updated column
            $table->index([$columnNames['model_morph_key'], 'model_type'], 'model_has_roles_model_id_model_type_index');
        });

        // Update model_has_permissions table to use UUID for model_id
        Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) use ($columnNames, $teams) {
            // Drop existing indexes
            $table->dropIndex([$columnNames['model_morph_key'], 'model_type']);

            // Change model_id to string to support UUID
            $table->string($columnNames['model_morph_key'])->change();

            // Add index for the updated column
            $table->index([$columnNames['model_morph_key'], 'model_type'], 'model_has_permissions_model_id_model_type_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tableNames = config('permission.table_names');
        $columnNames = config('permission.column_names');

        // Revert model_has_roles table
        Schema::table($tableNames['model_has_roles'], function (Blueprint $table) use ($columnNames) {
            // Drop existing indexes
            $table->dropIndex([$columnNames['model_morph_key'], 'model_type']);

            // Change model_id back to unsignedBigInteger
            $table->unsignedBigInteger($columnNames['model_morph_key'])->change();

            // Add index for the reverted column
            $table->index([$columnNames['model_morph_key'], 'model_type'], 'model_has_roles_model_id_model_type_index');
        });

        // Revert model_has_permissions table
        Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) use ($columnNames) {
            // Drop existing indexes
            $table->dropIndex([$columnNames['model_morph_key'], 'model_type']);

            // Change model_id back to unsignedBigInteger
            $table->unsignedBigInteger($columnNames['model_morph_key'])->change();

            // Add index for the reverted column
            $table->index([$columnNames['model_morph_key'], 'model_type'], 'model_has_permissions_model_id_model_type_index');
        });
    }
};
