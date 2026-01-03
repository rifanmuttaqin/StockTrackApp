<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
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

                return [
                    'user' => $user,
                    'permissions' => $permissions,
                    'roles' => $roles,
                ];
            },
        ];
    }
}
