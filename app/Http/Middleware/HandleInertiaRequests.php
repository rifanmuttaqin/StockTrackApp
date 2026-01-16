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
        // Diagnostic logging for CSRF investigation
        \Illuminate\Support\Facades\Log::info('HandleInertiaRequests::share called', [
            'csrf_token' => csrf_token(),
            'session_id' => session()->getId(),
            'has_session' => session()->isStarted(),
            'url' => $request->url(),
            'method' => $request->method(),
            'user_authenticated' => auth()->check(),
        ]);

        return [
            ...parent::share($request),
            'csrf_token' => csrf_token(),
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
