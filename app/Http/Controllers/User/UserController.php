<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UserChangePasswordRequest;
use App\Http\Requests\User\UserCreateRequest;
use App\Http\Requests\User\UserProfileUpdateRequest;
use App\Http\Requests\User\UserUpdateRequest;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    protected UserServiceInterface $userService;

    public function __construct(UserServiceInterface $userService)
    {
        $this->userService = $userService;

        // Permission middleware
        $this->middleware('permission:users.index')->only(['index', 'search', 'stats']);
        $this->middleware('permission:users.create')->only(['create', 'store']);
        $this->middleware('permission:users.show')->only(['show']);

        // Custom permission middleware for edit operations
        $this->middleware('permission:users.edit')->only(['edit', 'update', 'updateProfile', 'changePassword']);
        $this->middleware('permission:users.delete')->only(['destroy']);
        $this->middleware('permission:users.toggle-status')->only(['toggleStatus']);
        $this->middleware('permission:users.suspend')->only(['suspend']);
        $this->middleware('permission:users.unsuspend')->only(['unsuspend']);
        $this->middleware('permission:users.assign-role')->only(['assignRole', 'removeRole']);
        $this->middleware('permission:users.export')->only(['export']);
    }

    /**
     * Check if user can perform action on target user
     * Admin can perform any action, regular users can only perform actions on themselves
     */
    private function canPerformAction(string $targetUserId): bool
    {
        $currentUser = Auth::user();

        // Admin can perform any action
        if ($this->userHasRole($currentUser, 'admin') || $this->userHasPermission($currentUser, 'users.manage')) {
            return true;
        }

        // Regular users can only perform actions on themselves
        return $currentUser->id === $targetUserId;
    }

    /**
     * Check if user has specific role
     */
    private function userHasRole($user, string $role): bool
    {
        return $user->roles()->where('name', $role)->exists();
    }

    /**
     * Check if user has specific permission
     */
    private function userHasPermission($user, string $permission): bool
    {
        return $user->permissions()->where('name', $permission)->exists() ||
               $user->roles()->whereHas('permissions', function ($query) use ($permission) {
                   $query->where('name', $permission);
               })->exists();
    }

    /**
     * Log user management actions for audit trail
     */
    private function logUserAction(string $action, string $targetUserId, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('User Management Action', [
            'action' => $action,
            'performed_by' => $currentUser->id,
            'performed_by_name' => $currentUser->name,
            'target_user_id' => $targetUserId,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get user statistics for dashboard and notifications
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            // Get user counts by status
            $activeCount = $this->userService->getUsersCountByStatus('active');
            $inactiveCount = $this->userService->getUsersCountByStatus('inactive');
            $suspendedCount = $this->userService->getUsersCountByStatus('suspended');

            // For demo purposes, we'll use suspended users as "pending"
            // In a real application, you might have a separate "pending" status
            $pendingCount = $suspendedCount;

            // Get total users
            $totalCount = $activeCount + $inactiveCount + $suspendedCount;

            $this->logUserAction('view_user_stats', 'all');

            return response()->json([
                'active' => $activeCount,
                'inactive' => $inactiveCount,
                'suspended' => $suspendedCount,
                'pending' => $pendingCount,
                'total' => $totalCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch user stats', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch user statistics',
            ], 500);
        }
    }

    /**
     * Display a listing of users
     */
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 15);
        $filters = $request->only(['search', 'per_page', 'role', 'status', 'sort', 'order', 'page']);

        // Add additional filtering if needed
        $users = $this->userService->getAllUsers($perPage, $filters);
        $roles = Role::all();

        // Get user statistics for meta data
        $meta = [
            'total' => $users->total(),
            'per_page' => $users->perPage(),
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'from' => $users->firstItem(),
            'to' => $users->lastItem(),
            'has_more_pages' => $users->hasMorePages(),
            'active_count' => $this->userService->getUsersCountByStatus('active'),
            'inactive_count' => $this->userService->getUsersCountByStatus('inactive'),
            'suspended_count' => $this->userService->getUsersCountByStatus('suspended'),
        ];

        $this->logUserAction('view_user_list', 'all', ['filters' => $filters]);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $filters,
            'meta' => $meta,
        ]);
    }

    /**
     * Search users
     */
    public function search(Request $request): Response
    {
        $query = $request->get('query', '');
        $perPage = $request->get('per_page', 15);
        $filters = $request->only(['query', 'per_page', 'role', 'status']);

        $users = $this->userService->searchUsers($query, $perPage, $filters);
        $roles = Role::all();

        $this->logUserAction('search_users', 'all', ['query' => $query, 'filters' => $filters]);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $filters,
        ]);
    }

    /**
     * Show form for creating a new user
     */
    public function create(): Response
    {
        $roles = Role::all();

        return Inertia::render('Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(UserCreateRequest $request)
    {
        try {
            $validatedData = $request->validated();
            $user = $this->userService->createUser($request);

            $this->logUserAction('create_user', $user->id, [
                'name' => $user->name,
                'email' => $user->email,
                'role_id' => $validatedData['role_id'] ?? null,
            ]);

            return redirect()->route('users.index')
                ->with('success', 'Pengguna berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Failed to create user', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menambahkan pengguna. Silakan coba lagi.')
                ->withInput();
        }
    }

    /**
     * Display specified user
     */
    public function show(string $id): Response
    {
        $user = $this->userService->findUserById($id);
        $roles = Role::all();

        if (!$user) {
            abort(404, 'Pengguna tidak ditemukan.');
        }

        // Check if user can view this profile
        if (!$this->canPerformAction($id)) {
            abort(403, 'Anda tidak memiliki izin untuk melihat profil pengguna ini.');
        }

        $this->logUserAction('view_user_profile', $id);

        return Inertia::render('Users/Show', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Show form for editing specified user
     */
    public function edit(string $id): Response
    {
        $user = $this->userService->findUserById($id);
        $roles = Role::all();

        if (!$user) {
            abort(404, 'Pengguna tidak ditemukan.');
        }

        // Check if user can edit this profile
        if (!$this->canPerformAction($id)) {
            abort(403, 'Anda tidak memiliki izin untuk mengedit profil pengguna ini.');
        }

        // Get user's current role for the form
        $userRoles = $user->roles;

        // Add status field to user object for the form
        $user->status = $user->is_active ? 'active' : 'inactive';

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
            'userRoles' => $userRoles,
        ]);
    }

    /**
     * Update specified user
     */
    public function update(UserUpdateRequest $request, string $id)
    {
        // Check if user can update this profile
        if (!$this->canPerformAction($id)) {
            abort(403, 'Anda tidak memiliki izin untuk memperbarui profil pengguna ini.');
        }

        try {
            $validatedData = $request->validated();
            $success = $this->userService->updateUser($id, $request);

            if ($success) {
                $this->logUserAction('update_user', $id, [
                    'updated_fields' => array_keys($validatedData),
                ]);

                return redirect()->route('users.index')
                    ->with('success', 'Pengguna berhasil diperbarui.');
            }

            return redirect()->back()
                ->with('error', 'Gagal memperbarui pengguna.')
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to update user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui pengguna. Silakan coba lagi.')
                ->withInput();
        }
    }

    /**
     * Remove specified user
     */
    public function destroy(string $id)
    {
        // Only admin can delete users
        $currentUser = Auth::user();
        if (!$this->userHasRole($currentUser, 'admin') && !$this->userHasPermission($currentUser, 'users.delete')) {
            abort(403, 'Anda tidak memiliki izin untuk menghapus pengguna.');
        }

        // Prevent deleting self
        if (Auth::id() === $id) {
            return redirect()->back()
                ->with('error', 'Tidak dapat menghapus akun sendiri.');
        }

        try {
            $user = $this->userService->findUserById($id);

            if (!$user) {
                return redirect()->back()
                    ->with('error', 'Pengguna tidak ditemukan.');
            }

            $success = $this->userService->deleteUser($id);

            if ($success) {
                $this->logUserAction('delete_user', $id, [
                    'deleted_user_name' => $user->name,
                    'deleted_user_email' => $user->email,
                ]);

                return redirect()->route('users.index')
                    ->with('success', 'Pengguna berhasil dihapus.');
            }

            return redirect()->back()
                ->with('error', 'Gagal menghapus pengguna.');
        } catch (\Exception $e) {
            Log::error('Failed to delete user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus pengguna. Silakan coba lagi.');
        }
    }

    /**
     * Toggle user active status
     */
    public function toggleStatus(Request $request, string $id)
    {
        // Only admin can toggle user status
        $currentUser = Auth::user();
        if (!$this->userHasRole($currentUser, 'admin') && !$this->userHasPermission($currentUser, 'users.toggle-status')) {
            abort(403, 'Anda tidak memiliki izin untuk mengubah status pengguna.');
        }

        // Prevent deactivating self
        if (Auth::id() === $id) {
            return redirect()->back()
                ->with('error', 'Tidak dapat mengubah status akun sendiri.');
        }

        try {
            $user = $this->userService->findUserById($id);

            if (!$user) {
                return redirect()->back()
                    ->with('error', 'Pengguna tidak ditemukan.');
            }

            // Get status from request or toggle current status
            $status = $request->input('status');
            if ($status === 'active' || $status === 'inactive' || $status === 'suspended') {
                $newStatus = $status === 'active';
            } else {
                // Toggle current status if no specific status provided
                $newStatus = !$user->is_active;
            }

            $success = $this->userService->toggleActiveStatus($id, $newStatus);

            if ($success) {
                $this->logUserAction('toggle_user_status', $id, [
                    'user_name' => $user->name,
                    'new_status' => $newStatus ? 'active' : 'inactive',
                ]);

                return redirect()->back()
                    ->with('success', 'Status pengguna berhasil diperbarui.');
            }

            return redirect()->back()
                ->with('error', 'Gagal memperbarui status pengguna.');
        } catch (\Exception $e) {
            Log::error('Failed to toggle user status', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui status pengguna. Silakan coba lagi.');
        }
    }

    /**
     * Suspend user
     */
    public function suspend(Request $request, string $id)
    {
        // Only admin can suspend users
        $currentUser = Auth::user();
        if (!$this->userHasRole($currentUser, 'admin') && !$this->userHasPermission($currentUser, 'users.suspend')) {
            abort(403, 'Anda tidak memiliki izin untuk menangguhkan pengguna.');
        }

        // Prevent suspending self
        if (Auth::id() === $id) {
            return redirect()->back()
                ->with('error', 'Tidak dapat menangguhkan akun sendiri.');
        }

        $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        try {
            $user = $this->userService->findUserById($id);

            if (!$user) {
                return redirect()->back()
                    ->with('error', 'Pengguna tidak ditemukan.');
            }

            $reason = $request->input('reason');
            $success = $this->userService->suspendUser($id, $reason);

            if ($success) {
                $this->logUserAction('suspend_user', $id, [
                    'user_name' => $user->name,
                    'reason' => $reason,
                ]);

                return redirect()->back()
                    ->with('success', 'Pengguna berhasil ditangguhkan.');
            }

            return redirect()->back()
                ->with('error', 'Gagal menangguhkan pengguna.');
        } catch (\Exception $e) {
            Log::error('Failed to suspend user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menangguhkan pengguna. Silakan coba lagi.');
        }
    }

    /**
     * Unsuspend user
     */
    public function unsuspend(string $id)
    {
        // Only admin can unsuspend users
        $currentUser = Auth::user();
        if (!$this->userHasRole($currentUser, 'admin') && !$this->userHasPermission($currentUser, 'users.unsuspend')) {
            abort(403, 'Anda tidak memiliki izin untuk mengaktifkan kembali pengguna.');
        }

        try {
            $user = $this->userService->findUserById($id);

            if (!$user) {
                return redirect()->back()
                    ->with('error', 'Pengguna tidak ditemukan.');
            }

            $success = $this->userService->unsuspendUser($id);

            if ($success) {
                $this->logUserAction('unsuspend_user', $id, [
                    'user_name' => $user->name,
                ]);

                return redirect()->back()
                    ->with('success', 'Pengguna berhasil diaktifkan kembali.');
            }

            return redirect()->back()
                ->with('error', 'Gagal mengaktifkan kembali pengguna.');
        } catch (\Exception $e) {
            Log::error('Failed to unsuspend user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal mengaktifkan kembali pengguna. Silakan coba lagi.');
        }
    }

    /**
     * Assign role to user
     */
    public function assignRole(Request $request, string $id)
    {
        // Only admin can assign roles
        $currentUser = Auth::user();
        if (!$this->userHasRole($currentUser, 'admin') && !$this->userHasPermission($currentUser, 'users.assign-role')) {
            abort(403, 'Anda tidak memiliki izin untuk menetapkan role ke pengguna.');
        }

        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        try {
            $user = $this->userService->findUserById($id);
            $role = Role::findById($request->role_id);

            if (!$user) {
                return redirect()->back()
                    ->with('error', 'Pengguna tidak ditemukan.');
            }

            $success = $this->userService->assignRole($id, $request->role_id);

            if ($success) {
                $this->logUserAction('assign_role', $id, [
                    'user_name' => $user->name,
                    'role_name' => $role->name,
                ]);

                return redirect()->back()
                    ->with('success', 'Role berhasil ditetapkan ke pengguna.');
            }

            return redirect()->back()
                ->with('error', 'Gagal menetapkan role ke pengguna.');
        } catch (\Exception $e) {
            Log::error('Failed to assign role to user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'role_id' => $request->role_id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menetapkan role ke pengguna. Silakan coba lagi.');
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile(UserProfileUpdateRequest $request, string $id)
    {
        // Check if user can update this profile
        if (!$this->canPerformAction($id)) {
            abort(403, 'Anda tidak memiliki izin untuk memperbarui profil pengguna ini.');
        }

        try {
            $validatedData = $request->validated();
            $success = $this->userService->updateProfile($id, $request);

            if ($success) {
                $this->logUserAction('update_user_profile', $id, [
                    'updated_fields' => array_keys($validatedData),
                ]);

                return redirect()->back()
                    ->with('success', 'Profil pengguna berhasil diperbarui.');
            }

            return redirect()->back()
                ->with('error', 'Gagal memperbarui profil pengguna.')
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to update user profile', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui profil pengguna. Silakan coba lagi.')
                ->withInput();
        }
    }

    /**
     * Show form for changing user password
     */
    public function password(string $id): Response
    {
        $user = $this->userService->findUserById($id);

        if (!$user) {
            abort(404, 'Pengguna tidak ditemukan.');
        }

        // Check if user can change this password
        if (!$this->canPerformAction($id)) {
            abort(403, 'Anda tidak memiliki izin untuk mengubah password pengguna ini.');
        }

        // Add status field to user object for the form
        $user->status = $user->is_active ? 'active' : 'inactive';

        return Inertia::render('Users/Password', [
            'user' => $user,
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(UserChangePasswordRequest $request, string $id)
    {
        // Check if user can change this password
        if (!$this->canPerformAction($id)) {
            abort(403, 'Anda tidak memiliki izin untuk mengubah password pengguna ini.');
        }

        try {
            $success = $this->userService->changePassword($id, $request);

            if ($success) {
                $this->logUserAction('change_user_password', $id);

                return redirect()->back()
                    ->with('success', 'Password pengguna berhasil diubah.');
            }

            return redirect()->back()
                ->with('error', 'Gagal mengubah password pengguna.')
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to change user password', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove role from user
     */
    public function removeRole(string $id, string $roleId = '')
    {
        // Only admin can remove roles
        $currentUser = Auth::user();
        if (!$this->userHasRole($currentUser, 'admin') && !$this->userHasPermission($currentUser, 'users.assign-role')) {
            abort(403, 'Anda tidak memiliki izin untuk menghapus role dari pengguna.');
        }

        try {
            $user = $this->userService->findUserById($id);

            if (!$user) {
                return redirect()->back()
                    ->with('error', 'Pengguna tidak ditemukan.');
            }

            $success = $this->userService->removeRole($id, $roleId);

            if ($success) {
                $this->logUserAction('remove_role', $id, [
                    'user_name' => $user->name,
                    'role_id' => $roleId,
                ]);

                return redirect()->back()
                    ->with('success', 'Role berhasil dihapus dari pengguna.');
            }

            return redirect()->back()
                ->with('error', 'Gagal menghapus role dari pengguna.');
        } catch (\Exception $e) {
            Log::error('Failed to remove role from user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'role_id' => $roleId,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menghapus role dari pengguna. Silakan coba lagi.');
        }
    }

    /**
     * Export users to CSV
     */
    public function export(Request $request)
    {
        // Only admin can export users
        $currentUser = Auth::user();
        if (!$this->userHasRole($currentUser, 'admin') && !$this->userHasPermission($currentUser, 'users.export')) {
            abort(403, 'Anda tidak memiliki izin untuk mengekspor data pengguna.');
        }

        try {
            $filters = $request->only(['search', 'role', 'status']);
            $users = $this->userService->getUsersForExport($filters);

            $filename = 'users_' . date('Y-m-d_H-i-s') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = function() use ($users) {
                $file = fopen('php://output', 'w');

                // Add CSV header
                fputcsv($file, ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login At']);

                // Add data rows
                foreach ($users as $user) {
                    fputcsv($file, [
                        $user->id,
                        $user->name,
                        $user->email,
                        $user->roles->pluck('name')->implode(', '),
                        $user->is_active ? 'Active' : 'Inactive',
                        $user->created_at->format('Y-m-d H:i:s'),
                        $user->last_login_at ? $user->last_login_at->format('Y-m-d H:i:s') : 'Never',
                    ]);
                }

                fclose($file);
            };

            $this->logUserAction('export_users', 'all', ['filters' => $filters]);

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Failed to export users', [
                'error' => $e->getMessage(),
                'filters' => $request->all(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal mengekspor data pengguna. Silakan coba lagi.');
        }
    }
}
