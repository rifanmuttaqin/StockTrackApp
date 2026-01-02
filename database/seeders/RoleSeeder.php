<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

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
                    'name' => 'inventory_staff',
                    'display_name' => 'Inventory Staff',
                    'description' => 'Staff yang bertanggung jawab atas input data dan laporan dasar',
                    'guard_name' => 'web',
                    'is_active' => true,
                ],
                [
                    'name' => 'warehouse_supervisor',
                    'display_name' => 'Warehouse Supervisor',
                    'description' => 'Supervisor yang memiliki akses penuh ke manajemen data dan user',
                    'guard_name' => 'web',
                    'is_active' => true,
                ],
                [
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
            $permission = \Spatie\Permission\Models\Permission::firstOrCreate([
                'name' => $permissionData['name'],
                'guard_name' => 'web',
            ], [
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
            'inventory_staff' => [
                ['name' => 'view_dashboard', 'display_name' => 'View Dashboard', 'description' => 'Melihat dashboard'],
                ['name' => 'view_reports', 'display_name' => 'View Reports', 'description' => 'Melihat laporan dasar'],
                ['name' => 'create_stock_entries', 'display_name' => 'Create Stock Entries', 'description' => 'Membuat entri stock'],
                ['name' => 'edit_stock_entries', 'display_name' => 'Edit Stock Entries', 'description' => 'Mengedit entri stock'],
                ['name' => 'delete_stock_entries', 'display_name' => 'Delete Stock Entries', 'description' => 'Menghapus entri stock'],
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
