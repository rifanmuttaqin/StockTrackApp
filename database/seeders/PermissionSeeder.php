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

            // Stock Out Module Permissions
            $stockOutPermissions = [
                [
                    'name' => 'stock_out.view',
                    'display_name' => 'View Stock Out',
                    'description' => 'Melihat daftar stock keluar',
                ],
                [
                    'name' => 'stock_out.create',
                    'display_name' => 'Create Stock Out',
                    'description' => 'Membuat input stock keluar',
                ],
                [
                    'name' => 'stock_out.edit',
                    'display_name' => 'Edit Stock Out',
                    'description' => 'Mengedit draft stock keluar',
                ],
                [
                    'name' => 'stock_out.delete',
                    'display_name' => 'Delete Stock Out',
                    'description' => 'Menghapus draft stock keluar',
                ],
                [
                    'name' => 'stock_out.submit',
                    'display_name' => 'Submit Stock Out',
                    'description' => 'Submit stock keluar',
                ],
            ];

            // Stock In Module Permissions
            $stockInPermissions = [
                [
                    'name' => 'stock_in.view',
                    'display_name' => 'Lihat Stock Masuk',
                    'description' => 'Melihat daftar stock masuk',
                ],
                [
                    'name' => 'stock_in.create',
                    'display_name' => 'Buat Stock Masuk',
                    'description' => 'Membuat input stock masuk',
                ],
                [
                    'name' => 'stock_in.edit',
                    'display_name' => 'Edit Stock Masuk',
                    'description' => 'Mengedit draft stock masuk',
                ],
                [
                    'name' => 'stock_in.update',
                    'display_name' => 'Update Stock Masuk',
                    'description' => 'Update draft stock masuk',
                ],
                [
                    'name' => 'stock_in.delete',
                    'display_name' => 'Hapus Stock Masuk',
                    'description' => 'Menghapus draft stock masuk',
                ],
                [
                    'name' => 'stock_in.submit',
                    'display_name' => 'Submit Stock Masuk',
                    'description' => 'Submit stock masuk',
                ],
            ];

            // Permission assignments by role (for reference):
            //
            // Template Module:
            // - Admin: All template permissions
            // - Inventory Staff: templates.view only
            // - Warehouse Supervisor: templates.view only
            // - Management: No template permissions
            //
            // Stock Out Module:
            // - Admin: stock_out.view, stock_out.create, stock_out.edit, stock_out.delete, stock_out.submit
            // - Operator: stock_out.view, stock_out.create, stock_out.edit, stock_out.delete, stock_out.submit
            // - Supervisor: stock_out.view only
            //
            // Stock In Module:
            // - Admin: stock_in.view, stock_in.create, stock_in.edit, stock_in.update, stock_in.delete, stock_in.submit
            // - Operator: stock_in.view, stock_in.create, stock_in.edit, stock_in.update, stock_in.delete, stock_in.submit
            // - Supervisor: stock_in.view only
        });
    }
}
