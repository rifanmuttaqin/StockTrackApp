<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Role;
use App\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Create roles according to PRD
            $roles = [
                [
                    'id' => Str::uuid(),
                    'name' => 'admin',
                    'display_name' => 'Administrator',
                    'description' => 'Administrator yang memiliki akses penuh ke semua fitur termasuk manajemen pengguna',
                    'guard_name' => 'web',
                    'is_active' => true,
                ],
                [
                    'id' => Str::uuid(),
                    'name' => 'inventory_staff',
                    'display_name' => 'Inventory Staff',
                    'description' => 'Staff yang bertanggung jawab atas input data dan laporan dasar',
                    'guard_name' => 'web',
                    'is_active' => true,
                ],
                [
                    'id' => Str::uuid(),
                    'name' => 'warehouse_supervisor',
                    'display_name' => 'Warehouse Supervisor',
                    'description' => 'Supervisor yang memiliki akses penuh ke manajemen data dan user',
                    'guard_name' => 'web',
                    'is_active' => true,
                ],
                [
                    'id' => Str::uuid(),
                    'name' => 'management',
                    'display_name' => 'Management',
                    'description' => 'Management yang memiliki akses view-only ke laporan dan dashboard',
                    'guard_name' => 'web',
                    'is_active' => true,
                ],
            ];

            foreach ($roles as $roleData) {
                $role = Role::firstOrCreate([
                    'name' => $roleData['name'],
                    'guard_name' => $roleData['guard_name'],
                ], $roleData);

                // Create permissions for this role
                $this->createPermissionsForRole($role);
            }
        });
    }

    /**
     * Create permissions for a specific role
     */
    private function createPermissionsForRole(Role $role): void
    {
        $permissions = $this->getPermissionsForRole($role->name);

        foreach ($permissions as $permissionData) {
            $permission = Permission::firstOrCreate([
                'name' => $permissionData['name'],
                'guard_name' => 'web',
            ], [
                'id' => Str::uuid(),
                'display_name' => $permissionData['display_name'],
                'description' => $permissionData['description'],
            ]);

            $role->givePermissionTo($permission);
        }
    }

    /**
     * Get permissions for specific role
     */
    private function getPermissionsForRole(string $roleName): array
    {
        return match ($roleName) {
            'admin' => [
                ['name' => 'view_dashboard', 'display_name' => 'View Dashboard', 'description' => 'Melihat dashboard'],
                ['name' => 'view_reports', 'display_name' => 'View Reports', 'description' => 'Melihat laporan'],
                ['name' => 'view_analytics', 'display_name' => 'View Analytics', 'description' => 'Melihat analytics'],
                ['name' => 'view_user_activity', 'display_name' => 'View User Activity', 'description' => 'Melihat aktivitas user'],
                ['name' => 'export_reports', 'display_name' => 'Export Reports', 'description' => 'Mengekspor laporan'],
                ['name' => 'create_stock_entries', 'display_name' => 'Create Stock Entries', 'description' => 'Membuat entri stock'],
                ['name' => 'edit_stock_entries', 'display_name' => 'Edit Stock Entries', 'description' => 'Mengedit entri stock'],
                ['name' => 'delete_stock_entries', 'display_name' => 'Delete Stock Entries', 'description' => 'Menghapus entri stock'],
                ['name' => 'approve_stock_entries', 'display_name' => 'Approve Stock Entries', 'description' => 'Menyetujui entri stock'],
                ['name' => 'view_audit_logs', 'display_name' => 'View Audit Logs', 'description' => 'Melihat audit logs'],
                ['name' => 'manage_users', 'display_name' => 'Manage Users', 'description' => 'Mengelola user'],
                ['name' => 'suspend', 'display_name' => 'Suspend Users', 'description' => 'Menangguhkan user'],
                ['name' => 'unsuspend', 'display_name' => 'Unsuspend Users', 'description' => 'Mengaktifkan kembali user'],
                // User Management Permissions
                ['name' => 'users.index', 'display_name' => 'View Users', 'description' => 'Melihat daftar pengguna'],
                ['name' => 'users.create', 'display_name' => 'Create Users', 'description' => 'Membuat pengguna baru'],
                ['name' => 'users.show', 'display_name' => 'View User Details', 'description' => 'Melihat detail pengguna'],
                ['name' => 'users.edit', 'display_name' => 'Edit Users', 'description' => 'Mengedit data pengguna'],
                ['name' => 'users.delete', 'display_name' => 'Delete Users', 'description' => 'Menghapus pengguna'],
                ['name' => 'users.toggle-status', 'display_name' => 'Toggle User Status', 'description' => 'Mengubah status aktif/non-aktif pengguna'],
                ['name' => 'users.suspend', 'display_name' => 'Suspend Users', 'description' => 'Menangguhkan pengguna'],
                ['name' => 'users.unsuspend', 'display_name' => 'Unsuspend Users', 'description' => 'Mengaktifkan kembali pengguna yang ditangguhkan'],
                ['name' => 'users.assign-role', 'display_name' => 'Assign User Roles', 'description' => 'Mengatur role pengguna'],
                ['name' => 'users.export', 'display_name' => 'Export Users', 'description' => 'Mengekspor data pengguna'],
                // Product Management Permissions
                ['name' => 'products.index', 'display_name' => 'View Products', 'description' => 'Melihat daftar produk'],
                ['name' => 'products.create', 'display_name' => 'Create Products', 'description' => 'Membuat produk baru'],
                ['name' => 'products.show', 'display_name' => 'View Product Details', 'description' => 'Melihat detail produk'],
                ['name' => 'products.edit', 'display_name' => 'Edit Products', 'description' => 'Mengedit data produk'],
                ['name' => 'products.update', 'display_name' => 'Update Products', 'description' => 'Mengupdate data produk'],
                ['name' => 'products.delete', 'display_name' => 'Delete Products', 'description' => 'Menghapus produk'],
                ['name' => 'products.export', 'display_name' => 'Export Products', 'description' => 'Mengekspor data produk'],
                // Product Variant Management Permissions
                ['name' => 'product_variants.index', 'display_name' => 'View Product Variants', 'description' => 'Melihat daftar varian produk'],
                ['name' => 'product_variants.create', 'display_name' => 'Create Product Variants', 'description' => 'Membuat varian produk baru'],
                ['name' => 'product_variants.show', 'display_name' => 'View Product Variant Details', 'description' => 'Melihat detail varian produk'],
                ['name' => 'product_variants.edit', 'display_name' => 'Edit Product Variants', 'description' => 'Mengedit data varian produk'],
                ['name' => 'product_variants.update', 'display_name' => 'Update Product Variants', 'description' => 'Mengupdate data varian produk'],
                ['name' => 'product_variants.delete', 'display_name' => 'Delete Product Variants', 'description' => 'Menghapus varian produk']
            ],
            'inventory_staff' => [
                ['name' => 'view_dashboard', 'display_name' => 'View Dashboard', 'description' => 'Melihat dashboard'],
                ['name' => 'view_reports', 'display_name' => 'View Reports', 'description' => 'Melihat laporan dasar'],
                ['name' => 'create_stock_entries', 'display_name' => 'Create Stock Entries', 'description' => 'Membuat entri stock'],
                ['name' => 'edit_stock_entries', 'display_name' => 'Edit Stock Entries', 'description' => 'Mengedit entri stock'],
                ['name' => 'delete_stock_entries', 'display_name' => 'Delete Stock Entries', 'description' => 'Menghapus entri stock'],
                // Product Management Permissions (View Only)
                ['name' => 'products.index', 'display_name' => 'View Products', 'description' => 'Melihat daftar produk'],
                ['name' => 'products.show', 'display_name' => 'View Product Details', 'description' => 'Melihat detail produk'],
                // Product Variant Management Permissions (View Only)
                ['name' => 'product_variants.index', 'display_name' => 'View Product Variants', 'description' => 'Melihat daftar varian produk'],
                ['name' => 'product_variants.show', 'display_name' => 'View Product Variant Details', 'description' => 'Melihat detail varian produk']
            ],
            'warehouse_supervisor' => [
                ['name' => 'view_dashboard', 'display_name' => 'View Dashboard', 'description' => 'Melihat dashboard'],
                ['name' => 'view_reports', 'display_name' => 'View Reports', 'description' => 'Melihat laporan'],
                ['name' => 'manage_users', 'display_name' => 'Manage Users', 'description' => 'Mengelola user'],
                ['name' => 'create_stock_entries', 'display_name' => 'Create Stock Entries', 'description' => 'Membuat entri stock'],
                ['name' => 'edit_stock_entries', 'display_name' => 'Edit Stock Entries', 'description' => 'Mengedit entri stock'],
                ['name' => 'delete_stock_entries', 'display_name' => 'Delete Stock Entries', 'description' => 'Menghapus entri stock'],
                ['name' => 'approve_stock_entries', 'display_name' => 'Approve Stock Entries', 'description' => 'Menyetujui entri stock'],
                ['name' => 'view_audit_logs', 'display_name' => 'View Audit Logs', 'description' => 'Melihat audit logs'],
                ['name' => 'suspend', 'display_name' => 'Suspend Users', 'description' => 'Menangguhkan user'],
                ['name' => 'unsuspend', 'display_name' => 'Unsuspend Users', 'description' => 'Mengaktifkan kembali user'],
                // User Management Permissions
                ['name' => 'users.index', 'display_name' => 'View Users', 'description' => 'Melihat daftar pengguna'],
                ['name' => 'users.create', 'display_name' => 'Create Users', 'description' => 'Membuat pengguna baru'],
                ['name' => 'users.show', 'display_name' => 'View User Details', 'description' => 'Melihat detail pengguna'],
                ['name' => 'users.edit', 'display_name' => 'Edit Users', 'description' => 'Mengedit data pengguna'],
                ['name' => 'users.delete', 'display_name' => 'Delete Users', 'description' => 'Menghapus pengguna'],
                ['name' => 'users.toggle-status', 'display_name' => 'Toggle User Status', 'description' => 'Mengubah status aktif/non-aktif pengguna'],
                ['name' => 'users.suspend', 'display_name' => 'Suspend Users', 'description' => 'Menangguhkan pengguna'],
                ['name' => 'users.unsuspend', 'display_name' => 'Unsuspend Users', 'description' => 'Mengaktifkan kembali pengguna yang ditangguhkan'],
                ['name' => 'users.assign-role', 'display_name' => 'Assign User Roles', 'description' => 'Mengatur role pengguna'],
                ['name' => 'users.export', 'display_name' => 'Export Users', 'description' => 'Mengekspor data pengguna'],
                // Product Management Permissions
                ['name' => 'products.index', 'display_name' => 'View Products', 'description' => 'Melihat daftar produk'],
                ['name' => 'products.show', 'display_name' => 'View Product Details', 'description' => 'Melihat detail produk'],
                ['name' => 'products.update', 'display_name' => 'Update Products', 'description' => 'Mengupdate data produk'],
                // Product Variant Management Permissions
                ['name' => 'product_variants.index', 'display_name' => 'View Product Variants', 'description' => 'Melihat daftar varian produk'],
                ['name' => 'product_variants.show', 'display_name' => 'View Product Variant Details', 'description' => 'Melihat detail varian produk'],
                ['name' => 'product_variants.update', 'display_name' => 'Update Product Variants', 'description' => 'Mengupdate data varian produk']
            ],
            'management' => [
                ['name' => 'view_dashboard', 'display_name' => 'View Dashboard', 'description' => 'Melihat dashboard'],
                ['name' => 'view_reports', 'display_name' => 'View Reports', 'description' => 'Melihat semua laporan'],
                ['name' => 'view_analytics', 'display_name' => 'View Analytics', 'description' => 'Melihat analytics'],
                ['name' => 'view_user_activity', 'display_name' => 'View User Activity', 'description' => 'Melihat aktivitas user'],
                ['name' => 'export_reports', 'display_name' => 'Export Reports', 'description' => 'Mengekspor laporan'],
            ],
        };
    }
}
