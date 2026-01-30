<?php

use App\Http\Controllers\StockIn\StockInController;
use App\Http\Controllers\StockIn\StockInReportController;
use Illuminate\Support\Facades\Route;

// All stock in routes require authentication and email verification
Route::middleware(['auth', 'verified'])->group(function () {

    // ============================================
    // STOCK IN ROUTES
    // ============================================

    // Stock in listing with pagination and filters
    Route::get('/stock-in', [StockInController::class, 'index'])
        ->name('stock-in.index')
        ->middleware('permission:stock_in.view');

    // Create stock in form
    Route::get('/stock-in/create', [StockInController::class, 'create'])
        ->name('stock-in.create')
        ->middleware('permission:stock_in.create');

    // Store new stock in (save as draft)
    Route::post('/stock-in', [StockInController::class, 'store'])
        ->name('stock-in.store')
        ->middleware('permission:stock_in.create');

    // Show stock in details
    Route::get('/stock-in/{stockIn}', [StockInController::class, 'show'])
        ->name('stock-in.show')
        ->middleware('permission:stock_in.view');

    // Edit stock in form
    Route::get('/stock-in/{stockIn}/edit', [StockInController::class, 'edit'])
        ->name('stock-in.edit')
        ->middleware('permission:stock_in.edit');

    // Update stock in (update draft)
    Route::put('/stock-in/{stockIn}', [StockInController::class, 'update'])
        ->name('stock-in.update')
        ->middleware('permission:stock_in.update');

    // Delete stock in (delete draft)
    Route::delete('/stock-in/{stockIn}', [StockInController::class, 'destroy'])
        ->name('stock-in.destroy')
        ->middleware('permission:stock_in.delete');

    // Submit stock in (add stock)
    Route::post('/stock-in/{stockIn}/submit', [StockInController::class, 'submit'])
        ->name('stock-in.submit')
        ->middleware('permission:stock_in.submit');

    // Update stock in note (quick note update)
    Route::put('/stock-in/{stockIn}/note', [StockInController::class, 'updateNote'])
        ->name('stock-in.updateNote')
        ->middleware('permission:stock_in.update');

    // ============================================
    // STOCK IN REPORT ROUTES
    // ============================================

    // Stock in report view
    Route::get('/reports/stock-in', [StockInReportController::class, 'index'])
        ->name('stock-in-report.index')
        ->middleware('permission:view_reports');
});
