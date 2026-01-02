<?php

namespace App\Http\Controllers;

use App\Services\Contracts\UserServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $this->middleware('permission:users.index')->only(['index', 'search']);
        $this->middleware('permission:users.create')->only(['create', 'store']);
        $this->middleware('permission:users.show')->only(['show']);
        $this->middleware('permission:users.edit')->only(['edit', 'update']);
        $this->middleware('permission:users.delete')->only(['destroy']);
        $this->middleware('permission:users.toggle-status')->only(['toggleStatus']);
        $this->middleware('permission:users.assign-role')->only(['assignRole', 'removeRole']);
    }

    /**
     * Display a listing of users
     */
    public function index(Request $request): Response
    {
        $perPage = $request->get('per_page', 15);
        $users = $this->userService->getAllUsers($perPage);
        $roles = Role::all();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    /**
     * Search users
     */
    public function search(Request $request): Response
    {
        $query = $request->get('query', '');
        $perPage = $request->get('per_page', 15);

        $users = $this->userService->searchUsers($query, $perPage);
        $roles = Role::all();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['query', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new user
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
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
                'role_id' => 'required|exists:roles,id',
                'is_active' => 'boolean',
            ]);

            $user = $this->userService->createUser($data);

            return redirect()->route('users.index')
                ->with('success', 'Pengguna berhasil ditambahkan.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
        }
    }

    /**
     * Display the specified user
     */
    public function show(string $id): Response
    {
        $user = $this->userService->findUserById($id);
        $roles = Role::all();

        if (!$user) {
            abort(404, 'Pengguna tidak ditemukan.');
        }

        return Inertia::render('Users/Show', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for editing the specified user
     */
    public function edit(string $id): Response
    {
        $user = $this->userService->findUserById($id);
        $roles = Role::all();

        if (!$user) {
            abort(404, 'Pengguna tidak ditemukan.');
        }

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, string $id)
    {
        try {
            $data = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . $id,
                'password' => 'sometimes|string|min:8|confirmed',
                'role_id' => 'sometimes|exists:roles,id',
                'is_active' => 'sometimes|boolean',
            ]);

            $success = $this->userService->updateUser($id, $data);

            if ($success) {
                return redirect()->route('users.index')
                    ->with('success', 'Pengguna berhasil diperbarui.');
            }

            return redirect()->back()
                ->with('error', 'Gagal memperbarui pengguna.')
                ->withInput();
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
        }
    }

    /**
     * Remove the specified user
     */
    public function destroy(string $id)
    {
        // Prevent deleting self
        if (Auth::id() === $id) {
            return redirect()->back()
                ->with('error', 'Tidak dapat menghapus akun sendiri.');
        }

        $success = $this->userService->deleteUser($id);

        if ($success) {
            return redirect()->route('users.index')
                ->with('success', 'Pengguna berhasil dihapus.');
        }

        return redirect()->back()
            ->with('error', 'Gagal menghapus pengguna.');
    }

    /**
     * Toggle user active status
     */
    public function toggleStatus(string $id)
    {
        // Prevent deactivating self
        if (Auth::id() === $id) {
            return redirect()->back()
                ->with('error', 'Tidak dapat mengubah status akun sendiri.');
        }

        $success = $this->userService->toggleActiveStatus($id);

        if ($success) {
            return redirect()->back()
                ->with('success', 'Status pengguna berhasil diperbarui.');
        }

        return redirect()->back()
            ->with('error', 'Gagal memperbarui status pengguna.');
    }

    /**
     * Assign role to user
     */
    public function assignRole(Request $request, string $id)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        try {
            $success = $this->userService->assignRole($id, $request->role_id);

            if ($success) {
                return redirect()->back()
                    ->with('success', 'Role berhasil ditetapkan ke pengguna.');
            }

            return redirect()->back()
                ->with('error', 'Gagal menetapkan role ke pengguna.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Remove role from user
     */
    public function removeRole(string $id)
    {
        try {
            $success = $this->userService->removeRole($id, '');

            if ($success) {
                return redirect()->back()
                    ->with('success', 'Role berhasil dihapus dari pengguna.');
            }

            return redirect()->back()
                ->with('error', 'Gagal menghapus role dari pengguna.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', $e->getMessage());
        }
    }
}
