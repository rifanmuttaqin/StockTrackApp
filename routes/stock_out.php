<?php

use App\Http\Controllers\StockOut\StockOutController;
use Illuminate\Support\Facades\Route;

// All stock out routes require authentication and email verification
Route::middleware(['auth', 'verified'])->group(function () {

    // ============================================
    // STOCK OUT ROUTES
    // ============================================

    // Stock out listing with pagination and filters
    Route::get('/stock-out', [StockOutController::class, 'index'])
        ->name('stock-out.index')
        ->middleware('permission:stock_out.view');

    // Create stock out form
    Route::get('/stock-out/create', [StockOutController::class, 'create'])
        ->name('stock-out.create')
        ->middleware('permission:stock_out.create');

    // Store new stock out (save as draft)
    Route::post('/stock-out', [StockOutController::class, 'store'])
        ->name('stock-out.store')
        ->middleware('permission:stock_out.create');

    // Show stock out details
    Route::get('/stock-out/{stockOut}', [StockOutController::class, 'show'])
        ->name('stock-out.show')
        ->middleware('permission:stock_out.view');

    // Edit stock out form
    Route::get('/stock-out/{stockOut}/edit', [StockOutController::class, 'edit'])
        ->name('stock-out.edit')
        ->middleware('permission:stock_out.edit');

    // Update stock out (update draft)
    Route::put('/stock-out/{stockOut}', [StockOutController::class, 'update'])
        ->name('stock-out.update')
        ->middleware('permission:stock_out.edit');

    // Delete stock out (delete draft)
    Route::delete('/stock-out/{stockOut}', [StockOutController::class, 'destroy'])
        ->name('stock-out.destroy')
        ->middleware('permission:stock_out.delete');

    // Submit stock out (reduce stock)
    Route::post('/stock-out/{stockOut}/submit', [StockOutController::class, 'submit'])
        ->name('stock-out.submit')
        ->middleware('permission:stock_out.submit');
});
