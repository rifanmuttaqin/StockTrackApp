<?php

use App\Http\Controllers\User\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::get('/users/search', [UserController::class, 'search'])->name('users.search');
    Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::patch('/users/{user}/profile', [UserController::class, 'updateProfile'])->name('users.profile.update');
    Route::patch('/users/{user}/password', [UserController::class, 'changePassword'])->name('users.password.change');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::patch('/users/{user}/status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::post('/users/{user}/roles', [UserController::class, 'assignRole'])->name('users.roles.assign');
    Route::delete('/users/{user}/roles', [UserController::class, 'removeRole'])->name('users.roles.remove');
});
