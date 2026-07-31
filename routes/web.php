<?php

use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Dashboard\DashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Notification routes
    Route::get('/notifications', [\App\Http\Controllers\Notification\NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread', [\App\Http\Controllers\Notification\NotificationController::class, 'getUnread'])->name('notifications.unread');
    Route::get('/notifications/unread-count', [\App\Http\Controllers\Notification\NotificationController::class, 'getUnreadCount'])->name('notifications.unread-count');
    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\Notification\NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('/notifications/read-all', [\App\Http\Controllers\Notification\NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // Stock threshold routes
    Route::patch('/product-variants/{variant}/threshold', [\App\Http\Controllers\Product\StockThresholdController::class, 'update'])->name('product-variants.threshold.update');
    Route::patch('/product-variants/threshold/bulk', [\App\Http\Controllers\Product\StockThresholdController::class, 'bulkUpdate'])->name('product-variants.threshold.bulk-update');
});

require __DIR__.'/user/users.php';
require __DIR__.'/products.php';
require __DIR__.'/templates.php';
require __DIR__.'/stock_out.php';
require __DIR__.'/stock_in.php';
require __DIR__.'/stock_opname.php';
require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
