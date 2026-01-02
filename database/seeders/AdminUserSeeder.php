<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
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

            // Create admin user with UUID
            $adminUser = User::firstOrCreate([
                'email' => 'admin@stocktrackapp.com',
            ], [
                'id' => Str::uuid(),
                'name' => 'Super Admin',
                'password' => Hash::make('admin123'),
                'is_active' => true,
            ]);

            // Assign management role to admin using the pivot table directly
            DB::table('model_has_roles')->insert([
                'model_id' => $adminUser->id,
                'model_type' => User::class,
                'role_id' => $managementRole->id,
            ]);

            // Update current_role_id with integer role ID
            $adminUser->current_role_id = $managementRole->id;
            $adminUser->save();

            // Create sample users with UUID
            $sampleUsers = [
                [
                    'id' => Str::uuid(),
                    'name' => 'John Supervisor',
                    'email' => 'supervisor@stocktrackapp.com',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                ],
                [
                    'id' => Str::uuid(),
                    'name' => 'Jane Staff',
                    'email' => 'staff@stocktrackapp.com',
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                ],
            ];

            foreach ($sampleUsers as $index => $userData) {
                $user = User::firstOrCreate([
                    'email' => $userData['email'],
                ], $userData);

                // Only assign roles if this is a newly created user
                if ($user->wasRecentlyCreated) {
                    // Assign roles using pivot table directly
                    if ($index === 0) {
                        DB::table('model_has_roles')->insert([
                            'model_id' => $user->id,
                            'model_type' => User::class,
                            'role_id' => $supervisorRole->id,
                        ]);

                        $user->current_role_id = $supervisorRole->id;
                    } else {
                        DB::table('model_has_roles')->insert([
                            'model_id' => $user->id,
                            'model_type' => User::class,
                            'role_id' => $inventoryRole->id,
                        ]);

                        $user->current_role_id = $inventoryRole->id;
                    }

                    $user->save();
                }
            }
        });
    }
}
