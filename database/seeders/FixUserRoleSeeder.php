<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class FixUserRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Get roles
            $inventoryRole = Role::where('name', 'inventory_staff')->first();
            $supervisorRole = Role::where('name', 'warehouse_supervisor')->first();
            $managementRole = Role::where('name', 'management')->first();

            // Fix admin user
            $adminUser = User::where('email', 'admin@stocktrackapp.com')->first();
            if ($adminUser) {
                $adminUser->current_role_id = $managementRole->id;
                $adminUser->save();
                $this->command->info('Fixed admin user current_role_id');
            }

            // Fix supervisor user
            $supervisorUser = User::where('email', 'supervisor@stocktrackapp.com')->first();
            if ($supervisorUser) {
                $supervisorUser->current_role_id = $supervisorRole->id;
                $supervisorUser->save();
                $this->command->info('Fixed supervisor user current_role_id');
            }

            // Fix staff user
            $staffUser = User::where('email', 'staff@stocktrackapp.com')->first();
            if ($staffUser) {
                $staffUser->current_role_id = $inventoryRole->id;
                $staffUser->save();
                $this->command->info('Fixed staff user current_role_id');
            }
        });
    }
}
