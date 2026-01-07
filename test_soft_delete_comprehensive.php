<?php

/**
 * Script Testing Komprehensif Soft Delete Produk
 *
 * Script ini melakukan testing lengkap fungsionalitas soft delete untuk produk dan varian
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=================================================\n";
echo "TESTING KOMPREHENSIF SOFT DELETE PRODUK\n";
echo "=================================================\n\n";

// ============================================
// TEST 1: Soft Delete Produk dengan Varian
// ============================================
echo "=================================================\n";
echo "TEST 1: SOFT DELETE PRODUK DENGAN VARIAN\n";
echo "=================================================\n\n";

$product = \App\Models\Product::with('variants')->has('variants')->first();

if (!$product) {
    echo "ERROR: Tidak ada produk dengan varian untuk testing\n";
    exit(1);
}

echo "--- SEBELUM SOFT DELETE ---\n";
echo "Product ID: {$product->id}\n";
echo "Product Name: {$product->name}\n";
echo "Product SKU: {$product->sku}\n";
echo "Product deleted_at: " . ($product->deleted_at ?? 'NULL') . "\n";
echo "Total Variants: {$product->variants->count()}\n";

echo "\nVariants Details:\n";
foreach ($product->variants as $variant) {
    echo "  - Variant ID: {$variant->id}\n";
    echo "    Name: {$variant->variant_name}\n";
    echo "    SKU: {$variant->sku}\n";
    echo "    deleted_at: " . ($variant->deleted_at ?? 'NULL') . "\n";
}

// Lakukan soft delete
echo "\n--- MELAKUKAN SOFT DELETE ---\n";
$product->delete();

echo "\n--- SETELAH SOFT DELETE ---\n";
echo "Product deleted_at: {$product->deleted_at}\n";

// Cek status varian setelah soft delete
$variantsAfter = \App\Models\ProductVariant::withTrashed()->where('product_id', $product->id)->get();
$variantsActive = \App\Models\ProductVariant::withTrashed()->where('product_id', $product->id)->whereNull('deleted_at')->get();
$variantsDeleted = \App\Models\ProductVariant::withTrashed()->where('product_id', $product->id)->whereNotNull('deleted_at')->get();

echo "\nStatus Variants:\n";
echo "  Total Variants (all): {$variantsAfter->count()}\n";
echo "  Total Variants (active): {$variantsActive->count()}\n";
echo "  Total Variants (deleted): {$variantsDeleted->count()}\n";

echo "\nVariants Details After Soft Delete:\n";
foreach ($variantsAfter as $variant) {
    echo "  - Variant ID: {$variant->id}\n";
    echo "    Name: {$variant->variant_name}\n";
    echo "    deleted_at: " . ($variant->deleted_at ?? 'NULL') . "\n";
}

// Simpan ID untuk testing berikutnya
$productId1 = $product->id;
echo "\nProduct ID untuk testing selanjutnya: {$productId1}\n";

// Validasi hasil
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

$productToRestore = \App\Models\Product::withTrashed()->find($productId1);

if (!$productToRestore) {
    echo "ERROR: Produk tidak ditemukan untuk restore\n";
    exit(1);
}

echo "--- SEBELUM RESTORE ---\n";
echo "Product ID: {$productToRestore->id}\n";
echo "Product Name: {$productToRestore->name}\n";
echo "Product deleted_at: {$productToRestore->deleted_at}\n";

// Cek varian sebelum restore
$variantsBeforeRestore = \App\Models\ProductVariant::withTrashed()->where('product_id', $productId1)->get();
$variantsActiveBefore = \App\Models\ProductVariant::withTrashed()->where('product_id', $productId1)->whereNull('deleted_at')->count();
$variantsDeletedBefore = \App\Models\ProductVariant::withTrashed()->where('product_id', $productId1)->whereNotNull('deleted_at')->count();

echo "\nStatus Variants Before Restore:\n";
echo "  Total Variants (all): {$variantsBeforeRestore->count()}\n";
echo "  Total Variants (active): {$variantsActiveBefore}\n";
echo "  Total Variants (deleted): {$variantsDeletedBefore}\n";

// Lakukan restore
echo "\n--- MELAKUKAN RESTORE ---\n";
$productToRestore->restore();

echo "\n--- SETELAH RESTORE ---\n";
echo "Product deleted_at: " . ($productToRestore->deleted_at ?? 'NULL') . "\n";

// Cek varian setelah restore
$variantsAfterRestore = \App\Models\ProductVariant::withTrashed()->where('product_id', $productId1)->get();
$variantsActiveAfter = \App\Models\ProductVariant::withTrashed()->where('product_id', $productId1)->whereNull('deleted_at')->count();
$variantsDeletedAfter = \App\Models\ProductVariant::withTrashed()->where('product_id', $productId1)->whereNotNull('deleted_at')->count();

echo "\nStatus Variants After Restore:\n";
echo "  Total Variants (all): {$variantsAfterRestore->count()}\n";
echo "  Total Variants (active): {$variantsActiveAfter}\n";
echo "  Total Variants (deleted): {$variantsDeletedAfter}\n";

echo "\nVariants Details After Restore:\n";
foreach ($variantsAfterRestore as $variant) {
    echo "  - Variant ID: {$variant->id}\n";
    echo "    Name: {$variant->variant_name}\n";
    echo "    deleted_at: " . ($variant->deleted_at ?? 'NULL') . "\n";
}

// Validasi hasil
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

// Soft delete dulu
$productToForceDelete = \App\Models\Product::with('variants')->has('variants')->first();
if (!$productToForceDelete) {
    echo "ERROR: Tidak ada produk lain dengan varian untuk testing force delete\n";
} else {
    $productId2 = $productToForceDelete->id;

    echo "--- SOFT DELETE DULU ---\n";
    echo "Product ID: {$productId2}\n";
    echo "Product Name: {$productToForceDelete->name}\n";
    $productToForceDelete->delete();
    echo "Product deleted_at: {$productToForceDelete->deleted_at}\n";

    // Cek varian setelah soft delete
    $variantsAfterSoftDelete = \App\Models\ProductVariant::withTrashed()->where('product_id', $productId2)->count();
    echo "Variants setelah soft delete: {$variantsAfterSoftDelete}\n";

    echo "\n--- MELAKUKAN FORCE DELETE ---\n";
    $productToForceDelete->forceDelete();

    // Cek apakah produk benar-benar dihapus
    $productAfterForceDelete = \App\Models\Product::withTrashed()->find($productId2);
    $variantsAfterForceDelete = \App\Models\ProductVariant::withTrashed()->where('product_id', $productId2)->count();

    echo "\n--- SETELAH FORCE DELETE ---\n";
    echo "Product exists: " . ($productAfterForceDelete ? "YA" : "TIDAK") . "\n";
    echo "Variants exists: {$variantsAfterForceDelete}\n";

    // Validasi hasil
    $test3Result = ($productAfterForceDelete === null) && ($variantsAfterForceDelete === 0);
    echo "\nHASIL TEST 3: " . ($test3Result ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
    echo "  - Product dihapus permanen: " . ($productAfterForceDelete === null ? "YA" : "TIDAK") . "\n";
    echo "  - Varian dihapus permanen: " . ($variantsAfterForceDelete === 0 ? "YA" : "TIDAK") . "\n";
}

// ============================================
// TEST 4: Edge Cases
// ============================================
echo "\n\n=================================================\n";
echo "TEST 4: EDGE CASES\n";
echo "=================================================\n\n";

// TEST 4a: Soft delete produk tanpa varian
echo "--- TEST 4a: Soft Delete Produk Tanpa Varian ---\n";
$productWithoutVariants = \App\Models\Product::doesntHave('variants')->first();
if ($productWithoutVariants) {
    $productWithoutVariantsId = $productWithoutVariants->id;
    echo "Product ID: {$productWithoutVariantsId}\n";
    echo "Product Name: {$productWithoutVariants->name}\n";
    echo "Variants count: {$productWithoutVariants->variants->count()}\n";

    $productWithoutVariants->delete();

    $productAfterDelete = \App\Models\Product::withTrashed()->find($productWithoutVariantsId);
    $test4aResult = ($productAfterDelete->deleted_at !== null);

    echo "Product deleted_at: {$productAfterDelete->deleted_at}\n";
    echo "HASIL TEST 4a: " . ($test4aResult ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
} else {
    echo "Tidak ada produk tanpa varian untuk testing\n";
    $test4aResult = null;
}

// TEST 4b: Double soft delete
echo "\n--- TEST 4b: Double Soft Delete ---\n";
if (isset($productId1)) {
    $productForDoubleDelete = \App\Models\Product::find($productId1);
    if ($productForDoubleDelete) {
        echo "Product ID: {$productId1}\n";
        echo "Product deleted_at: " . ($productForDoubleDelete->deleted_at ?? 'NULL') . "\n";

        // Coba soft delete lagi
        try {
            $productForDoubleDelete->delete();
            $productAfterDoubleDelete = \App\Models\Product::withTrashed()->find($productId1);

            echo "Product deleted_at setelah double delete: {$productAfterDoubleDelete->deleted_at}\n";
            $test4bResult = true; // Tidak error
            echo "HASIL TEST 4b: BERHASIL ✓ (Tidak error)\n";
        } catch (\Exception $e) {
            echo "Error: {$e->getMessage()}\n";
            $test4bResult = false;
            echo "HASIL TEST 4b: GAGAL ✗\n";
        }
    }
}

// ============================================
// RINGKASAN HASIL TESTING
// ============================================
echo "\n\n=================================================\n";
echo "RINGKASAN HASIL TESTING\n";
echo "=================================================\n\n";

echo "TEST 1 - Soft Delete dengan Varian: " . ($test1Result ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "TEST 2 - Restore Produk: " . ($test2Result ? "BERHASIL ✓" : "GAGAL ✗") . "\n";
echo "TEST 3 - Force Delete Produk: " . ($test3Result ?? "N/A") . "\n";
echo "TEST 4a - Soft Delete Tanpa Varian: " . ($test4aResult ?? "N/A") . "\n";
echo "TEST 4b - Double Soft Delete: " . ($test4bResult ?? "N/A") . "\n";

$allPassed = ($test1Result && $test2Result && $test3Result && $test4aResult && $test4bResult);

echo "\n" . ($allPassed ? "SEMUA TEST BERHASIL! ✓" : "BEBERAPA TEST GAGAL! ✗") . "\n";

echo "\n=================================================\n";
echo "SELESAI\n";
echo "=================================================\n";
