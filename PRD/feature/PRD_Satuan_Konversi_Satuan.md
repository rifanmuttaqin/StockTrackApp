# PRD: Satuan & Konversi Satuan Produk - StockTrackApp

## 1. Ringkasan Singkat

**Deskripsi Singkat:**
Fitur ini menambahkan kemampuan pengelolaan satuan (unit of measure) dan konversi satuan pada master produk. Saat ini, seluruh data stok pada sistem hanya menyimpan angka integer tanpa konteks satuan, dan frontend menampilkan hardcoded "unit" sebagai suffix. Fitur ini memungkinkan pengguna mendefinisikan satuan dasar dan satuan konversi di master satuan (misal: 1 Karton = 10 Pcs), kemudian setiap produk varian hanya perlu memilih satuan dasar. Konversi otomatis ditarik dari master satuan, sehingga tidak perlu mengatur konversi berulang per varian.

**Status:** Draft
**Prioritas:** Tinggi
**Tanggal:** 2026-08-25
**Author:** AI Agent

---

## 2. Tujuan & Latar Belakang

### 2.1 Latar Belakang
Saat ini master produk tidak memiliki konsep satuan dan konversi satuan. Field `stock_current` pada tabel `product_variants` adalah integer polos tanpa asosiasi satuan. Frontend menampilkan hardcoded string "unit" sebagai suffix (misal: `150 unit`) di seluruh halaman produk dan laporan.

Akibatnya:
- Pengguna hanya bisa melihat stok dalam satuan dasar (pcs)
- Tidak ada cara untuk melihat stok dalam satuan lain (karton, box, dus, dll)
- Laporan stok tidak fleksibel untuk kebutuhan bisnis yang memerlukan pelaporan dalam satuan konversi

### 2.2 Tujuan Bisnis
- Memungkinkan pengguna mendefinisikan satuan dasar dan satuan konversi secara global di master satuan
- Produk varian hanya perlu memilih satuan dasar, konversi otomatis tersedia dari master
- Menampilkan stok saat ini pada tabel produk dalam satuan dasar DAN satuan konversi
- Menampilkan laporan stok (stock in, stock out, stock opname) dengan opsi satuan konversi
- Menyiapkan fondasi untuk adaptasi sistem konversi satuan pada fitur stock masuk di masa depan

### 2.3 Ruang Lingkup MVP
- Master data satuan dengan 2 tipe: **Satuan Dasar** dan **Satuan Konversi** (dengan multiplier ke satuan dasar)
- **Backfill otomatis:** Semua produk varian existing otomatis di-assign ke satuan dasar "Pcs" saat migrasi
- Produk varian memilih satuan dasar dari master
- Bulk-assign satuan dasar ke banyak varian sekaligus
- Tampilan stok saat ini pada tabel produk dengan satuan dasar + konversi otomatis
- Tampilan laporan stok dengan opsi satuan konversi
- Audit log untuk perubahan multiplier
- **Out of scope:** Adaptasi konversi satuan pada input stock masuk/keluar (akan diimplementasikan setelah MVP)
- **Out of scope:** Snapshot konversi historis pada transaksi (lihat bagian 5.7)

---

## 3. Stakeholder

| Peran | Tanggung Jawab |
|-------|----------------|
| Product Owner | Menentukan prioritas dan scope fitur |
| Developer Backend | Implementasi model, migrasi, controller, service, repository |
| Developer Frontend | Implementasi komponen UI untuk satuan, konversi, dan laporan |
| QA | Uji fitur sebelum rilis |
| Operator Gudang | Pengguna akhir yang akan menggunakan satuan dan konversi saat input stok |
| Supervisor | Memantau laporan stok dengan satuan konversi |

---

## 4. Deskripsi Fitur

### 4.1 Alur Utama (Main Flow)

#### 4.1.1 Manajemen Master Satuan
1. Admin mengakses menu **Master Satuan** (submenu di bawah Master Data)
2. Admin dapat melihat daftar semua satuan yang sudah dibuat (terpisah antara Satuan Dasar dan Satuan Konversi via tab)
3. Admin klik **Tambah Satuan**
4. Sistem menampilkan pilihan tipe satuan:
   - **Satuan Dasar** — satuan pokok yang digunakan untuk menyimpan stok (contoh: Pcs, Kg, Liter)
   - **Satuan Konversi** — satuan turunan yang dikonversi ke satuan dasar (contoh: Karton, Box, Lusin)
5. Jika memilih **Satuan Dasar**, admin mengisi:
   - Nama Satuan (wajib, contoh: "Pcs")
   - Singkatan (wajib, contoh: "pcs")
   - Deskripsi (opsional)
6. Jika memilih **Satuan Konversi**, admin mengisi:
   - Nama Satuan (wajib, contoh: "Karton")
   - Singkatan (wajib, contoh: "ktg")
   - Satuan Dasar Tujuan (wajib, dropdown dari daftar satuan dasar, contoh: "Pcs")
   - Nilai Konversi / Multiplier (wajib, contoh: 10, artinya 1 Karton = 10 Pcs)
   - Konversi Utama (opsional, checkbox — jika dicentang, konversi ini yang ditampilkan di badge stok tabel produk)
   - Deskripsi (opsional)
7. Admin menyimpan → satuan tersimpan ke database, sistem mencatat audit log
8. Admin dapat mengedit dan menghapus (soft delete) satuan

#### 4.1.2 Pengaturan Satuan Dasar pada Produk Varian (Satuan per Satuan)
1. Admin mengakses form **Tambah/Edit Produk**
2. Pada setiap varian produk, terdapat dropdown **Satuan Dasar** yang menampilkan daftar satuan bertipe "Satuan Dasar" dari master
3. Admin memilih satuan dasar untuk varian (contoh: "Pcs")
4. Saat disimpan, `unit_id` tersimpan pada record `product_variants`
5. Konversi yang tersedia untuk varian tersebut otomatis mengikuti satuan dasar yang dipilih — semua satuan konversi yang mengacu ke satuan dasar tersebut akan tersedia

#### 4.1.3 Bulk-Assign Satuan Dasar ke Banyak Varian
1. Admin mengakses halaman **Master Produk**
2. Admin mengklik tombol **Atur Satuan** (bulk action)
3. Sistem menampilkan daftar semua varian yang belum memiliki satuan dasar (`unit_id` = null)
4. Admin memilih satuan dasar dari dropdown (satu untuk semua, atau per-varian)
5. Admin menyimpan → sistem memperbarui `unit_id` untuk semua varian yang dipilih secara batch
6. Endpoint: `POST /products/bulk-assign-units` dengan payload `{ assignments: [{ variant_id, unit_id }, ...] }`
7. **Overwrite behavior:** Bulk-assign hanya berlaku untuk varian yang `unit_id`-nya masih null. Jika payload mengandung `variant_id` yang sudah memiliki `unit_id`, sistem mengabaikan entry tersebut (tidak menimpa) dan mengembalikan daftar varian yang di-skip di response
8. **Payload limit:** Maksimal 500 item per request. Jika payload melebihi limit, sistem mengembalikan error 422 dengan pesan "Maksimal 500 varian per request"

#### 4.1.4 Tampilan Stok Saat Ini pada Tabel Produk
1. User mengakses halaman **Master Produk**
2. Pada kolom **Stok Saat Ini**, selain menampilkan stok dalam satuan dasar, juga menampilkan konversi utama dari master:
   - Contoh: `150 pcs (15 karton)`
3. Konversi utama ditentukan oleh field `is_primary = true` pada tabel `units` (tipe conversion). Jika tidak ada konversi yang ditandai primary, gunakan konversi pertama berdasarkan `created_at`
4. Pada detail varian (expand row), tampilkan semua konversi yang tersedia:
   - `150 pcs`
   - `15 karton`
   - `6.25 box`

#### 4.1.5 Tampilan Laporan Stok dengan Satuan Konversi
1. User mengakses halaman **Laporan Stok** (Stock In / Stock Out / Stock Opname)
2. Terdapat toggle/dropdown **Tampilkan dalam Satuan** di bagian filter laporan
3. Dropdown menampilkan satuan dasar varian yang dilaporkan + semua satuan konversi yang terkait
4. User dapat memilih:
   - **Satuan Dasar** (default) — menampilkan seperti saat ini
   - **Satuan Konversi** — menampilkan stok dalam satuan konversi yang dipilih
5. Saat satuan konversi dipilih, seluruh angka pada laporan dikonversi menggunakan multiplier dari master:
   - Contoh: Stok 150 pcs → jika dipilih "Karton (1:10)" → tampilkan "15 karton"
6. Header kolom pada laporan berubah sesuai satuan yang dipilih
7. Laporan menampilkan catatan: *"Konversi menggunakan rate yang berlaku saat ini. Rate dapat berubah jika admin memperbarui multiplier."*

### 4.2 Sub-Flow / Edge Case

- **Jika satuan dasar belum diatur pada varian:** Tampilkan stok seperti saat ini (tanpa satuan atau dengan "unit" sebagai fallback). Setelah backfill, skenario ini sangat jarang — hanya terjadi pada varian baru yang dibuat sebelum admin memilih satuan
- **Jika satuan dasar varian tidak memiliki satuan konversi:** Tampilkan hanya satuan dasar, dropdown konversi pada laporan tidak menampilkan opsi konversi
- **Jika satuan dasar yang akan dihapus masih digunakan oleh varian:** Sistem menolak penghapusan dan menampilkan pesan error beserta jumlah varian yang menggunakannya
- **Jika satuan dasar yang akan dihapus masih dirujuk oleh satuan konversi:** Sistem menolak penghapusan dan menampilkan pesan error beserta daftar satuan konversi yang merujuk
- **Jika satuan konversi yang akan dihapus:** Sistem menampilkan konfirmasi dengan informasi dampak — berapa banyak varian yang satuan dasarnya memiliki konversi ini, dan bahwa tampilan "150 pcs (15 karton)" akan hilang dari tabel produk. Admin harus mengonfirmasi sebelum penghapusan
- **Jika nilai konversi adalah desimal:** Nilai konversi menggunakan decimal(10,2), hasil konversi dibulatkan 2 angka desimal
- **Jika stok 0:** Tetap tampilkan "0 {satuan dasar}" dan "0 {satuan konversi}"
- **Jika stok negatif (misal dari stock opname):** Tetap lakukan konversi, tampilkan nilai negatif
- **Jika dua admin mengedit multiplier secara bersamaan:** Sistem menggunakan optimistic locking via `updated_at`. Jika `updated_at` berubah antara saat data dibaca dan saat update dikirim, sistem mengembalikan error 409 Conflict dengan pesan "Data telah diubah oleh pengguna lain, silakan refresh dan coba lagi"

### 4.3 UI/UX

#### Halaman yang Terlibat:
1. **Master Satuan (baru)** — Halaman CRUD satuan dengan pilihan tipe (Dasar / Konversi)
2. **Products/Index.jsx** — Tombol bulk-assign satuan + perubahan tampilan kolom stok
3. **Products/Create.jsx** — Penambahan dropdown satuan dasar per varian
4. **Products/Edit.jsx** — Penambahan dropdown satuan dasar per varian
5. **Products/Show.jsx** — Penambahan info satuan dan daftar konversi pada detail varian
6. **Reports/StockIn/Index.jsx** — Penambahan filter satuan konversi
7. **Reports/StockOut/Index.jsx** — Penambahan filter satuan konversi
8. **Reports/StockOpname/Index.jsx** — Penambahan filter satuan konversi
9. **Dashboard.jsx** — Update tooltip chart dari hardcoded "unit" ke satuan dinamis

#### Elemen Penting:
- **Radio/Toggle Tipe Satuan:** Saat tambah satuan, pilih "Satuan Dasar" atau "Satuan Konversi"
- **Dropdown Satuan Dasar Tujuan:** Muncul saat tipe "Satuan Konversi" dipilih, menampilkan daftar satuan dasar
- **Input Multiplier:** Nilai konversi (contoh: 10 untuk 1 Karton = 10 Pcs)
- **Checkbox Konversi Utama:** Menandai konversi sebagai primary (ditampilkan di badge stok tabel produk)
- **Dropdown Satuan Dasar (di form varian):** Select component dengan data satuan dasar dari master
- **Badge Stok dengan Satuan:** `{stok} {satuan_singkatan} ({konversi_utama} {satuan_konversi_singkatan})`
- **Toggle Satuan pada Laporan:** Dropdown/radio untuk memilih satuan tampilan laporan
- **Catatan Konversi pada Laporan:** Teks kecil di bawah laporan yang menjelaskan bahwa rate konversi bersifat dinamis

#### Wireframe Form Tambah Satuan:
```
┌─────────────────────────────────────────────┐
│ Tambah Satuan                                │
├─────────────────────────────────────────────┤
│                                              │
│ Tipe Satuan:                                 │
│ ○ Satuan Dasar    ● Satuan Konversi          │
│                                              │
│ Nama Satuan:  [ Karton                ]      │
│ Singkatan:    [ ktg                   ]      │
│                                              │
│ ── Konfigurasi Konversi ──────────────────   │
│                                              │
│ Satuan Dasar Tujuan: [ Pcs ▾ ]              │
│ Nilai Konversi:      [ 10    ]              │
│ 1 Karton = 10 Pcs                           │
│                                              │
│ [✓] Jadikan Konversi Utama                   │
│ (Ditampilkan di badge stok tabel produk)     │
│                                              │
│ Deskripsi: [ Opsional                 ]      │
│                                              │
│ [Batal]                          [Simpan]    │
└─────────────────────────────────────────────┘
```

---

## 5. Behavior & Logika Bisnis

### 5.1 Validasi Input Master Satuan
- **Tipe Satuan:** wajib, enum: `base` (Satuan Dasar) atau `conversion` (Satuan Konversi)
- **Nama Satuan:** wajib, maksimal 50 karakter, unik secara global di antara record aktif (case-insensitive, "Pcs" dan "pcs" dianggap sama). Implementasi: partial unique index `LOWER(name) WHERE deleted_at IS NULL` di database + validasi ILIKE di application layer. Nama unit yang di-soft-delete bisa digunakan kembali oleh unit baru
- **Singkatan:** wajib, maksimal 10 karakter, unik secara global di antara record aktif (case-insensitive). Implementasi: partial unique index `LOWER(abbreviation) WHERE deleted_at IS NULL` di database + validasi ILIKE di application layer
- **Base Unit ID (hanya tipe konversi):** wajib jika tipe = `conversion`, harus merujuk ke satuan bertipe `base`, tidak boleh merujuk ke diri sendiri
- **Multiplier (hanya tipe konversi):** wajib jika tipe = `conversion`, decimal(10,2), minimal 0.01
- **Is Primary (hanya tipe konversi):** boolean, default false. Hanya boleh ada 1 konversi primary per base unit (unique partial index di DB sebagai safety net)
- **Logika swap is_primary:** Saat admin menandai konversi baru sebagai primary, service layer harus menjalankan transaksi: (1) unset `is_primary = false` pada semua konversi lain yang memiliki `base_unit_id` sama, lalu (2) set `is_primary = true` pada konversi yang dipilih. Kedua operasi harus dalam satu DB transaction. Partial unique index di DB berfungsi sebagai safety net — jika terjadi race condition, DB akan reject insert kedua
- **Saat mengedit multiplier:** Sistem melakukan optimistic locking check — jika `updated_at` berubah antara read dan write, return 409 Conflict

### 5.2 Validasi Input Produk Varian
- **Unit ID:** nullable (untuk backward compatibility), jika diisi harus merujuk ke satuan bertipe `base`

### 5.3 Kalkulasi Konversi
```
stok_dalam_satuan_konversi = stok_current / multiplier
```
- Contoh: `stok_current = 150`, `multiplier = 10` → `150 / 10 = 15 karton`
- Pembulatan: 2 angka desimal (menggunakan `round($value, 2)`)
- Jika hasil konversi adalah bilangan bulat, tampilkan tanpa desimal (contoh: `15 karton`, bukan `15.00 karton`)

### 5.4 Logika Pengambilan Konversi untuk Varian
```
1. Ambil unit_id dari varian produk
2. Query semua satuan konversi yang base_unit_id = unit_id varian
   - Eager loading: Unit::with('conversions')->whereIn('id', $unitIds)->get()
   - Cache hasil query (lihat 5.8)
3. Untuk setiap konversi, hitung: converted_stock = stock_current / multiplier
4. Tampilkan bersama satuan dasar
```

### 5.5 Integrasi dengan Modul Lain
- **ProductRepository:** Method `getAllProducts` dan `findProductById` harus me-load relasi `unit` untuk setiap varian, kemudian query satuan konversi berdasarkan `unit_id`. Eager loading pattern: `Product::with(['variants.baseUnit', 'variants.baseUnit.conversions'])`
- **ProductRepository transform:** Mapping data varian harus menyertakan `unit_name`, `unit_abbreviation`, dan array `conversions` (diambil dari master satuan)
- **StockInReportController:** Data laporan harus menyertakan info satuan varian dan daftar konversi yang tersedia dari master
- **StockOutReportController:** Data laporan harus menyertakan info satuan varian dan daftar konversi yang tersedia dari master
- **StockOpnameReportController:** Data laporan harus menyertakan info satuan varian dan daftar konversi yang tersedia dari master
- **DashboardController:** Tooltip chart harus menggunakan satuan dinamis dari data varian

### 5.6 Backward Compatibility & Data Migration Strategy
- **Backfill otomatis saat deploy:** Saat migrasi dijalankan, sistem otomatis membuat satuan dasar "Pcs" (jika belum ada) dan meng-assign semua produk varian existing yang `unit_id`-nya null ke satuan "Pcs". Ini dilakukan dalam satu migrasi yang sama dengan penambahan kolom `unit_id`
- **Alasan memilih "Pcs" sebagai default:** Asumsi bahwa sebagian besar stok existing dihitung dalam satuan satuan (pieces). Admin dapat mengubah satuan dasar per varian setelah deploy jika ada yang bukan "Pcs"
- **Field `unit_id` tetap nullable** untuk menjaga kompatibilitas dengan skenario edge (misal: varian baru yang dibuat sebelum admin memilih satuan, atau data dari integrasi eksternal)
- **Fallback "unit":** Jika `unit_id` null (skenario sangat jarang setelah backfill), sistem tetap menggunakan fallback "unit" sebagai satuan display
- **Dampak perubahan response API:** Field baru `unit` dan `conversions` ditambahkan ke response `GET /products` dan `GET /products/{product}`. Field ini bersifat **additive** (tidak menghapus atau mengubah field existing), sehingga konsumen API yang ada tidak akan terganggu. Konsumen yang tidak memproses field baru dapat mengabaikannya tanpa error

### 5.7 Catatan Integritas Historis Laporan
Konversi dihitung **on-the-fly** dari multiplier yang berlaku saat query, bukan disimpan sebagai snapshot di transaksi. Konsekuensi:
- Jika admin mengubah multiplier "Karton" dari 10 jadi 12, laporan bulan lalu yang dibuka ulang akan menampilkan angka berbeda
- **Untuk MVP, ini adalah batasan yang didokumentasikan.** Laporan menampilkan catatan: *"Konversi menggunakan rate yang berlaku saat ini"*
- **Audit log** mencatat setiap perubahan multiplier (siapa, kapan, nilai lama → nilai baru) sehingga admin dapat menelusuri perubahan
- **Rencana post-MVP:** Implementasi snapshot konversi di level transaksi (menyimpan `conversion_rate` dan `conversion_unit_id` pada setiap item transaksi stock in/out/opname)

### 5.8 Caching Strategy
Units adalah reference data yang jarang berubah tapi di-query di hampir semua halaman (produk, 3 laporan, dashboard).

- **Cache key pattern:** `units:all`, `units:base`, `units:conversions:{base_unit_id}`
- **Cache driver:** Menggunakan default cache driver aplikasi (Redis, file, atau database). Tidak menggunakan cache tags karena tidak didukung oleh semua driver
- **Cache TTL:** 24 jam (reference data)
- **Cache invalidation:** Menggunakan `Cache::forget()` per key saat ada create/update/delete unit. Tidak menggunakan `Cache::tags()` karena tidak kompatibel dengan file cache driver
- **Implementation pattern:**
  ```php
  // Di UnitRepository — penulisan cache (tanpa tag, kompatibel semua driver)
  public function getBaseUnits(): Collection
  {
      return Cache::remember('units:base', 86400, function () {
          return Unit::where('type', 'base')
              ->whereNull('deleted_at')
              ->orderBy('name')
              ->get();
      });
  }

  public function getConversionsForBaseUnit(string $baseUnitId): Collection
  {
      return Cache::remember("units:conversions:{$baseUnitId}", 86400, function () use ($baseUnitId) {
          return Unit::where('type', 'conversion')
              ->where('base_unit_id', $baseUnitId)
              ->whereNull('deleted_at')
              ->orderBy('is_primary', 'desc')
              ->orderBy('created_at')
              ->get();
      });
  }

  // Di UnitService — invalidation (Cache::forget per key, bukan tags)
  private function invalidateUnitCache(?string $baseUnitId = null): void
  {
      Cache::forget('units:all');
      Cache::forget('units:base');
      if ($baseUnitId) {
          Cache::forget("units:conversions:{$baseUnitId}");
      }
  }
  ```

### 5.9 Soft Delete & Audit Trail
- **Soft delete untuk Unit:** Tabel `units` menggunakan `SoftDeletes` (sama seperti `products` dan `product_variants`). Unit yang di-soft-delete tidak muncul di dropdown, tapi data historis tetap konsisten karena FK `unit_id` pada `product_variants` tetap merujuk ke record yang ada
- **Audit trail:** Setiap perubahan pada unit (create, update multiplier, delete) dicatat ke log dengan format:
  ```
  Log::info('Unit Management Action', [
      'action' => 'update_multiplier',
      'unit_id' => $unit->id,
      'unit_name' => $unit->name,
      'old_multiplier' => $oldMultiplier,
      'new_multiplier' => $newMultiplier,
      'performed_by' => Auth::id(),
      'performed_by_name' => Auth::user()->name,
      'timestamp' => now()->toISOString(),
  ]);
  ```
- **Menampilkan dampak sebelum hapus:** Saat admin akan menghapus satuan konversi, sistem query jumlah varian yang satuan dasarnya memiliki konversi tersebut dan menampilkan: *"Konversi ini digunakan oleh X varian. Menghapusnya akan menghilangkan tampilan konversi dari tabel produk."*

---

## 6. Integrasi & API

### 6.1 Endpoint Baru

#### Master Satuan (Unit)
| Method | Endpoint | Deskripsi | Auth | Permission |
|--------|----------|-----------|------|------------|
| GET | `/units` | Daftar semua satuan (filter: tipe=base/conversion, include soft-deleted) | Required | `units.view` |
| GET | `/units/create` | Form tambah satuan | Required | `units.create` |
| POST | `/units` | Simpan satuan baru | Required | `units.create` |
| GET | `/units/{unit}` | Detail satuan | Required | `units.view` |
| GET | `/units/{unit}/edit` | Form edit satuan | Required | `units.update` |
| PUT | `/units/{unit}` | Update satuan (dengan optimistic locking) | Required | `units.update` |
| DELETE | `/units/{unit}` | Hapus satuan (soft delete) | Required | `units.delete` |
| POST | `/units/{unit}/restore` | Restore satuan yang di-soft-delete | Required | `units.delete` |
| GET | `/api/units/base` | API: Daftar satuan dasar aktif (untuk dropdown, cached) | Required | `units.view` |
| GET | `/api/units/conversions/{baseUnit}` | API: Daftar konversi untuk satu satuan dasar (cached) | Required | `units.view` |

#### Bulk-Assign Satuan
| Method | Endpoint | Deskripsi | Auth | Permission |
|--------|----------|-----------|------|------------|
| POST | `/products/bulk-assign-units` | Bulk assign satuan dasar ke banyak varian | Required | `products.update` |

### 6.2 Endpoint yang Terpengaruh

| Endpoint | Perubahan |
|----------|-----------|
| `GET /products` | Response varian menyertakan `unit` (object), `conversions` (array) — field additive, tidak mengubah field existing |
| `GET /products/{product}` | Response varian menyertakan `unit` (object), `conversions` (array) — field additive |
| `POST /products` | Validasi dan penyimpanan `unit_id` per varian |
| `PUT /products/{product}` | Validasi dan penyimpanan `unit_id` per varian |
| `GET /stock-in/report` | Response menyertakan info satuan dan daftar konversi dari master |
| `GET /stock-out/report` | Response menyertakan info satuan dan daftar konversi dari master |
| `GET /stock-out/report/export-json` | Export JSON menyertakan info satuan dan konversi |
| `GET /stock-opname/report` | Response menyertakan info satuan dan daftar konversi dari master |
| `GET /stock-opname/report/export` | Export CSV menyertakan kolom satuan |

### 6.3 Permission Model untuk Data Embedded
Data unit dan konversi yang di-embed di response `GET /products` dan laporan stok **tidak memerlukan permission `units.view` tambahan**. Data ini mengikuti permission dari parent resource:
- Jika user punya permission `products.view` → otomatis bisa melihat data unit di response produk
- Jika user punya permission laporan terkait → otomatis bisa melihat data unit di response laporan
- Permission `units.view` hanya diperlukan untuk mengakses halaman/endpoint Master Satuan secara langsung

---

## 7. Struktur Data

### 7.1 Model / Entity

#### Unit (Baru)
```php
Unit {
    id: uuid (PK)
    name: string(50) — contoh: "Pcs", "Karton", "Box"
    abbreviation: string(10) — contoh: "pcs", "ktg", "box"
    type: enum('base', 'conversion') — tipe satuan
    base_unit_id: uuid|null (FK → units, self-referencing) — hanya untuk tipe conversion
    multiplier: decimal(10,2)|null — hanya untuk tipe conversion, contoh: 10.00
    is_primary: boolean, default false — hanya untuk tipe conversion, menandai konversi utama
    description: text|null
    deleted_at: timestamp|null — soft delete
    created_at: timestamp
    updated_at: timestamp

    // Traits
    SoftDeletes

    // Relations
    belongsTo: Unit (baseUnit) — self-referencing, hanya untuk tipe conversion
    hasMany: Unit (conversions) — satuan konversi yang merujuk ke base unit ini
    hasMany: ProductVariant — varian yang menggunakan satuan ini sebagai satuan dasar

    // Scopes
    scope: base() — filter type = 'base'
    scope: conversion() — filter type = 'conversion'
    scope: active() — filter deleted_at IS NULL

    // Accessors
    getFullNameAttribute() — "1 Karton = 10 Pcs" (untuk tipe conversion)
    getVariantsCountAttribute() — jumlah varian yang menggunakan satuan ini (untuk konfirmasi hapus)
}
```

#### ProductVariant (Modifikasi)
```php
ProductVariant {
    // Field existing tetap sama
    id: uuid (PK)
    product_id: uuid (FK)
    variant_name: string(100)
    sku: string(50) unique
    stock_current: integer
    stock_threshold: integer|null
    deleted_at: timestamp|null
    created_at: timestamp
    updated_at: timestamp

    // Field baru
    unit_id: uuid|null (FK → units) — satuan dasar varian (hanya bisa diisi unit bertipe 'base')

    // Relations baru
    belongsTo: Unit (baseUnit)
}
```

### 7.2 Migration / Schema

#### Migration 1: Create Units Table
```sql
CREATE TABLE units (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'base',
    base_unit_id UUID NULL,
    multiplier DECIMAL(10,2) NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NULL,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    -- Self-referencing FK
    CONSTRAINT fk_units_base_unit
        FOREIGN KEY (base_unit_id)
        REFERENCES units(id)
        ON DELETE RESTRICT
);

-- Case-insensitive unique indexes, hanya berlaku untuk record aktif (soft-delete safe)
-- Record yang di-soft-delete tidak memblokir pembuatan nama/singkatan yang sama
CREATE UNIQUE INDEX uq_units_name_lower
    ON units (LOWER(name))
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_units_abbreviation_lower
    ON units (LOWER(abbreviation))
    WHERE deleted_at IS NULL;

-- Partial unique index: hanya 1 konversi primary per base unit (hanya record aktif)
CREATE UNIQUE INDEX uq_units_primary_per_base
    ON units (base_unit_id)
    WHERE is_primary = TRUE AND type = 'conversion' AND deleted_at IS NULL;

-- Indexes
CREATE INDEX idx_units_type ON units(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_units_base_unit_id ON units(base_unit_id);
CREATE INDEX idx_units_deleted_at ON units(deleted_at);
```

#### Migration 2: Add unit_id to Product Variants
```sql
ALTER TABLE product_variants
    ADD COLUMN unit_id UUID NULL;

ALTER TABLE product_variants
    ADD CONSTRAINT fk_product_variants_unit
    FOREIGN KEY (unit_id)
    REFERENCES units(id)
    ON DELETE SET NULL;

CREATE INDEX idx_product_variants_unit_id ON product_variants(unit_id);
```

#### Migration 3: Backfill Default Unit ke Semua Varian Existing
Migrasi ini dijalankan **setelah** Migration 1 (create units) dan Migration 2 (add unit_id). Tujuannya: memastikan semua varian existing langsung memiliki satuan dasar sehingga fitur satuan langsung aktif setelah deploy.

```php
// database/migrations/xxxx_xx_xx_backfill_default_unit_to_product_variants.php

public function up(): void
{
    // 1. Buat atau ambil satuan dasar "Pcs" (idempotent)
    $pcsUnit = DB::table('units')
        ->where('type', 'base')
        ->whereRaw('LOWER(name) = ?', ['pcs'])
        ->first();

    if (!$pcsUnit) {
        $pcsId = (string) Str::uuid();
        DB::table('units')->insert([
            'id' => $pcsId,
            'name' => 'Pcs',
            'abbreviation' => 'pcs',
            'type' => 'base',
            'description' => 'Satuan dasar default (pieces)',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    } else {
        $pcsId = $pcsUnit->id;
    }

    // 2. Backfill semua varian yang unit_id-nya masih null
    //    Menggunakan chunk untuk aman pada tabel besar
    $affected = DB::table('product_variants')
        ->whereNull('unit_id')
        ->whereNull('deleted_at')
        ->update(['unit_id' => $pcsId]);

    // 3. Log hasil backfill
    Log::info('Unit backfill completed', [
        'default_unit' => 'Pcs',
        'default_unit_id' => $pcsId,
        'variants_updated' => $affected,
    ]);
}

public function down(): void
{
    // Rollback: kosongkan unit_id pada semua varian yang di-assign ke Pcs
    $pcsUnit = DB::table('units')
        ->whereRaw('LOWER(name) = ?', ['pcs'])
        ->where('type', 'base')
        ->first();

    if ($pcsUnit) {
        DB::table('product_variants')
            ->where('unit_id', $pcsUnit->id)
            ->update(['unit_id' => null]);
    }
}
```

**Catatan teknis backfill:**
- Migrasi ini **idempotent** — aman dijalankan ulang. Jika varian sudah punya `unit_id`, tidak ditimpa
- Menggunakan `DB::table()` (query builder) bukan Eloquent, karena migrasi berjalan sebelum model tentu siap
- Menggunakan `chunk` implicit via `update()` pada query builder — PostgreSQL menangani ini secara efisien
- Hanya memproses varian yang `deleted_at IS NULL` (varian aktif). Varian yang di-soft-delete tidak di-backfill
- Jika satuan "Pcs" sudah ada (misal dari seeder yang dijalankan duluan), migrasi menggunakan yang sudah ada
- Rollback mengosongkan `unit_id` untuk varian yang di-assign ke Pcs, lalu seeder bisa di-rollback terpisah

### 7.3 Data Response Format

#### Produk dengan Satuan & Konversi (API Response)
```json
{
    "id": "uuid-product",
    "name": "Produk A",
    "sku": "PRD-001",
    "variants": [
        {
            "id": "uuid-variant",
            "name": "Varian A",
            "sku": "PRD-001-A",
            "stock_current": 150,
            "stock_threshold": 10,
            "unit": {
                "id": "uuid-unit-pcs",
                "name": "Pcs",
                "abbreviation": "pcs",
                "type": "base"
            },
            "conversions": [
                {
                    "id": "uuid-unit-ktg",
                    "name": "Karton",
                    "abbreviation": "ktg",
                    "multiplier": 10,
                    "is_primary": true,
                    "converted_stock": 15
                },
                {
                    "id": "uuid-unit-box",
                    "name": "Box",
                    "abbreviation": "box",
                    "multiplier": 24,
                    "is_primary": false,
                    "converted_stock": 6.25
                }
            ]
        }
    ]
}
```

#### Daftar Satuan (API Response)
```json
{
    "units": [
        {
            "id": "uuid-1",
            "name": "Pcs",
            "abbreviation": "pcs",
            "type": "base",
            "base_unit_id": null,
            "multiplier": null,
            "is_primary": false,
            "conversions_count": 2,
            "variants_count": 15
        },
        {
            "id": "uuid-2",
            "name": "Karton",
            "abbreviation": "ktg",
            "type": "conversion",
            "base_unit_id": "uuid-1",
            "multiplier": 10,
            "is_primary": true,
            "base_unit": {
                "id": "uuid-1",
                "name": "Pcs",
                "abbreviation": "pcs"
            },
            "full_name": "1 Karton = 10 Pcs"
        }
    ]
}
```

---

## 8. File yang Akan Ditambahkan

### 8.1 Backend (PHP/Laravel)

| No | File Path | Keterangan |
|----|-----------|------------|
| 1 | `database/migrations/xxxx_xx_xx_create_units_table.php` | Migrasi tabel units (dengan soft delete, is_primary, unique indexes) |
| 2 | `database/migrations/xxxx_xx_xx_add_unit_id_to_product_variants_table.php` | Migrasi tambah kolom unit_id |
| 3 | `database/migrations/xxxx_xx_xx_backfill_default_unit_to_product_variants.php` | Migrasi backfill: assign "Pcs" ke semua varian existing |
| 4 | `database/seeders/UnitSeeder.php` | Seeder data satuan default (idempotent, gunakan updateOrCreate) |
| 5 | `app/Models/Unit.php` | Model Unit dengan self-referencing, SoftDeletes, scopes |
| 5 | `app/Repositories/Contracts/UnitRepositoryInterface.php` | Interface repository satuan |
| 6 | `app/Repositories/Unit/UnitRepository.php` | Implementasi repository satuan (dengan caching) |
| 7 | `app/Services/Contracts/UnitServiceInterface.php` | Interface service satuan |
| 8 | `app/Services/Unit/UnitService.php` | Implementasi service satuan (dengan audit log) |
| 9 | `app/Http/Controllers/Unit/UnitController.php` | Controller CRUD satuan (dengan optimistic locking) |
| 10 | `app/Http/Requests/Unit/UnitCreateRequest.php` | Validasi form tambah satuan (conditional rules berdasarkan tipe) |
| 11 | `app/Http/Requests/Unit/UnitUpdateRequest.php` | Validasi form edit satuan (dengan optimistic locking) |
| 12 | `app/Http/Requests/Product/BulkAssignUnitsRequest.php` | Validasi bulk-assign satuan |
| 13 | `routes/units.php` | Route file untuk master satuan |

### 8.2 Frontend (React/Inertia.js)

| No | File Path | Keterangan |
|----|-----------|------------|
| 1 | `resources/js/Pages/Units/Index.jsx` | Halaman daftar satuan (tab Dasar / Konversi, dengan soft delete toggle) |
| 2 | `resources/js/Pages/Units/Create.jsx` | Form tambah satuan dengan pilihan tipe |
| 3 | `resources/js/Pages/Units/Edit.jsx` | Form edit satuan |
| 4 | `resources/js/Pages/Units/Show.jsx` | Detail satuan |

### 8.3 Tests

| No | File Path | Keterangan |
|----|-----------|------------|
| 1 | `tests/Unit/Models/UnitTest.php` | Unit test model Unit (relations, scopes, accessors) |
| 2 | `tests/Feature/UnitControllerTest.php` | Feature test CRUD satuan |
| 3 | `tests/Feature/BulkAssignUnitsTest.php` | Feature test bulk-assign |
| 4 | `tests/Feature/ProductWithUnitTest.php` | Feature test produk dengan data satuan |
| 5 | `tests/Feature/ReportWithUnitConversionTest.php` | Feature test laporan dengan konversi |

---

## 9. File yang Akan Dimodifikasi

### 9.1 Backend (PHP/Laravel)

| No | File Path | Perubahan |
|----|-----------|-----------|
| 1 | `app/Models/ProductVariant.php` | Tambah field `unit_id` ke fillable, cast, relasi `baseUnit()` |
| 2 | `app/Repositories/Product/ProductRepository.php` | Load relasi `unit` pada query (eager loading: `variants.baseUnit`, `variants.baseUnit.conversions`), query konversi dari master berdasarkan `unit_id`, transform data menyertakan info satuan dan konversi |
| 3 | `app/Repositories/Contracts/ProductRepositoryInterface.php` | (Opsional) Update interface jika ada perubahan signature method |
| 4 | `app/Services/Product/ProductService.php` | (Opsional) Update service jika ada perubahan |
| 5 | `app/Http/Requests/Product/ProductCreateRequest.php` | Tambah validasi `variants.*.unit_id` (nullable, exists:units,id,type,base) |
| 6 | `app/Http/Requests/Product/ProductUpdateRequest.php` | Tambah validasi `variants.*.unit_id` (nullable, exists:units,id,type,base) |
| 7 | `app/Http/Controllers/StockIn/StockInReportController.php` | Load info satuan varian dan query konversi dari master |
| 8 | `app/Http/Controllers/StockOut/StockOutReportController.php` | Load info satuan varian dan query konversi dari master + export JSON |
| 9 | `app/Http/Controllers/StockOpname/StockOpnameReportController.php` | Load info satuan varian dan query konversi dari master + export CSV |
| 10 | `app/Http/Controllers/Dashboard/DashboardController.php` | Update data dashboard untuk menyertakan info satuan |
| 11 | `routes/web.php` | Include route file `units.php` |

### 9.2 Frontend (React/Inertia.js)

| No | File Path | Perubahan |
|----|-----------|-----------|
| 1 | `resources/js/Pages/Products/Index.jsx` | Tombol bulk-assign + ubah tampilan kolom stok: `{stock} {unit} ({converted} {target_unit})`, hapus hardcoded "unit" |
| 2 | `resources/js/Pages/Products/Create.jsx` | Tambah dropdown satuan dasar per varian (hanya menampilkan unit bertipe 'base') |
| 3 | `resources/js/Pages/Products/Edit.jsx` | Tambah dropdown satuan dasar per varian (hanya menampilkan unit bertipe 'base') |
| 4 | `resources/js/Pages/Products/Show.jsx` | Tambah info satuan dan daftar konversi dari master pada detail varian |
| 5 | `resources/js/Pages/Reports/StockIn/Index.jsx` | Tambah dropdown filter satuan, update tampilan angka sesuai satuan, catatan rate konversi |
| 6 | `resources/js/Pages/Reports/StockOut/Index.jsx` | Tambah dropdown filter satuan, update tampilan angka sesuai satuan, catatan rate konversi |
| 7 | `resources/js/Pages/Reports/StockOpname/Index.jsx` | Tambah dropdown filter satuan, update tampilan angka sesuai satuan, catatan rate konversi |
| 8 | `resources/js/Pages/Dashboard.jsx` | Update tooltip chart dari hardcoded "unit" ke satuan dinamis |
| 9 | `resources/js/Components/Layouts/Sidebar.jsx` | Tambah menu "Satuan" di bawah Master Data |

---

## 10. Acceptance Criteria

| No | Kriteria | Diterima Jika |
|----|----------|---------------|
| 1 | Admin dapat membuat satuan dasar | Satuan bertipe 'base' tersimpan dengan nama dan singkatan unik (case-insensitive) |
| 2 | Admin dapat membuat satuan konversi | Satuan bertipe 'conversion' tersimpan dengan base_unit_id dan multiplier yang valid |
| 3 | Form tambah satuan menampilkan pilihan tipe | UI menampilkan radio/toggle untuk memilih "Satuan Dasar" atau "Satuan Konversi" |
| 4 | Form satuan konversi menampilkan dropdown base unit + multiplier + checkbox primary | Saat tipe "Satuan Konversi" dipilih, muncul dropdown satuan dasar tujuan, input multiplier, dan checkbox primary |
| 5 | Hanya boleh ada 1 konversi primary per base unit | Jika admin mencentang primary pada konversi baru, konversi primary sebelumnya otomatis unchecked |
| 6 | Admin dapat mengedit satuan (termasuk multiplier) dengan optimistic locking | Jika dua admin edit bersamaan, yang kedua mendapat error 409 Conflict |
| 7 | Admin dapat menghapus (soft delete) satuan | Satuan di-soft-delete, muncul di daftar "dihapus", bisa di-restore |
| 8 | Konfirmasi hapus satuan konversi menampilkan dampak | Dialog menunjukkan jumlah varian yang terdampak sebelum konfirmasi |
| 9 | Dropdown satuan dasar pada form varian hanya menampilkan unit bertipe 'base' aktif | Tidak muncul unit bertipe 'conversion' atau yang di-soft-delete |
| 10 | Bulk-assign satuan dasar ke banyak varian | Admin dapat memilih banyak varian dan assign satuan dasar sekaligus |
| 11 | Stok pada tabel produk menampilkan satuan + konversi utama | Kolom stok menampilkan `{stok} {satuan}` dan konversi primary dari master |
| 12 | Detail varian menampilkan semua konversi dari master | Expand row menampilkan daftar konversi berdasarkan satuan dasar varian |
| 13 | Laporan stok menampilkan opsi satuan | Dropdown filter satuan tersedia pada laporan stock in/out/opname |
| 14 | Konversi satuan pada laporan akurat | Angka laporan berubah sesuai satuan yang dipilih |
| 15 | Laporan menampilkan catatan rate konversi | Catatan "Konversi menggunakan rate yang berlaku saat ini" tampil di bawah laporan |
| 16 | Data existing tetap berfungsi | Semua varian existing otomatis memiliki unit_id "Pcs" setelah migrasi. Varian tanpa unit_id (edge case) tetap tampil dengan "unit" sebagai fallback |
| 17 | Backfill migrasi idempotent | Menjalankan migrasi backfill 2 kali tidak menghasilkan duplikasi unit "Pcs" atau perubahan ganda pada unit_id varian |
| 18 | Export CSV/JSON menyertakan info satuan | File export memiliki kolom/field satuan |
| 18 | Audit log tercatat untuk perubahan multiplier | Log berisi info siapa, kapan, nilai lama → nilai baru |
| 19 | Cache reference data units berfungsi | Query units tidak mengulang ke database di setiap request (Redis/file cache) |
| 20 | Seeder idempotent | Menjalankan `db:seed` dua kali tidak menghasilkan duplikasi data |

---

## 11. Dependencies

- [x] PostgreSQL database (sudah tersedia)
- [x] Laravel 10.x framework (sudah tersedia)
- [x] Inertia.js + React frontend (sudah tersedia)
- [x] Arsitektur Repository-Service-Controller (sudah diterapkan)
- [x] Sistem permission Spatie (sudah diterapkan, perlu tambah permission `units.*`)
- [x] Modul Master Produk (sudah ada)
- [x] Modul Laporan Stok (sudah ada)
- [x] Cache driver (Redis atau file cache, sudah tersedia di Laravel)

---

## 12. Risiko & Mitigasi

| Risiko | Dampak | Solusi |
|--------|--------|--------|
| Data existing tidak memiliki satuan | Tampilan inkonsisten | Backfill otomatis saat migrasi: semua varian existing di-assign ke "Pcs". Fallback "unit" hanya untuk skenario sangat jarang (varian baru yang belum di-assign) |
| Performa query dengan eager loading relasi baru | Query lebih lambat | Eager loading spesifik: `with(['variants.baseUnit', 'variants.baseUnit.conversions'])`. Cache reference data units 24 jam. Index pada semua FK |
| User salah input multiplier | Laporan stok tidak akurat | Validasi minimal 0.01, tampilkan preview konversi ("1 Karton = 10 Pcs") sebelum simpan, audit log untuk tracking perubahan |
| Satuan dasar yang dirujuk oleh konversi dihapus | Data orphan | Soft delete (bukan hard delete). `ON DELETE RESTRICT` pada FK `base_unit_id` sebagai safety net |
| Perubahan multiplier mengubah laporan historis | Audit trail tidak konsisten | Dokumentasikan sebagai batasan MVP. Audit log mencatat perubahan. Catatan pada laporan. Rencana post-MVP: snapshot konversi per transaksi |
| Konversi desimal menghasilkan angka panjang | Tampilan tidak rapi | Pembulatan 2 desimal, format angka Indonesia |
| Concurrency saat edit multiplier | Data race condition | Optimistic locking via `updated_at`, return 409 Conflict jika terjadi collision |
| N+1 query pada laporan dengan banyak varian | Performa buruk | Eager loading spesifik + cache units. Batch query konversi: ambil semua unit_id unik, query conversions sekali, map di PHP |
| Perubahan response API berdampak ke konsumen lain | Breaking change | Field baru bersifat additive (tidak menghapus/mengubah field existing). Konsumen lama dapat mengabaikan field baru |

---

## 13. Metrics / Success Criteria

- 100% produk varian aktif memiliki satuan dasar setelah deploy (backfill otomatis saat migrasi, tanpa perlu aksi manual admin)
- Laporan stok dapat ditampilkan dalam minimal 2 satuan (dasar + 1 konversi)
- Tidak ada regresi pada fitur stok existing (stock in, stock out, stock opname)
- Response time halaman produk tidak bertambah lebih dari 200ms (dengan cache)
- User dapat menyelesaikan pengaturan master satuan (dasar + konversi) dalam < 2 menit
- Bulk-assign 100 varian selesai dalam < 5 detik

---

## 14. Rencana Implementasi

| Tahap | Tugas | Estimasi |
|--------|-------|-----------|
| 1 | Migrasi database (create units + add unit_id + backfill "Pcs" ke semua varian existing) | 0.5 hari |
| 2 | Model Unit (dengan self-referencing, SoftDeletes, scopes, accessors) + update ProductVariant model | 0.5 hari |
| 3 | UnitSeeder (idempotent, updateOrCreate — seed satuan konversi saja karena "Pcs" sudah dibuat di migrasi backfill) | 0.1 hari |
| 4 | Repository & Service layer untuk Unit (CRUD + caching + audit log + optimistic locking) | 1 hari |
| 5 | Controller & Form Request untuk Unit (conditional validation, soft delete/restore, impact check) | 0.5 hari |
| 6 | Bulk-assign endpoint (controller + request + service) | 0.25 hari |
| 7 | Route untuk Unit + API endpoint dropdown + bulk-assign | 0.25 hari |
| 8 | Frontend: Halaman CRUD Satuan (Index dengan tab + soft delete toggle, Create dengan pilihan tipe + checkbox primary, Edit, Show) | 1.5 hari |
| 9 | Update ProductRepository: eager loading, query konversi dari master, transform data | 0.5 hari |
| 10 | Update ProductCreateRequest & ProductUpdateRequest: validasi unit_id | 0.25 hari |
| 11 | Frontend: Update Products/Index.jsx (bulk-assign button + tampilan stok dengan satuan) | 0.5 hari |
| 12 | Frontend: Update Products/Create.jsx dan Edit.jsx (dropdown satuan dasar per varian) | 0.5 hari |
| 13 | Frontend: Update Products/Show.jsx (info satuan + daftar konversi) | 0.25 hari |
| 14 | Update Report Controllers: eager loading satuan & konversi dari master | 0.5 hari |
| 15 | Frontend: Update Reports (StockIn, StockOut, StockOpname) dengan filter satuan + catatan rate | 1.5 hari |
| 16 | Update Dashboard: satuan dinamis pada tooltip | 0.25 hari |
| 17 | Update Sidebar: tambah menu Satuan | 0.1 hari |
| 18 | Unit test (Model Unit, relations, scopes) | 0.25 hari |
| 19 | Feature test (CRUD satuan, bulk-assign, produk dengan unit, laporan dengan konversi) | 0.5 hari |
| 20 | Integration testing & bug fix | 0.5 hari |
| **Total** | | **~10 hari** |

---

## 15. Test Plan

### 15.1 Unit Tests

| Test Case | Ekspektasi |
|-----------|------------|
| Unit model memiliki relasi baseUnit (untuk tipe conversion) | `unit->baseUnit` mengembalikan model Unit yang benar |
| Unit model memiliki relasi conversions (untuk tipe base) | `unit->conversions` mengembalikan collection Unit conversion |
| Scope `base()` hanya mengembalikan tipe base | Query dengan scope base tidak menyertakan tipe conversion |
| Scope `conversion()` hanya mengembalikan tipe conversion | Query dengan scope conversion tidak menyertakan tipe base |
| Accessor `full_name` mengembalikan format yang benar | "1 Karton = 10 Pcs" untuk unit Karton dengan multiplier 10 |
| Accessor `variants_count` menghitung varian yang menggunakan unit | Jumlah sesuai dengan data di database |

### 15.2 Feature Tests

| Test Case | Ekspektasi |
|-----------|------------|
| POST /units dengan tipe base menyimpan data | Response 201, data tersimpan dengan type=base, base_unit_id=null, multiplier=null |
| POST /units dengan tipe conversion menyimpan data | Response 201, data tersimpan dengan type=conversion, base_unit_id terisi |
| POST /units dengan nama duplikat (case-insensitive) ditolak | Response 422 dengan error unique |
| POST /units dengan singkatan duplikat (case-insensitive) ditolak | Response 422 dengan error unique |
| POST /units conversion dengan base_unit_id merujuk ke diri sendiri ditolak | Response 422 |
| POST /units conversion dengan multiplier <= 0 ditolak | Response 422 |
| PUT /units/{id} dengan updated_at stale mengembalikan 409 | Response 409 Conflict |
| DELETE /units/{id} melakukan soft delete | Record memiliki deleted_at, tidak muncul di query default |
| POST /units/{id}/restore memulihkan unit | Record deleted_at kembali null |
| DELETE /units yang masih digunakan varian menolak | Response 422 dengan info jumlah varian |
| DELETE /units base yang masih dirujuk konversi menolak | Response 422 dengan info daftar konversi |
| Soft-deleted unit name bisa digunakan kembali | Membuat unit baru dengan nama yang sama dengan unit yang di-soft-delete berhasil (partial unique index hanya berlaku untuk deleted_at IS NULL) |
| Swap is_primary: set primary baru unset primary lama | Saat menandai konversi B sebagai primary, konversi A yang sebelumnya primary otomatis unset. Query hanya mengembalikan 1 record dengan is_primary=true per base_unit_id |
| Swap is_primary dalam kondisi race condition | Partial unique index menolak jika dua transaksi mencoba set primary bersamaan untuk base unit yang sama |
| POST /products/bulk-assign-units mengassign banyak varian | Semua varian yang dipilih memiliki unit_id yang benar |
| POST /products/bulk-assign-units skip varian yang sudah punya unit_id | Varian yang sudah memiliki unit_id di-skip, response mengembalikan daftar varian yang di-skip |
| POST /products/bulk-assign-units dengan > 500 item ditolak | Response 422 dengan pesan "Maksimal 500 varian per request" |
| GET /products menyertakan data unit dan conversions | Response variants memiliki field unit dan conversions |
| GET /products dengan varian tanpa unit_id | Field unit null, fallback "unit" di frontend |
| Seeder idempotent: jalankan 2 kali tidak duplikat | Jumlah record units tetap sama setelah seed ulang |
| Backfill: migrasi membuat unit "Pcs" dan meng-assign semua varian | Semua varian aktif memiliki unit_id yang merujuk ke "Pcs" |
| Backfill: migrasi tidak menimpa unit_id yang sudah terisi | Varian yang sudah punya unit_id sebelum backfill不变 |

### 15.3 Integration Tests

| Test Case | Ekspektasi |
|-----------|------------|
| Laporan stock out dengan filter satuan konversi | Angka terkonversi dengan benar sesuai multiplier |
| Laporan stock opname dengan filter satuan konversi | Angka terkonversi dengan benar sesuai multiplier |
| Export CSV menyertakan kolom satuan | CSV memiliki kolom tambahan untuk satuan |
| Export JSON menyertakan info satuan | JSON memiliki field unit dan conversions |
| Cache units invalidasi setelah CRUD unit | Query setelah update mengembalikan data terbaru |
| Backfill: semua varian existing memiliki unit_id setelah migrasi | Query `SELECT COUNT(*) FROM product_variants WHERE unit_id IS NULL AND deleted_at IS NULL` mengembalikan 0 |
| Backfill: unit_id yang di-assign merujuk ke "Pcs" | Semua varian yang di-backfill memiliki unit_id yang merujuk ke record unit dengan name='Pcs' |
| Backfill: varian yang sudah punya unit_id tidak ditimpa | Varian yang sebelumnya sudah di-assign ke unit lain tetap不变 |
| Backfill: rollback mengosongkan unit_id | Setelah rollback migrasi backfill, semua varian yang di-assign ke Pcs kembali null |
| Backfill: idempotent — jalankan migrasi 2 kali tidak duplikasi | Jumlah record units "Pcs" tetap 1, unit_id varian不变 |

---

## 16. Catatan Tambahan

- **Satuan default yang di-seed (idempotent):**
  - Satuan Dasar "Pcs" dibuat oleh migrasi backfill (Migration 3), bukan seeder. Ini karena "Pcs" harus ada sebelum backfill varian bisa berjalan
  - Seeder (`UnitSeeder`) bertanggung jawab membuat satuan dasar tambahan (Kg, Liter, Meter) dan semua satuan konversi (Karton, Box, Lusin, Dus)
  - Seeder menggunakan `updateOrCreate` berdasarkan `name` agar aman dijalankan ulang
  - Urutan eksekusi: Migration 1 (create units) → Migration 2 (add unit_id) → Migration 3 (backfill "Pcs") → Seeder (satuan tambahan + konversi)
- **Konversi bersifat global**, bukan per varian. Semua varian yang memilih satuan dasar "Pcs" akan otomatis memiliki konversi yang sama
- **Keuntungan pendekatan global:** Tidak perlu mengatur konversi berulang untuk setiap varian, konsistensi data terjaga, administrasi lebih mudah
- **Fitur ini adalah fondasi** untuk adaptasi konversi satuan pada input stock masuk/keluar di masa depan
- **Tidak ada perubahan pada logic stock current** — `stock_current` tetap disimpan dalam satuan dasar (integer)
- **Konversi hanya untuk display/report** — tidak mengubah data stok yang tersimpan
- **Tabel `unit_conversions` tidak diperlukan** — konversi disimpan langsung di tabel `units` melalui field `base_unit_id` dan `multiplier`
- **Batasan MVP:** Konversi dihitung on-the-fly, bukan snapshot. Perubahan multiplier akan mempengaruhi tampilan laporan historis. Ini didokumentasikan dan diatasi dengan audit log. Rencana post-MVP: snapshot konversi per transaksi
- **Rollback plan migrasi:** Jika migrasi gagal di production, jalankan `php artisan migrate:rollback` untuk: (1) mengosongkan `unit_id` dari semua varian yang di-backfill, (2) menghapus kolom `unit_id` dari `product_variants`, (3) drop tabel `units`. Data produk tidak terpengaruh karena proses backfill hanya mengisi kolom baru, tidak mengubah data existing

---

## 17. Checklist Sebelum Rilis

- [ ] Migrasi database berhasil dijalankan tanpa error
- [ ] Rollback migrasi berhasil dijalankan tanpa error
- [ ] Backfill "Pcs" berhasil: semua varian existing memiliki unit_id
- [ ] Backfill idempotent: jalankan ulang tidak duplikasi data
- [ ] Seeder data satuan default berhasil (idempotent)
- [ ] CRUD Master Satuan berfungsi (create, read, update, soft delete, restore)
- [ ] Form tambah satuan menampilkan pilihan tipe (Dasar / Konversi)
- [ ] Form satuan konversi menampilkan dropdown base unit + input multiplier + checkbox primary
- [ ] Uniqueness case-insensitive berfungsi untuk nama dan singkatan (partial index, soft-delete safe)
- [ ] Nama unit yang di-soft-delete bisa digunakan kembali oleh unit baru
- [ ] Swap is_primary berfungsi: primary lama otomatis unset saat primary baru dipilih
- [ ] Optimistic locking berfungsi saat edit multiplier (409 Conflict)
- [ ] Konfirmasi hapus menampilkan dampak (jumlah varian terdampak)
- [ ] Dropdown satuan dasar muncul pada form tambah/edit produk (hanya unit bertipe 'base' aktif)
- [ ] Bulk-assign satuan dasar berfungsi (skip varian yang sudah punya unit_id)
- [ ] Bulk-assign menolak payload > 500 item
- [ ] Tabel produk menampilkan stok dengan satuan dan konversi primary dari master
- [ ] Detail varian menampilkan semua konversi dari master
- [ ] Laporan Stock In menampilkan opsi satuan konversi
- [ ] Laporan Stock Out menampilkan opsi satuan konversi
- [ ] Laporan Stock Opname menampilkan opsi satuan konversi
- [ ] Catatan rate konversi tampil di bawah laporan
- [ ] Export CSV/JSON menyertakan info satuan
- [ ] Dashboard tooltip menampilkan satuan dinamis
- [ ] Data existing (tanpa satuan) tetap tampil dengan fallback "unit" (skenario sangat jarang setelah backfill)
- [ ] Cache units berfungsi (query tidak mengulang ke DB, invalidation dengan Cache::forget)
- [ ] Audit log tercatat untuk perubahan multiplier
- [ ] Tidak ada N+1 query pada halaman produk dan laporan
- [ ] Tidak ada error pada console browser
- [ ] Tidak ada error pada Laravel log
- [ ] Permission `units.view`, `units.create`, `units.update`, `units.delete` terdaftar
- [ ] Unit test lulus semua
- [ ] Feature test lulus semua
- [ ] QA checklist sudah disetujui
- [ ] Dokumentasi API diperbarui

---

**📄 End of PRD**
