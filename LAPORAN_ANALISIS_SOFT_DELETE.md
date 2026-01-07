# Laporan Analisis Komprehensif: Pengaruh Soft Delete ke Data Terkait

## Ringkasan Eksekutif

Analisis ini mengevaluasi pengaruh soft delete pada model `Product` dan `ProductVariant` dalam aplikasi StockTrackApp. Hasil pengujian menunjukkan adanya **inkonsistensi antara soft delete dan cascade delete** yang dapat menyebabkan kehilangan data secara permanen jika tidak ditangani dengan benar.

---

## 1. Analisis Relasi Antara Product dan ProductVariant

### 1.1 Relasi di Level Model Laravel

**File: [`app/Models/Product.php`](app/Models/Product.php:69-72)**
```php
public function variants(): HasMany
{
    return $this->hasMany(ProductVariant::class, 'product_id');
}
```

**File: [`app/Models/ProductVariant.php`](app/Models/ProductVariant.php:63-66)**
```php
public function product(): BelongsTo
{
    return $this->belongsTo(Product::class, 'product_id');
}
```

**Observasi:**
- Relasi didefinisikan tanpa parameter `onDelete` di level Laravel
- Tidak ada event listener untuk menangani soft delete secara otomatis
- Kedua model menggunakan trait `SoftDeletes`

### 1.2 Konfigurasi Cascade Delete di Database

**File: [`database/migrations/2026_01_06_074801_create_product_variants_table.php`](database/migrations/2026_01_06_074801_create_product_variants_table.php:22-26)**
```php
$table->foreign('product_id')
      ->references('id')
      ->on('products')
      ->onDelete('cascade');
```

**Observasi:**
- Foreign key constraint dengan `onDelete('cascade')` didefinisikan di level database
- Ini akan menghapus semua varian secara permanen jika produk dihapus secara permanen (hard delete)

---

## 2. Hasil Pengujian Soft Delete

### 2.1 Skenario 1: Soft Delete Produk

**Setup:**
- Produk: 1 dengan 3 varian
- Semua data dalam kondisi aktif

**Hasil Pengujian:**

| Status | Produk | Varian 1 | Varian 2 | Varian 3 |
|--------|--------|----------|----------|----------|
| **Sebelum Soft Delete** | Aktif | Aktif | Aktif | Aktif |
| **Setelah Soft Delete** | ❌ Soft Deleted | ✅ Aktif | ✅ Aktif | ✅ Aktif |
| **Setelah Restore** | ✅ Aktif | ✅ Aktif | ✅ Aktif | ✅ Aktif |

**Kesimpulan:**
- ✅ Soft delete produk TIDAK mempengaruhi varian terkait
- ✅ Varian tetap aktif meskipun produk di-soft delete
- ✅ Restore produk TIDAK mengembalikan varian (karena varian tidak pernah di-soft delete)

### 2.2 Skenario 2: Hard Delete Produk (Permanent Delete)

**Setup:**
- Produk: 1 dengan 2 varian
- Semua data dalam kondisi aktif

**Hasil Pengujian:**

| Status | Produk | Varian 1 | Varian 2 |
|--------|--------|----------|----------|
| **Sebelum Hard Delete** | Aktif | Aktif | Aktif |
| **Setelah Hard Delete** | ❌ Permanen Deleted | ❌ Permanen Deleted | ❌ Permanen Deleted |

**Kesimpulan:**
- ⚠️ Cascade delete di database bekerja dengan benar
- ⚠️ Semua varian terkait dihapus secara permanen
- ⚠️ Data tidak dapat dipulihkan (tidak ada soft delete untuk varian)

---

## 3. Masalah Potensial yang Ditemukan

### 3.1 Masalah Utama: Inkonsistensi Soft Delete

**Deskripsi:**
Ketika produk di-soft delete, varian tetap aktif. Ini menciptakan inkonsistensi data di mana:
- Produk tidak terlihat di aplikasi (karena di-soft delete)
- Varian produk masih terlihat dan dapat diakses
- Ini dapat menyebabkan kebingungan bagi pengguna

**Dampak:**
- Pengguna mungkin melihat varian produk yang tidak memiliki produk induk
- Query yang menggabungkan produk dan varian dapat menghasilkan hasil yang tidak konsisten
- Laporan dan statistik mungkin tidak akurat

### 3.2 Masalah Kedua: Risiko Kehilangan Data

**Deskripsi:**
Jika ada tabel lain yang mereferensikan `ProductVariant`, cascade delete akan menghapus data tersebut secara permanen ketika produk di-hard delete.

**Dampak:**
- Kehilangan data historis
- Kehilangan relasi data yang mungkin diperlukan untuk audit trail
- Tidak dapat memulihkan data yang terhapus secara permanen

### 3.3 Masalah Ketiga: Tidak Ada Tabel Lain yang Mereferensikan

**Analisis:**
Berdasarkan pencarian di semua migration files, hanya tabel `product_variants` yang memiliki foreign key ke `products`.

**Status Saat Ini:**
- ✅ Tidak ada tabel lain yang mereferensikan `Product` atau `ProductVariant`
- ✅ Risiko cascade delete minimal saat ini

**Peringatan:**
- ⚠️ Jika di masa depan ada tabel baru yang mereferensikan `ProductVariant`, mereka akan terdampak oleh cascade delete
- ⚠️ Perlu dokumentasi yang jelas untuk pengembang di masa depan

---

## 4. Rekomendasi Perbaikan

### 4.1 Rekomendasi 1: Implementasikan Soft Delete Cascade di Level Laravel

**Prioritas:** TINGGI

**Solusi:**
Tambahkan event listener di model `Product` untuk soft delete varian secara otomatis:

```php
// app/Models/Product.php

protected static function boot()
{
    parent::boot();

    static::deleting(function ($product) {
        if ($product->isForceDeleting()) {
            // Hard delete - biarkan database cascade delete bekerja
            return;
        }

        // Soft delete - soft delete semua varian terkait
        $product->variants()->delete();
    });

    static::restoring(function ($product) {
        // Restore - restore semua varian terkait
        $product->variants()->withTrashed()->restore();
    });
}
```

**Keuntungan:**
- Konsistensi data terjaga
- Varian di-soft delete bersamaan dengan produk
- Restore produk akan otomatis restore varian

### 4.2 Rekomendasi 2: Hapus atau Modifikasi Cascade Delete di Database

**Prioritas:** SEDANG

**Opsi A: Hapus Cascade Delete**
```php
// Migration baru untuk menghapus cascade delete
Schema::table('product_variants', function (Blueprint $table) {
    $table->dropForeign(['product_id']);
    $table->foreign('product_id')
          ->references('id')
          ->on('products')
          ->onDelete('restrict'); // atau null
});
```

**Opsi B: Pertahankan Cascade Delete untuk Hard Delete**
- Pertahankan cascade delete untuk hard delete
- Tambahkan dokumentasi yang jelas
- Gunakan event listener untuk soft delete (seperti Rekomendasi 1)

**Keuntungan:**
- Mencegah kehilangan data yang tidak diinginkan
- Memberikan kontrol lebih besar atas perilaku delete

### 4.3 Rekomendasi 3: Tambahkan Validasi di Aplikasi

**Prioritas:** SEDANG

**Solusi:**
Tambahkan validasi untuk mencegah akses ke varian dari produk yang di-soft delete:

```php
// Di controller atau service layer
public function getVariants($productId)
{
    $product = Product::find($productId);

    if (!$product) {
        return response()->json(['error' => 'Produk tidak ditemukan'], 404);
    }

    return $product->variants;
}
```

**Keuntungan:**
- Mencegah akses ke varian dari produk yang di-soft delete
- Meningkatkan keamanan dan konsistensi data

### 4.4 Rekomendasi 4: Dokumentasi dan Testing

**Prioritas:** TINGGI

**Solusi:**
1. Buat dokumentasi teknis tentang perilaku soft delete
2. Tambahkan unit test untuk skenario soft delete dan restore
3. Tambahkan integration test untuk memverifikasi cascade delete

**Contoh Test:**
```php
// tests/Unit/ProductTest.php
public function test_soft_delete_product_also_soft_deletes_variants()
{
    $product = Product::factory()->create();
    $variants = ProductVariant::factory()->count(3)->create([
        'product_id' => $product->id
    ]);

    $product->delete();

    $this->assertSoftDeleted($product);
    foreach ($variants as $variant) {
        $this->assertSoftDeleted($variant);
    }
}
```

---

## 5. Dampak ke Tabel Lain

### 5.1 Status Saat Ini

**Tabel yang Mereferensikan Product:**
- ✅ `product_variants` - Hanya tabel yang mereferensikan `products`

**Tabel yang Mereferensikan ProductVariant:**
- ✅ Tidak ada

### 5.2 Dampak Potensial di Masa Depan

Jika ada tabel baru yang mereferensikan `ProductVariant`, misalnya:
- `order_items` - mereferensikan `product_variant_id`
- `inventory_logs` - mereferensikan `product_variant_id`
- `price_history` - mereferensikan `product_variant_id`

**Dampak Cascade Delete:**
- Semua data di tabel tersebut akan dihapus secara permanen ketika produk di-hard delete
- Data historis akan hilang
- Tidak dapat dipulihkan

**Rekomendasi:**
- Gunakan `onDelete('restrict')` atau `onDelete('set null')` untuk tabel yang menyimpan data historis
- Implementasikan soft delete untuk semua tabel yang mereferensikan `ProductVariant`
- Gunakan event listener untuk menangani delete secara manual

---

## 6. Kesimpulan

### 6.1 Temuan Utama

1. ✅ **Soft delete produk TIDAK mempengaruhi varian terkait**
   - Varian tetap aktif meskipun produk di-soft delete
   - Ini menciptakan inkonsistensi data

2. ✅ **Hard delete produk akan menghapus varian secara permanen**
   - Cascade delete di database bekerja dengan benar
   - Data tidak dapat dipulihkan

3. ✅ **Tidak ada tabel lain yang mereferensikan Product atau ProductVariant saat ini**
   - Risiko cascade delete minimal saat ini
   - Perlu dokumentasi untuk pengembang di masa depan

### 6.2 Prioritas Perbaikan

| Prioritas | Masalah | Solusi |
|-----------|--------|--------|
| **TINGGI** | Inkonsistensi soft delete | Implementasikan event listener untuk soft delete varian |
| **TINGGI** | Kurangnya dokumentasi | Buat dokumentasi teknis dan testing |
| **SEDANG** | Risiko cascade delete | Pertimbangkan menghapus cascade delete atau gunakan restrict |
| **SEDANG** | Validasi aplikasi | Tambahkan validasi untuk mencegah akses ke varian dari produk yang di-soft delete |

### 6.3 Rekomendasi Akhir

Untuk memastikan konsistensi data dan mencegah kehilangan data, disarankan untuk:

1. **Implementasikan event listener** di model `Product` untuk soft delete varian secara otomatis
2. **Pertahankan cascade delete** untuk hard delete, tetapi tambahkan dokumentasi yang jelas
3. **Tambahkan validasi** di aplikasi untuk mencegah akses ke varian dari produk yang di-soft delete
4. **Buat dokumentasi teknis** dan testing untuk memverifikasi perilaku soft delete
5. **Gunakan `onDelete('restrict')`** untuk tabel baru yang mereferensikan `ProductVariant` dan menyimpan data historis

---

## 7. Lampiran

### 7.1 File yang Dianalisis

1. [`app/Models/Product.php`](app/Models/Product.php) - Model Product dengan relasi variants()
2. [`app/Models/ProductVariant.php`](app/Models/ProductVariant.php) - Model ProductVariant dengan relasi product()
3. [`database/migrations/2026_01_06_074800_create_products_table.php`](database/migrations/2026_01_06_074800_create_products_table.php) - Migration tabel products
4. [`database/migrations/2026_01_06_074801_create_product_variants_table.php`](database/migrations/2026_01_06_074801_create_product_variants_table.php) - Migration tabel product_variants dengan cascade delete
5. [`database/migrations/2026_01_07_033358_add_soft_deletes_to_products_table.php`](database/migrations/2026_01_07_033358_add_soft_deletes_to_products_table.php) - Migration soft delete untuk products
6. [`database/migrations/2026_01_07_033425_add_soft_deletes_to_product_variants_table.php`](database/migrations/2026_01_07_033425_add_soft_deletes_to_product_variants_table.php) - Migration soft delete untuk product_variants

### 7.2 File Pengujian

1. `test_create_data.php` - Script untuk membuat data dummy untuk testing
2. `test_soft_delete.php` - Script untuk menguji perilaku soft delete
3. `test_hard_delete.php` - Script untuk menguji perilaku hard delete

### 7.3 Hasil Pengujian Lengkap

**Test Soft Delete:**
```
=== TESTING SOFT DELETE BEHAVIOR ===

1. PRODUK SEBELUM SOFT DELETE:
   ID: a5d3ad93-cdd7-4b93-8413-ebd9bcbe33c3
   Name: Test Product for Soft Delete
   SKU: TEST-001
   Deleted at: NULL
   Total Variants: 3

2. VARIAN SEBELUM SOFT DELETE PRODUK:
   - Variant ID: 43ecb8a3-ef07-404c-a88a-1b4d28577762
     Name: Variant 1
     SKU: TEST-001-V1
     Deleted at: NULL
   - Variant ID: 804645e2-d469-4208-8bc0-8725e838e0c4
     Name: Variant 2
     SKU: TEST-001-V2
     Deleted at: NULL
   - Variant ID: d9bb5632-dd00-4ed8-aa44-3a9c75ee00c0
     Name: Variant 3
     SKU: TEST-001-V3
     Deleted at: NULL

3. SETELAH SOFT DELETE PRODUK:
   Product Deleted at: 2026-01-07 04:09:24
   Total Variants (active only): 3
   Total Variants (with trashed): 3
   Total Variants (deleted): 0

4. STATUS VARIAN SETELAH PRODUK DI-SOFT DELETE:
   - Variant ID: 43ecb8a3-ef07-404c-a88a-1b4d28577762
     Name: Variant 1
     Deleted at: NULL
   - Variant ID: 804645e2-d469-4208-8bc0-8725e838e0c4
     Name: Variant 2
     Deleted at: NULL
   - Variant ID: d9bb5632-dd00-4ed8-aa44-3a9c75ee00c0
     Name: Variant 3
     Deleted at: NULL

5. SETELAH RESTORE PRODUK:
   Product Deleted at: NULL
   Total Variants (active): 3
   Total Variants (with trashed): 3
   Total Variants (deleted): 0

6. STATUS VARIAN SETELAH RESTORE:
   - Variant ID: 43ecb8a3-ef07-404c-a88a-1b4d28577762
     Name: Variant 1
     Deleted at: NULL
   - Variant ID: 804645e2-d469-4208-8bc0-8725e838e0c4
     Name: Variant 2
     Deleted at: NULL
   - Variant ID: d9bb5632-dd00-4ed8-aa44-3a9c75ee00c0
     Name: Variant 3
     Deleted at: NULL
```

**Test Hard Delete:**
```
=== TESTING HARD DELETE (PERMANENT DELETE) BEHAVIOR ===

1. Produk dibuat:
   ID: 1f28940e-9aff-4c1b-bf44-220b81374aa8
   Name: Test Product for Hard Delete
   SKU: TEST-HARD-001

2.1. Varian dibuat:
     ID: 5fc72857-c2f0-454d-969e-8c03983bdd7e
     Name: Hard Delete Variant 1
     SKU: TEST-HARD-001-V1

2.2. Varian dibuat:
     ID: 7a96677f-8495-4587-ba92-7d76d8d6cb49
     Name: Hard Delete Variant 2
     SKU: TEST-HARD-001-V2

3. Total varian sebelum hard delete: 2

4. Produk di-hard delete (permanent delete)

5. Produk masih ada (dengan withTrashed): TIDAK
6. Total varian setelah hard delete produk:
   - Varian aktif (tanpa withTrashed): 0
   - Varian total (dengan withTrashed): 0

7. Tidak ada varian yang tersisa (cascade delete bekerja)
```

---

**Dokumen ini dibuat pada:** 2026-01-07
**Versi:** 1.0
**Penulis:** Debug Analysis Team
