<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => function () use ($request) {
                $user = $request->user();

                if (!$user) {
                    Log::debug('HandleInertiaRequests: No user found');
                    return [
                        'user' => null,
                        'permissions' => [],
                        'roles' => [],
                    ];
                }

                // Get user permissions
                $permissions = $user->getAllPermissions()->pluck('name')->toArray();

                // Get user roles
                $roles = $user->roles->pluck('name')->toArray();

                // Debug logging
                Log::debug('HandleInertiaRequests: Auth data', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'permissions_count' => count($permissions),
                    'permissions_sample' => array_slice($permissions, 0, 5),
                    'roles_count' => count($roles),
                    'roles_sample' => array_slice($roles, 0, 3),
                    'permissions_type' => gettype($permissions),
                    'is_array' => is_array($permissions)
                ]);

                return [
                    'user' => $user,
                    'permissions' => $permissions,
                    'roles' => $roles,
                ];
            },
        ];
    }
}
