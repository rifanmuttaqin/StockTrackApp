<?php

use App\Http\Controllers\User\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // User statistics API endpoint
    Route::get('/api/users/stats', [UserController::class, 'stats'])
        ->name('users.stats')
        ->middleware('permission:users.index');

    // User listing with pagination and filters
    Route::get('/users', [UserController::class, 'index'])
        ->name('users.index')
        ->middleware('permission:users.index');

    // Search users (alternative to index with search query)
    Route::get('/users/search', [UserController::class, 'search'])
        ->name('users.search')
        ->middleware('permission:users.index');

    // Create user form
    Route::get('/users/create', [UserController::class, 'create'])
        ->name('users.create')
        ->middleware('permission:users.create');

    // Store new user
    Route::post('/users', [UserController::class, 'store'])
        ->name('users.store')
        ->middleware('permission:users.create');

    // Show user details
    Route::get('/users/{user}', [UserController::class, 'show'])
        ->name('users.show')
        ->middleware('permission:users.show');

    // Edit user form
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])
        ->name('users.edit')
        ->middleware('permission:users.edit');

    // Update user
    Route::put('/users/{user}', [UserController::class, 'update'])
        ->name('users.update')
        ->middleware('permission:users.edit');

    // Update user profile (alternative to update)
    Route::patch('/users/{user}/profile', [UserController::class, 'updateProfile'])
        ->name('users.update-profile')
        ->middleware('permission:users.edit');

    // Show user password change form
    Route::get('/users/{user}/password', [UserController::class, 'password'])
        ->name('users.password')
        ->middleware('permission:users.edit');

    // Change user password
    Route::patch('/users/{user}/password', [UserController::class, 'changePassword'])
        ->name('users.change-password')
        ->middleware('permission:users.edit');

    // Toggle user status (activate/deactivate)
    Route::patch('/users/{user}/status', [UserController::class, 'toggleStatus'])
        ->name('users.toggle-status')
        ->middleware('permission:users.toggle-status');

    // Suspend user
    Route::post('/users/{user}/suspend', [UserController::class, 'suspend'])
        ->name('users.suspend')
        ->middleware('permission:users.suspend');

    // Unsuspend user
    Route::post('/users/{user}/unsuspend', [UserController::class, 'unsuspend'])
        ->name('users.unsuspend')
        ->middleware('permission:users.unsuspend');

    // Delete user
    Route::delete('/users/{user}', [UserController::class, 'destroy'])
        ->name('users.destroy')
        ->middleware('permission:users.delete');

    // Assign role to user
    Route::post('/users/{user}/roles', [UserController::class, 'assignRole'])
        ->name('users.assign-role')
        ->middleware('permission:users.assign-role');

    // Remove role from user
    Route::delete('/users/{user}/roles', [UserController::class, 'removeRole'])
        ->name('users.remove-role')
        ->middleware('permission:users.assign-role');

    // Export users
    Route::get('/users/export', [UserController::class, 'export'])
        ->name('users.export')
        ->middleware('permission:users.export');
});
