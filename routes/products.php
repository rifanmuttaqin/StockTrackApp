<?php

use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Product\ProductVariantController;
use Illuminate\Support\Facades\Route;

// All product and product variant routes require authentication and email verification
Route::middleware(['auth', 'verified'])->group(function () {

    // ============================================
    // PRODUCT ROUTES
    // ============================================

    // Product listing with pagination and filters
    Route::get('/products', [ProductController::class, 'index'])
        ->name('products.index')
        ->middleware('permission:products.view');

    // Create product form
    Route::get('/products/create', [ProductController::class, 'create'])
        ->name('products.create')
        ->middleware('permission:products.create');

    // Store new product
    Route::post('/products', [ProductController::class, 'store'])
        ->name('products.store')
        ->middleware('permission:products.create');

    // Show product details
    Route::get('/products/{product}', [ProductController::class, 'show'])
        ->name('products.show')
        ->middleware('permission:products.view');

    // Edit product form
    Route::get('/products/{product}/edit', [ProductController::class, 'edit'])
        ->name('products.edit')
        ->middleware('permission:products.update');

    // Update product
    Route::put('/products/{product}', [ProductController::class, 'update'])
        ->name('products.update')
        ->middleware('permission:products.update');

    // Delete product (soft delete)
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])
        ->name('products.destroy')
        ->middleware('permission:products.delete');

    // Restore soft deleted product
    Route::post('/products/{product}/restore', [ProductController::class, 'restore'])
        ->name('products.restore')
        ->middleware('permission:products.delete');

    // Permanently delete product (force delete)
    Route::delete('/products/{product}/force', [ProductController::class, 'forceDelete'])
        ->name('products.force')
        ->middleware('permission:products.delete');

    // ============================================
    // PRODUCT VARIANT ROUTES
    // ============================================

    // Product variant listing for a specific product
    Route::get('/products/{product}/variants', [ProductVariantController::class, 'index'])
        ->name('products.variants.index')
        ->middleware('permission:product_variants.view');

    // Create product variant form for a specific product
    Route::get('/products/{product}/variants/create', [ProductVariantController::class, 'create'])
        ->name('products.variants.create')
        ->middleware('permission:product_variants.create');

    // Store new product variant for a specific product
    Route::post('/products/{product}/variants', [ProductVariantController::class, 'store'])
        ->name('products.variants.store')
        ->middleware('permission:product_variants.create');

    // Show product variant details
    Route::get('/variants/{variant}', [ProductVariantController::class, 'show'])
        ->name('variants.show')
        ->middleware('permission:product_variants.view');

    // Edit product variant form
    Route::get('/variants/{variant}/edit', [ProductVariantController::class, 'edit'])
        ->name('variants.edit')
        ->middleware('permission:product_variants.edit');

    // Update product variant
    Route::put('/variants/{variant}', [ProductVariantController::class, 'update'])
        ->name('variants.update')
        ->middleware('permission:product_variants.edit');

    // Delete product variant
    Route::delete('/variants/{variant}', [ProductVariantController::class, 'destroy'])
        ->name('variants.destroy')
        ->middleware('permission:product_variants.delete');
});
