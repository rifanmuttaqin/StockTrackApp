<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Template Module Permissions
            // Note: These permissions are actually created in RoleSeeder
            // This seeder is kept for reference and documentation purposes

            $templatePermissions = [
                [
                    'name' => 'templates.view',
                    'display_name' => 'View Templates',
                    'description' => 'Melihat daftar template',
                ],
                [
                    'name' => 'templates.create',
                    'display_name' => 'Create Templates',
                    'description' => 'Membuat template baru',
                ],
                [
                    'name' => 'templates.update',
                    'display_name' => 'Update Templates',
                    'description' => 'Mengedit template yang sudah ada',
                ],
                [
                    'name' => 'templates.delete',
                    'display_name' => 'Delete Templates',
                    'description' => 'Menghapus template (soft delete)',
                ],
                [
                    'name' => 'templates.restore',
                    'display_name' => 'Restore Templates',
                    'description' => 'Memulihkan template yang di-soft delete',
                ],
                [
                    'name' => 'templates.force_delete',
                    'display_name' => 'Force Delete Templates',
                    'description' => 'Menghapus permanen template yang sudah di-soft delete',
                ],
                [
                    'name' => 'templates.set_active',
                    'display_name' => 'Set Active Template',
                    'description' => 'Mengatur template aktif',
                ],
            ];

            // Permission assignments by role (for reference):
            // Admin: All template permissions
            // Inventory Staff: templates.view only
            // Warehouse Supervisor: templates.view only
            // Management: No template permissions
        });
    }
}
