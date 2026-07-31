<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StockOpname\StockOpnameController;
use App\Http\Controllers\StockOpname\StockOpnameReportController;

Route::middleware(['auth', 'verified'])->group(function () {
    // Reports & Export
    Route::get('/reports/stock-opname', [StockOpnameReportController::class, 'index'])
        ->name('reports.stock-opname.index')
        ->middleware('permission:view_reports');

    Route::get('/reports/stock-opname/export', [StockOpnameReportController::class, 'export'])
        ->name('reports.stock-opname.export')
        ->middleware('permission:export_reports');

    // Stock Opname Resources
    Route::get('/stock-opname', [StockOpnameController::class, 'index'])
        ->name('stock-opname.index')
        ->middleware('permission:stock_opname.view');

    Route::get('/stock-opname/create', [StockOpnameController::class, 'create'])
        ->name('stock-opname.create')
        ->middleware('permission:stock_opname.create');

    Route::post('/stock-opname', [StockOpnameController::class, 'store'])
        ->name('stock-opname.store')
        ->middleware('permission:stock_opname.create');

    Route::get('/stock-opname/{stock_opname}', [StockOpnameController::class, 'show'])
        ->name('stock-opname.show')
        ->middleware('permission:stock_opname.view');

    Route::get('/stock-opname/{stock_opname}/edit', [StockOpnameController::class, 'edit'])
        ->name('stock-opname.edit')
        ->middleware('permission:stock_opname.edit');

    Route::put('/stock-opname/{stock_opname}', [StockOpnameController::class, 'update'])
        ->name('stock-opname.update')
        ->middleware('permission:stock_opname.update');

    Route::delete('/stock-opname/{stock_opname}', [StockOpnameController::class, 'destroy'])
        ->name('stock-opname.destroy')
        ->middleware('permission:stock_opname.delete');

    // Throttled Submit Endpoint (max 5 req/min)
    Route::post('/stock-opname/{stock_opname}/submit', [StockOpnameController::class, 'submit'])
        ->name('stock-opname.submit')
        ->middleware(['permission:stock_opname.submit', 'throttle:5,1']);

    // Update note (only draft allowed)
    Route::put('/stock-opname/{stock_opname}/note', [StockOpnameController::class, 'updateNote'])
        ->name('stock-opname.update-note')
        ->middleware('permission:stock_opname.update');
});
