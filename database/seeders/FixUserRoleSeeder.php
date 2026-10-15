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
     *
     * Synchronises users.current_role_id with the pivot table
     * (model_has_roles) WITHOUT overwriting values that are already
     * correct:
     *  - users with NULL current_role_id get it filled from their
     *    first pivot role (covers manually created users);
     *  - users whose current_role_id no longer matches any of their
     *    pivot roles are reset to the first pivot role;
     *  - users without any pivot role are left untouched.
     *
     * NOTE: a previous version of this seeder hardcoded
     * admin@stocktrackapp.com -> management role, which is wrong
     * (admin must stay admin). That mapping has been removed.
     */
    public function run(): void
    {
        DB::transaction(function () {
            $users = User::all();

            foreach ($users as $user) {
                $pivotRoleIds = DB::table('model_has_roles')
                    ->where('model_type', User::class)
                    ->where('model_id', $user->id)
                    ->pluck('role_id')
                    ->all();

                if (empty($pivotRoleIds)) {
                    $this->command->warn("Skipped {$user->email}: no role in model_has_roles.");
                    continue;
                }

                if (empty($user->current_role_id) || ! in_array($user->current_role_id, $pivotRoleIds, true)) {
                    $old = $user->current_role_id ?: '(null)';
                    $user->current_role_id = $pivotRoleIds[0];
                    $user->save();
                    $roleName = Role::where('id', $pivotRoleIds[0])->value('name');
                    $this->command->info("Fixed {$user->email}: {$old} -> {$roleName}");
                }
            }
        });
    }
}
