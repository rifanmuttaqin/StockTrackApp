<?php

/**
 * Script Testing Sederhana Soft Delete Produk
 */

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=================================================\n";
echo "TESTING SOFT DELETE PRODUK\n";
echo "=================================================\n\n";

// Bersihkan data lama
echo "Bersihkan data lama...\n";
\App\Models\Product::withTrashed()->forceDelete();
\App\Models\ProductVariant::withTrashed()->forceDelete();

// Buat data testing
echo "Membuat data testing...\n";
$product1 = \App\Models\Product::create([
    'name' => 'Laptop Gaming X1',
    'sku' => 'LAP-GAM-001',
    'description' => 'Laptop gaming'
]);
$variant1 = \App\Models\ProductVariant::create([
    'product_id' => $product1->id,
    'variant_name' => '16GB RAM',
    'sku' => 'LAP-GAM-001-16GB',
    'stock_current' => 10
]);
$variant2 = \App\Models\ProductVariant::create([
    'product_id' => $product1->id,
    'variant_name' => '32GB RAM',
    'sku' => 'LAP-GAM-001-32GB',
    'stock_current' => 5
]);

$product2 = \App\Models\Product::create([
    'name' => 'Smartphone Pro',
    'sku' => 'SM-PHO-002',
    'description' => 'Smartphone'
]);
$variant3 = \App\Models\ProductVariant::create([
    'product_id' => $product2->id,
    'variant_name' => '128GB',
    'sku' => 'SM-PHO-002-128GB',
    'stock_current' => 20
]);

$product3 = \App\Models\Product::create([
    'name' => 'Keyboard Mechanical',
    'sku' => 'KEY-MEC-003',
    'description' => 'Keyboard'
]);

echo "Data testing berhasil dibuat!\n\n";

// ============================================
// TEST 1: Soft Delete Produk dengan Varian
// ============================================
echo "=================================================\n";
echo "TEST 1: SOFT DELETE PRODUK DENGAN VARIAN\n";
echo "=================================================\n\n";

$product = \App\Models\Product::with('variants')->find($product1->id);
echo "SEBELUM SOFT DELETE:\n";
echo "  Product ID: {$product->id}\n";
echo "  Product Name: {$product->name}\n";
echo "  Product deleted_at: " . ($product->deleted_at ?? 'NULL') . "\n";
echo "  Total Variants: {$product->variants->count()}\n";
foreach ($product->variants as $variant) {
    echo "    - {$variant->variant_name} (deleted_at: " . ($variant->deleted_at ?? 'NULL') . ")\n";
}

// Soft delete
$product->delete();

echo "\nSETELAH SOFT DELETE:\n";
echo "  Product deleted_at: {$product->deleted_at}\n";

$variantsAfter = \App\Models\ProductVariant::withTrashed()->where('product_id', $product->id)->get();
$variantsActive = \App\Models\ProductVariant::withTrashed()->where('product_id', $product->id)->whereNull('deleted_at')->get();
$variantsDeleted = \App\Models\ProductVariant::withTrashed()->where('product_id', $product->id)->whereNotNull('deleted_at')->get();

echo "  Total Variants (all): {$variantsAfter->count()}\n";
echo "  Total Variants (active): {$variantsActive->count()}\n";
echo "  Total Variants (deleted): {$variantsDeleted->count()}\n";

foreach ($variantsAfter as $variant) {
    echo "    - {$variant->variant_name} (deleted_at: " . ($variant->deleted_at ?? 'NULL') . ")\n";
}

$test1Result = ($product->deleted_at !== null) && ($variantsDeleted->count() === $variantsAfter->count());
echo "\nHASIL TEST 1: " . ($test1Result ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "  - Product di-soft delete: " . ($product->deleted_at !== null ? "YA" : "TIDAK") . "\n";
echo "  - Semua varian di-soft delete: " . ($variantsDeleted->count() === $variantsAfter->count() ? "YA" : "TIDAK") . "\n";

// ============================================
// TEST 2: Restore Produk
// ============================================
echo "\n\n=================================================\n";
echo "TEST 2: RESTORE PRODUK\n";
echo "=================================================\n\n";

$productToRestore = \App\Models\Product::withTrashed()->find($product1->id);
echo "SEBELUM RESTORE:\n";
echo "  Product deleted_at: {$productToRestore->deleted_at}\n";

$variantsBeforeRestore = \App\Models\ProductVariant::withTrashed()->where('product_id', $product1->id)->get();
$variantsActiveBefore = \App\Models\ProductVariant::withTrashed()->where('product_id', $product1->id)->whereNull('deleted_at')->count();
$variantsDeletedBefore = \App\Models\ProductVariant::withTrashed()->where('product_id', $product1->id)->whereNotNull('deleted_at')->count();

echo "  Variants (active): {$variantsActiveBefore}\n";
echo "  Variants (deleted): {$variantsDeletedBefore}\n";

// Restore
$productToRestore->restore();

echo "\nSETELAH RESTORE:\n";
echo "  Product deleted_at: " . ($productToRestore->deleted_at ?? 'NULL') . "\n";

$variantsAfterRestore = \App\Models\ProductVariant::withTrashed()->where('product_id', $product1->id)->get();
$variantsActiveAfter = \App\Models\ProductVariant::withTrashed()->where('product_id', $product1->id)->whereNull('deleted_at')->count();
$variantsDeletedAfter = \App\Models\ProductVariant::withTrashed()->where('product_id', $product1->id)->whereNotNull('deleted_at')->count();

echo "  Variants (active): {$variantsActiveAfter}\n";
echo "  Variants (deleted): {$variantsDeletedAfter}\n";

$test2Result = ($productToRestore->deleted_at === null) && ($variantsActiveAfter === $variantsAfterRestore->count());
echo "\nHASIL TEST 2: " . ($test2Result ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "  - Product di-restore: " . ($productToRestore->deleted_at === null ? "YA" : "TIDAK") . "\n";
echo "  - Semua varian di-restore: " . ($variantsActiveAfter === $variantsAfterRestore->count() ? "YA" : "TIDAK") . "\n";

// ============================================
// TEST 3: Force Delete Produk
// ============================================
echo "\n\n=================================================\n";
echo "TEST 3: FORCE DELETE PRODUK\n";
echo "=================================================\n\n";

$productToForceDelete = \App\Models\Product::find($product2->id);
echo "SOFT DELETE DULU:\n";
echo "  Product ID: {$productToForceDelete->id}\n";
echo "  Product Name: {$productToForceDelete->name}\n";

$productToForceDelete->delete();
echo "  Product deleted_at: {$productToForceDelete->deleted_at}\n";

$variantsAfterSoftDelete = \App\Models\ProductVariant::withTrashed()->where('product_id', $product2->id)->count();
echo "  Variants setelah soft delete: {$variantsAfterSoftDelete}\n";

echo "\nFORCE DELETE:\n";
$productToForceDelete->forceDelete();

$productAfterForceDelete = \App\Models\Product::withTrashed()->find($product2->id);
$variantsAfterForceDelete = \App\Models\ProductVariant::withTrashed()->where('product_id', $product2->id)->count();

echo "  Product exists: " . ($productAfterForceDelete ? "YA" : "TIDAK") . "\n";
echo "  Variants exists: {$variantsAfterForceDelete}\n";

$test3Result = ($productAfterForceDelete === null) && ($variantsAfterForceDelete === 0);
echo "\nHASIL TEST 3: " . ($test3Result ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "  - Product dihapus permanen: " . ($productAfterForceDelete === null ? "YA" : "TIDAK") . "\n";
echo "  - Varian dihapus permanen: " . ($variantsAfterForceDelete === 0 ? "YA" : "TIDAK") . "\n";

// ============================================
// TEST 4a: Soft Delete Produk Tanpa Varian
// ============================================
echo "\n\n=================================================\n";
echo "TEST 4a: SOFT DELETE PRODUK TANPA VARIAN\n";
echo "=================================================\n\n";

$productWithoutVariants = \App\Models\Product::find($product3->id);
echo "SEBELUM SOFT DELETE:\n";
echo "  Product ID: {$productWithoutVariants->id}\n";
echo "  Product Name: {$productWithoutVariants->name}\n";
echo "  Variants count: {$productWithoutVariants->variants->count()}\n";

$productWithoutVariants->delete();

$productAfterDelete = \App\Models\Product::withTrashed()->find($product3->id);
echo "\nSETELAH SOFT DELETE:\n";
echo "  Product deleted_at: {$productAfterDelete->deleted_at}\n";

$test4aResult = ($productAfterDelete->deleted_at !== null);
echo "\nHASIL TEST 4a: " . ($test4aResult ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "  - Product di-soft delete: " . ($productAfterDelete->deleted_at !== null ? "YA" : "TIDAK") . "\n";

// ============================================
// TEST 4b: Double Soft Delete
// ============================================
echo "\n\n=================================================\n";
echo "TEST 4b: DOUBLE SOFT DELETE\n";
echo "=================================================\n\n";

$productForDoubleDelete = \App\Models\Product::find($product1->id);
echo "SEBELUM DOUBLE DELETE:\n";
echo "  Product deleted_at: " . ($productForDoubleDelete->deleted_at ?? 'NULL') . "\n";

try {
    $productForDoubleDelete->delete();
    $productAfterDoubleDelete = \App\Models\Product::withTrashed()->find($product1->id);

    echo "\nSETELAH DOUBLE DELETE:\n";
    echo "  Product deleted_at: {$productAfterDoubleDelete->deleted_at}\n";

    $test4bResult = true;
    echo "\nHASIL TEST 4b: BERHASIL ✓ (Tidak error)\n";
} catch (\Exception $e) {
    echo "\nError: {$e->getMessage()}\n";
    $test4bResult = false;
    echo "\nHASIL TEST 4b: GAGAL ✗\n";
}

// ============================================
// RINGKASAN
// ============================================
echo "\n\n=================================================\n";
echo "RINGKASAN HASIL TESTING\n";
echo "=================================================\n\n";

echo "TEST 1 - Soft Delete dengan Varian: " . ($test1Result ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "TEST 2 - Restore Produk: " . ($test2Result ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "TEST 3 - Force Delete Produk: " . ($test3Result ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "TEST 4a - Soft Delete Tanpa Varian: " . ($test4aResult ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "TEST 4b - Double Soft Delete: " . ($test4bResult ? "BERHASIL ✓" : "GAGAL ✗") . "\n";

$allPassed = $test1Result && $test2Result && $test3Result && $test4aResult && $test4bResult;

echo "\n" . ($allPassed ? "SEMUA TEST BERHASIL! ✓" : "BEBERAPA TEST GAGAL! ✗") . "\n";

echo "\n=================================================\n";
echo "SELESAI\n";
echo "=================================================\n";
