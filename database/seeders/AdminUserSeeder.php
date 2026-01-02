<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Get roles
            $adminRole = Role::where('name', 'admin')->first();
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
                'email_verified_at' => now(),
                'is_active' => true,
            ]);

            // Only assign role if this is a newly created user
            if ($adminUser->wasRecentlyCreated) {
                // Assign admin role to admin using DB facade directly
                DB::table('model_has_roles')->insert([
                    'role_id' => $adminRole->id,
                    'model_type' => User::class,
                    'model_id' => $adminUser->id,
                ]);

                // Update current_role_id with UUID role ID
                $adminUser->current_role_id = $adminRole->id;
                $adminUser->save();
            }

            // Create sample users with UUID
            $sampleUsers = [
                [
                    'id' => Str::uuid(),
                    'name' => 'John Supervisor',
                    'email' => 'supervisor@stocktrackapp.com',
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ],
                [
                    'id' => Str::uuid(),
                    'name' => 'Jane Staff',
                    'email' => 'staff@stocktrackapp.com',
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ],
            ];

            foreach ($sampleUsers as $index => $userData) {
                $user = User::firstOrCreate([
                    'email' => $userData['email'],
                ], $userData);

                // Only assign roles if this is a newly created user
                if ($user->wasRecentlyCreated) {
                    // Assign roles using DB facade directly
                    if ($index === 0) {
                        DB::table('model_has_roles')->insert([
                            'role_id' => $supervisorRole->id,
                            'model_type' => User::class,
                            'model_id' => $user->id,
                        ]);
                        $user->current_role_id = $supervisorRole->id;
                    } else {
                        DB::table('model_has_roles')->insert([
                            'role_id' => $inventoryRole->id,
                            'model_type' => User::class,
                            'model_id' => $user->id,
                        ]);
                        $user->current_role_id = $inventoryRole->id;
                    }

                    $user->save();
                }
            }
        });
    }
}
