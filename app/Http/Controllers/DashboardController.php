<?php

namespace App\Http\Controllers;

use App\Services\Contracts\UserServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    protected UserServiceInterface $userService;

    public function __construct(UserServiceInterface $userService)
    {
        $this->userService = $userService;
        $this->middleware('auth');
    }

    /**
     * Display dashboard based on user role
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Get dashboard data based on user role
        $dashboardData = $this->getDashboardData($user);

        return Inertia::render('Dashboard/Index', [
            'user' => $user,
            'dashboardData' => $dashboardData,
        ]);
    }

    /**
     * Get dashboard data based on user role
     */
    protected function getDashboardData($user): array
    {
        $data = [
            'userRole' => $user->getRoleNames()->first() ?? 'User',
            'lastLogin' => $user->last_login_at,
        ];

        // Admin dashboard data
        $isAdmin = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->whereIn('roles.name', ['Super Admin', 'Admin'])
            ->exists();

        $isManager = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->where('roles.name', 'Manager')
            ->exists();

        if ($isAdmin) {
            $data = array_merge($data, $this->getAdminDashboardData());
        }
        // Manager dashboard data
        elseif ($isManager) {
            $data = array_merge($data, $this->getManagerDashboardData());
        }
        // User dashboard data
        else {
            $data = array_merge($data, $this->getUserDashboardData());
        }

        return $data;
    }

    /**
     * Get admin dashboard data
     */
    protected function getAdminDashboardData(): array
    {
        $totalUsers = DB::table('users')->count();
        $activeUsers = DB::table('users')->where('is_active', true)->count();
        $inactiveUsers = $totalUsers - $activeUsers;

        // Users created in last 30 days
        $newUsers = DB::table('users')
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        // Users by role
        $usersByRole = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->select('roles.name', DB::raw('count(*) as count'))
            ->groupBy('roles.name')
            ->get();

        // Recent user activity
        $recentUsers = DB::table('users')
            ->orderBy('last_login_at', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'email', 'last_login_at']);

        // User registration trend (last 7 days)
        $registrationTrend = DB::table('users')
            ->where('created_at', '>=', now()->subDays(7))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'inactiveUsers' => $inactiveUsers,
            'newUsers' => $newUsers,
            'usersByRole' => $usersByRole,
            'recentUsers' => $recentUsers,
            'registrationTrend' => $registrationTrend,
        ];
    }

    /**
     * Get manager dashboard data
     */
    protected function getManagerDashboardData(): array
    {
        // Get users that manager can see (based on permissions)
        $totalUsers = $this->userService->getAllUsers(1)->total();

        // Active users
        $activeUsers = DB::table('users')->where('is_active', true)->count();

        // New users in last 30 days
        $newUsers = DB::table('users')
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        // Recent users
        $recentUsers = DB::table('users')
            ->orderBy('last_login_at', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'email', 'last_login_at']);

        return [
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'newUsers' => $newUsers,
            'recentUsers' => $recentUsers,
        ];
    }

    /**
     * Get regular user dashboard data
     */
    protected function getUserDashboardData(): array
    {
        $user = Auth::user();

        return [
            'profileComplete' => $this->isProfileComplete($user),
            'lastLogin' => $user->last_login_at,
            'accountCreated' => $user->created_at,
        ];
    }

    /**
     * Check if user profile is complete
     */
    protected function isProfileComplete($user): bool
    {
        // Add more profile completeness checks as needed
        return !empty($user->name) && !empty($user->email);
    }

    /**
     * Get system statistics (for admin dashboard)
     */
    public function getSystemStats(): JsonResponse
    {
        $user = Auth::user();
        $isAdmin = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->whereIn('roles.name', ['Super Admin', 'Admin'])
            ->exists();

        if (!$isAdmin) {
            abort(403, 'Unauthorized');
        }

        $stats = [
            'totalUsers' => DB::table('users')->count(),
            'activeUsers' => DB::table('users')->where('is_active', true)->count(),
            'totalRoles' => DB::table('roles')->count(),
            'totalPermissions' => DB::table('permissions')->count(),
            'usersOnline' => $this->getOnlineUsersCount(),
        ];

        return new JsonResponse($stats);
    }

    /**
     * Get online users count
     */
    protected function getOnlineUsersCount(): int
    {
        // Consider users online if they were active in the last 5 minutes
        return DB::table('user_sessions')
            ->where('last_activity', '>=', now()->subMinutes(5))
            ->count();
    }

    /**
     * Get user activity log
     */
    public function getActivityLog(Request $request): Response
    {
        $user = Auth::user();
        $isAdmin = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->whereIn('roles.name', ['Super Admin', 'Admin'])
            ->exists();

        if (!$isAdmin) {
            abort(403, 'Unauthorized');
        }

        $perPage = $request->get('per_page', 15);
        $activities = DB::table('audit_logs')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return Inertia::render('Dashboard/ActivityLog', [
            'activities' => $activities,
        ]);
    }
}
