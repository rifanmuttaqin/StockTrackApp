<?php

use App\Http\Controllers\Unit\UnitController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {

    // ============================================
    // UNIT API ROUTES (JSON)
    // ============================================

    Route::get('/api/units/base-units', [UnitController::class, 'getBaseUnits'])
        ->name('api.units.base-units')
        ->middleware('permission:units.view');

    Route::get('/api/units/{unit}/conversions', [UnitController::class, 'getConversions'])
        ->name('api.units.conversions')
        ->middleware('permission:units.view');

    Route::post('/api/units/bulk-assign', [UnitController::class, 'bulkAssignUnits'])
        ->name('api.units.bulk-assign')
        ->middleware('permission:products.update');

    // ============================================
    // UNIT WEB ROUTES (Inertia pages)
    // ============================================

    Route::get('/units', [UnitController::class, 'index'])
        ->name('units.index')
        ->middleware('permission:units.view');

    Route::get('/units/create', [UnitController::class, 'create'])
        ->name('units.create')
        ->middleware('permission:units.create');

    Route::post('/units', [UnitController::class, 'store'])
        ->name('units.store')
        ->middleware('permission:units.create');

    Route::get('/units/{unit}', [UnitController::class, 'show'])
        ->name('units.show')
        ->middleware('permission:units.view');

    Route::get('/units/{unit}/edit', [UnitController::class, 'edit'])
        ->name('units.edit')
        ->middleware('permission:units.update');

    Route::put('/units/{unit}', [UnitController::class, 'update'])
        ->name('units.update')
        ->middleware('permission:units.update');

    Route::delete('/units/{unit}', [UnitController::class, 'destroy'])
        ->name('units.destroy')
        ->middleware('permission:units.delete');

    Route::post('/units/{unit}/restore', [UnitController::class, 'restore'])
        ->name('units.restore')
        ->middleware('permission:units.delete');
});
