<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Report\AssetReportController;

Route::middleware(['auth', 'verified'])->group(function () {
    // Asset Report (nilai modal barang: harga beli x stok tersedia)
    Route::get('/reports/asset', [AssetReportController::class, 'index'])
        ->name('reports.asset.index')
        ->middleware('permission:view_reports');
});
