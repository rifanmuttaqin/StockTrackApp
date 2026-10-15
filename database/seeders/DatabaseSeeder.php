<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminUserSeeder::class,
            UnitSeeder::class,
            FixUserRoleSeeder::class,
            WhatsAppStockOpnameTemplateSeeder::class,
            // PermissionSeeder intentionally excluded: it is a no-op
            // documentation seeder (permissions are created in RoleSeeder).
        ]);
    }
}
