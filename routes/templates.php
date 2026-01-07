<?php

use App\Http\Controllers\Template\TemplateController;
use Illuminate\Support\Facades\Route;

// All template routes require authentication and email verification
Route::middleware(['auth', 'verified'])->group(function () {

    // ============================================
    // TEMPLATE ROUTES
    // ============================================

    // Template listing with pagination and filters
    Route::get('/templates', [TemplateController::class, 'index'])
        ->name('templates.index')
        ->middleware('permission:templates.view');

    // Create template form
    Route::get('/templates/create', [TemplateController::class, 'create'])
        ->name('templates.create')
        ->middleware('permission:templates.create');

    // Store new template
    Route::post('/templates', [TemplateController::class, 'store'])
        ->name('templates.store')
        ->middleware('permission:templates.create');

    // Show template details
    Route::get('/templates/{template}', [TemplateController::class, 'show'])
        ->name('templates.show')
        ->middleware('permission:templates.view');

    // Edit template form
    Route::get('/templates/{template}/edit', [TemplateController::class, 'edit'])
        ->name('templates.edit')
        ->middleware('permission:templates.update');

    // Update template
    Route::put('/templates/{template}', [TemplateController::class, 'update'])
        ->name('templates.update')
        ->middleware('permission:templates.update');

    // Delete template (soft delete)
    Route::delete('/templates/{template}', [TemplateController::class, 'destroy'])
        ->name('templates.destroy')
        ->middleware('permission:templates.delete');

    // Set template as active
    Route::post('/templates/{template}/set-active', [TemplateController::class, 'setActive'])
        ->name('templates.set-active')
        ->middleware('permission:templates.set_active');

    // Restore soft deleted template
    Route::post('/templates/{template}/restore', [TemplateController::class, 'restore'])
        ->name('templates.restore')
        ->middleware('permission:templates.restore');

    // Permanently delete template (force delete)
    Route::delete('/templates/{template}/force-delete', [TemplateController::class, 'forceDelete'])
        ->name('templates.force-delete')
        ->middleware('permission:templates.force_delete');
});
