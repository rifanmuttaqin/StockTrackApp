# 📘 Product Requirement Document (PRD) — Stock Opname

## 🧩 1. Ringkasan Singkat
**Deskripsi Singkat:**  
Fitur Stock Opname memungkinkan operator atau supervisor gudang untuk melakukan audit stok fisik secara berkala. Sistem mengacu pada template produk aktif sebagai daftar varian produk yang harus dihitung. Selisih (discrepancy) dihitung berdasarkan stok sistem dan jumlah fisik yang diinput. Fitur ini menerapkan kontrol ketat berupa penjejakan audit (siapa, kapan, dan perubahan status), row-level locking untuk keamanan konkurensi stok, pembatasan mutasi note pada status submit, pencatatan snapshot ganda (saat draft dan submit), dan modal konfirmasi komprehensif sebelum pembaruan stok sistem dilakukan secara mutlak.

**Status:** Draft  
**Prioritas:** Tinggi  
**Tanggal:** 2026-07-30  
**Author:** AI Software Product Analyst & Technical Writer  

---

## 🎯 2. Tujuan & Latar Belakang
- **Akurasi Inventory Terpadu:** Menyediakan mekanisme audit independen untuk mendeteksi kehilangan barang (shrinkage) maupun surplus stok.
- **Jejak Audit Komprehensif (Audit Trail):** Merekam riwayat pembuatan, modifikasi draft (melalui tabel log audit khusus), penghapusan draft (melalui soft delete), dan submit stock opname lengkap dengan data user penanggung jawab.
- **Integritas Data Konkuren:** Mencegah terjadinya inkonsistensi stok akibat race condition dengan sistem Stock In atau Stock Out yang berjalan bersamaan di waktu yang sama.
- **Kejelasan Hasil Perhitungan:** Menyajikan snapshot stok sistem dari dua kondisi (saat pencatatan fisik dimulai dan saat submit final) demi transparansi audit.
- **Pemberitahuan & Tindakan Lanjut:** Menggunakan Event-Driven Architecture untuk memisahkan logika pasca-submit (notifikasi threshold minimum, sinkronisasi WhatsApp) agar sistem lebih modular.

---

## 👥 3. Stakeholder
| Peran | Nama | Tanggung Jawab |
|-------|------|----------------|
| Product Owner |  | Menentukan prioritas dan cakupan fitur Stock Opname |
| Backend Developer |  | Mengimplementasikan model, event listener, locking database, dan API |
| Frontend Developer |  | Membangun visualisasi tabel selisih, optimistic locking UI, dan modal konfirmasi |
| QA |  | Melakukan uji beban konkuren, race condition, dan validasi data audit |
| Database Administrator |  | Memverifikasi indeks unik majemuk (compound indexes) dan performa query database |

---

## ⚙️ 4. Deskripsi Fitur

### 4.1. Alur Utama (Main Flow)
1. **Melihat Riwayat (Index):** Pengguna dengan permission melihat daftar transaksi stock opname lengkap dengan statistik shortage/surplus terpisah dan status badge.
2. **Membuat Draft Opname (Create):** Pengguna memilih tanggal, menulis note awal, dan memilih template aktif. Sistem menyalin semua item produk varian dari template aktif. Pada saat ini, system stock disnapshoot ke kolom `system_stock_draft`.
3. **Mengisi Jumlah Fisik (Counting):** Pengguna memasukkan hasil hitungan fisik untuk tiap varian. Sistem menghitung selisih sementara secara real-time di UI.
4. **Menyimpan Draft (Store):** Pengguna menyimpan dokumen sebagai status `draft`. Data disimpan di database tanpa memengaruhi stok fisik produk varian sesungguhnya.
5. **Mengedit Draft (Edit):** Pengguna dapat mengubah draft. Untuk menghindari konflik lost-update jika dua user mengedit draft yang sama bersamaan, sistem menerapkan **Optimistic Locking** menggunakan timestamp `updated_at`.
6. **Proses Konfirmasi (Confirmation):** Saat menekan submit, sistem memunculkan modal konfirmasi yang menyajikan rincian terpisah:
   - Jumlah produk yang cocok (selisih = 0).
   - Akumulasi kuantitas shortage (minus) secara absolut.
   - Akumulasi kuantitas surplus (plus).
   - Tombol persetujuan akhir.
7. **Submit & Update Stok Final (Submit):** Setelah konfirmasi, request dikirim ke backend. Backend mengamankan data menggunakan **Row-Level Locking (`lockForUpdate()`)**, mengambil `stock_current` terbaru sebagai `system_stock_submit`, menghitung selisih final (`physical_stock - system_stock_submit`), memperbarui stok mutlak produk varian menjadi sama dengan `physical_stock`, mengubah status transaksi menjadi `submit`, serta mencatat pelaku (`submitted_by`) dan waktu submit (`submitted_at`).
8. **Event Trigger:** Logika pasca-submit berjalan via Laravel Event (`StockOpnameSubmitted`).

### 4.2. Sub-Flow / Edge Case
- **Ketidaklengkapan Perhitungan (Partial Counting):**
  - **Drafting Parsial Diperbolehkan:** Selama berstatus `draft`, operator diperbolehkan menyimpan progres perhitungan secara parsial. Artinya, belum semua varian dari template aktif harus diisi stok fisiknya (kolom stok fisik yang kosong disimpan sebagai `null` di database).
  - **Submit Final Wajib Lengkap:** Pada saat melakukan **submit final**, seluruh item produk varian yang ada di dalam template aktif wajib memiliki nilai `physical_stock` (tidak boleh kosong atau `null`). Validasi kelengkapan ini dilakukan secara ketat pada `StockOpnameSubmitRequest`.
- **Pemberhentian Mutasi Catatan (Note Immutability):** Endpoint update catatan (`PUT /stock-opname/{id}/note`) hanya dapat dieksekusi apabila status dokumen adalah `draft`. Apabila status adalah `submit`, request akan diblokir dengan HTTP 403 Forbidden untuk menjaga sifat *immutable* transaksi yang sudah rampung.
- **Perubahan Template di Tengah Jalan:** Dokumen draft menyimpan daftar varian hasil salinan template aktif saat pertama kali draft dibuat. Perubahan isi template aktif setelah draft dibuat tidak akan merusak draft yang sedang berjalan. Namun, jika ada varian dalam draft yang dihapus secara fisik dari database sebelum submit, sistem akan melempar pesan error validasi saat submit dijalankan.
- **idempotency Submit:** Transaksi submit dibungkus dengan pengecekan state terkunci (`lockForUpdate()`) pada baris `StockOpnameRecord`. Jika transaksi sudah berstatus `submit`, request kedua yang datang bersamaan akan dibatalkan dengan pesan error transaksional (idempotensi).
- **Batasan Multi-Warehouse:** Sesuai batasan sistem existing (Out of Scope), fitur Stock Opname ini diasumsikan beroperasi secara global pada satu lokasi gudang terpadu.
- **Kebijakan Kepemilikan Draft (Draft Ownership):** Untuk menjamin keamanan dan akuntabilitas, sistem menerapkan kontrol kepemilikan. Hanya pengguna yang membuat draft (`created_by`) yang diperbolehkan untuk mengedit atau menghapus draft tersebut. Pengecualian diberikan kepada pengguna dengan Role Admin yang memiliki permission khusus `stock_opname.bypass_ownership`.

### 4.3. UI/UX
- **Halaman yang Terlibat:**
  - `StockOpname/Index` (List view responsif, filter status, summary card untuk Total Shortage, Total Surplus, Total Matching)
  - `StockOpname/Create` (Date picker, table input mobile-first, kalkulasi selisih real-time per baris)
  - `StockOpname/Edit` (Memuat form edit, menyertakan input hidden `updated_at` untuk mendeteksi konflik optimistik)
  - `StockOpname/Show` (Tampilan detail transaksi read-only berwarna kontras: Baris merah untuk minus, hijau untuk plus, netral untuk cocok)
  - `Reports/StockOpname/Index` (Laporan riwayat selisih, visualisasi chart, dan tombol export laporan)
- **Elemen Visual:**
  - **Confirm Modal:** Menampilkan summary shortage, surplus, dan item matching secara eksplisit.
  - **Conflict Screen Alert:** Pesan error jika terjadi konflik lost-update ketika mengedit draft ("Data ini telah diperbarui oleh pengguna lain. Silakan muat ulang halaman.").

---

## 🧠 5. Behavior & Logika Bisnis
- **Aturan Perhitungan Kuantitas Selisih:**
  - Selisih Draft: $\text{difference\_draft} = \text{physical\_stock} - \text{system\_stock\_draft}$ (hanya dihitung untuk item yang memiliki `physical_stock` tidak null).
  - Selisih Final: $\text{difference} = \text{physical\_stock} - \text{system\_stock\_submit}$
- **Formula Pembaruan Stok Mutlak:**
  - $\text{stock\_current} = \text{physical\_stock}$
- **Aturan Immutability Catatan:** Update catatan tidak diperbolehkan sama sekali pada dokumen berstatus `submit`.
- **Penjejakan Audit (Audit Trail) & Soft Deletes:**
  - Pembuatan draft mencatat `created_by`.
  - Penghapusan draft (soft delete) menyisakan baris di database dengan timestamp `deleted_at`.
  - Submit mencatat `submitted_by` dan `submitted_at`.
  - Untuk menjaga referensi data saat offboarding karyawan, kolom FK `created_by` dan `submitted_by` menggunakan database constraint `ON DELETE SET NULL`.
  - Setiap operasi modifikasi pada draft akan disimpan riwayat perubahannya di tabel audit khusus `stock_opname_audit_logs`.
- **Pencegahan Kloning Item:** Tabel `stock_opname_items` menggunakan compound unique index untuk `(stock_opname_record_id, product_variant_id)` guna menjamin tidak ada duplikasi input varian dalam satu transaksi.

---

## 🔌 6. Integrasi & API
### 6.1. Endpoint Baru
| Method | Endpoint | Deskripsi | Auth | Permission |
|---------|-----------|-----------|------|------------|
| GET | `/stock-opname` | List dokumen stock opname dengan pagination | Required | `stock_opname.view` |
| GET | `/stock-opname/create` | Form pembuatan stock opname berbasis template aktif | Required | `stock_opname.create` |
| POST | `/stock-opname` | Simpan dokumen stock opname baru (status draft) | Required | `stock_opname.create` |
| GET | `/stock-opname/{stockOpname}` | Detail riwayat dan visualisasi item opname | Required | `stock_opname.view` |
| GET | `/stock-opname/{stockOpname}/edit` | Form edit dokumen draft | Required | `stock_opname.edit` |
| PUT | `/stock-opname/{stockOpname}` | Simpan perubahan draft (optimistic lock checked) | Required | `stock_opname.update` |
| DELETE | `/stock-opname/{stockOpname}` | Hapus draft secara soft delete | Required | `stock_opname.delete` |
| POST | `/stock-opname/{stockOpname}/submit` | Eksekusi submit, lock database, & update stok (Rate Limited: max 5 req/min) | Required | `stock_opname.submit` |
| PUT | `/stock-opname/{stockOpname}/note` | Edit note cepat (Hanya diperbolehkan status draft) | Required | `stock_opname.update` |
| GET | `/reports/stock-opname` | Laporan visual opname & pencapaian audit | Required | `view_reports` |
| GET | `/reports/stock-opname/export` | Export laporan format Excel/CSV/PDF | Required | `export_reports` |

---

## 🧱 7. Struktur Data
### 7.1. Model / Entity

#### StockOpnameRecord
```php
StockOpnameRecord {
    id: uuid (primary key)
    date: date
    status: string (draft | submit)
    transaction_code: string (ALBR-OPN-{12 digit})
    note: text | nullable
    created_by: uuid | nullable (foreign key to users)
    submitted_by: uuid | nullable (foreign key to users)
    submitted_at: timestamp | nullable
    deleted_at: timestamp | nullable (soft deletes)
    created_at: timestamp
    updated_at: timestamp
    
    Relationships:
    - items: HasMany[StockOpnameItem]
    - auditLogs: HasMany[StockOpnameAuditLog]
    - creator: BelongsTo[User] (created_by)
    - submitter: BelongsTo[User] (submitted_by)
}
```

#### StockOpnameItem
```php
StockOpnameItem {
    id: uuid (primary key)
    stock_opname_record_id: uuid (foreign key to stock_opname_records)
    product_variant_id: uuid (foreign key to product_variants)
    system_stock_draft: integer
    system_stock_submit: integer
    physical_stock: integer | nullable (boleh null saat draft)
    difference: integer | nullable
    created_at: timestamp
    updated_at: timestamp
    
    Relationships:
    - record: BelongsTo[StockOpnameRecord]
    - productVariant: BelongsTo[ProductVariant]
}
```

#### StockOpnameAuditLog
```php
StockOpnameAuditLog {
    id: uuid (primary key)
    stock_opname_record_id: uuid (foreign key to stock_opname_records)
    user_id: uuid | nullable (foreign key to users)
    action: string (created | updated_draft | submitted)
    old_values: json | nullable
    new_values: json | nullable
    created_at: timestamp
}
```

### 7.2. Migration / Schema

#### Migration 1: Create `stock_opname_records` table
```sql
CREATE TABLE stock_opname_records (
    id CHAR(36) PRIMARY KEY,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    transaction_code VARCHAR(25) NOT NULL UNIQUE, -- Generated on create, NOT NULL
    note TEXT NULL,
    created_by CHAR(36) NULL, -- Nullable agar aman jika user didelete
    submitted_by CHAR(36) NULL,
    submitted_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL, -- Soft deletes
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_opname_date (date),
    INDEX idx_opname_status (status)
);
```

#### Migration 2: Create `stock_opname_items` table
```sql
CREATE TABLE stock_opname_items (
    id CHAR(36) PRIMARY KEY,
    stock_opname_record_id CHAR(36) NOT NULL,
    product_variant_id CHAR(36) NOT NULL,
    system_stock_draft INTEGER NOT NULL,
    system_stock_submit INTEGER NOT NULL DEFAULT 0,
    physical_stock INTEGER NULL, -- Nullable selama berstatus draft
    difference INTEGER NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    FOREIGN KEY (stock_opname_record_id) 
        REFERENCES stock_opname_records(id) 
        ON DELETE CASCADE,
        
    FOREIGN KEY (product_variant_id) 
        REFERENCES product_variants(id) 
        ON DELETE RESTRICT,
        
    -- Compound unique index untuk mencegah duplikasi varian dalam satu transaksi
    UNIQUE KEY uq_opname_record_variant (stock_opname_record_id, product_variant_id),
    
    INDEX idx_opname_record_id (stock_opname_record_id),
    INDEX idx_opname_variant_id (product_variant_id)
);
```

#### Migration 3: Create `stock_opname_audit_logs` table
```sql
CREATE TABLE stock_opname_audit_logs (
    id CHAR(36) PRIMARY KEY,
    stock_opname_record_id CHAR(36) NOT NULL,
    user_id CHAR(36) NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    created_at TIMESTAMP NOT NULL,
    
    FOREIGN KEY (stock_opname_record_id) REFERENCES stock_opname_records(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 🧪 8. Acceptance Criteria
| No | Kriteria | Diterima Jika |
|----|-----------|---------------|
| 1 | Integrasi Template Aktif | Pembuatan transaksi opname otomatis memuat semua varian dari template aktif. |
| 2 | Pencatatan Snapshot Ganda | Baris item menyimpan nilai stok sistem pada saat draft dibuat (`system_stock_draft`) dan saat submit final (`system_stock_submit`). |
| 3 | Perhitungan Shortage/Surplus Terpisah | Halaman index dan detail menampilkan jumlah shortage (kuantitas minus absolut) dan surplus (kuantitas plus) secara terpisah. |
| 4 | Immutability Aturan Submit | Pengguna dilarang mengupdate note (`/note`) atau data transaksi jika status dokumen telah `submit`. |
| 5 | Row-Level Locking | Proses submit mengeksekusi `lockForUpdate()` pada record produk varian sebelum memperbarui stok untuk mencegah overlapping Stock In/Out. |
| 6 | Optimistic Locking | Saat menyimpan update draft, server memverifikasi timestamp `updated_at`. Jika ada perbedaan dengan input user, server melempar error konflik 409. |
| 7 | Idempotency Check | Double-submit berturut-turut pada detik yang sama dihandle aman dengan mekanisme lock transaction record di DB. |
| 8 | Event-driven Notifikasi | Logika notifikasi threshold dipisahkan ke listener event `StockOpnameSubmitted`. |
| 9 | Soft Delete Jejak Audit | Penghapusan dokumen draft menggunakan soft deletes untuk memelihara jejak historis pembuatan dan penghapusan draft. |
| 10| Export Laporan Audit | Pengguna dengan permission `export_reports` dapat mendownload laporan stock opname dalam format Excel/CSV/PDF dari halaman laporan. |
| 11| Ownership Validation | Hanya pembuat draft (`created_by`) atau role Admin dengan bypass permission yang dapat mengupdate/menghapus draft. |

---

## 🧰 9. Dependencies
- [x] Laravel 11.x framework
- [x] Spatie Laravel Permission (Otorisasi role operator & supervisor)
- [x] `Template` dan `ProductVariant` models
- [x] Event & Listener system pada Laravel
- [x] Route throttling middleware `throttle:5,1` pada route submit

---

## 🧩 10. Risiko & Mitigasi
| Risiko | Dampak | Solusi |
|--------|---------|--------|
| Race condition stok di waktu bersamaan | Nilai stok hasil penyesuaian opname tertimpa transaksi lain | Gunakan `DB::transaction()` dan row-level locking `lockForUpdate()` pada varian produk saat submit. |
| Konflik lost-update pada edit draft | Perubahan data oleh user A ditimpa oleh user B tanpa sadar | Terapkan optimistic locking dengan membandingkan parameter timestamp `updated_at` di Form Request. |
| Double submit akibat lag jaringan | Duplikasi proses update stok fisik | Gunakan status check menggunakan row lock pada data transaksi serta rate limiting route submit via `throttle:5,1`. |
| Pemalsuan snapshot `system_stock_draft` | Manipulasi data history audit oleh pengguna nakal | Nilai `system_stock_draft` dibaca langsung secara aman dari database (bukan dari payload request frontend) pada saat submit. |

---

## 📊 11. Metrics / Success Criteria
- Tingkat kegagalan transaksi konkuren akibat race condition adalah 0%.
- Selisih kuantitas kekurangan (shortage) dan kelebihan (surplus) dilaporkan secara absolut dengan akurasi 100%.
- Waktu respon submit terkunci di bawah 2 detik.

---

## 🚀 12. Rencana Implementasi & Test Matrix

### 12.1 Rencana Tugas
- Tahap 1: Migration (stock_opname_records, stock_opname_items, stock_opname_audit_logs) - 0.5 Hari
- Tahap 2: Model, Audit Trail Log, SoftDeletes - 0.5 Hari
- Tahap 3: Implementasi Event `StockOpnameSubmitted` dan listeners (Penyesuaian stok dan notifikasi threshold) - 0.5 Hari
- Tahap 4: Implementasi Controller dengan row-level lock, audit log logger, & optimistic locking - 1.5 Hari
- Tahap 5: Form Requests validation (Create, Update, Submit) - 0.5 Hari
- Tahap 6: Frontend layout index, create, edit, show (React & Inertia) - 3.0 Hari
- Tahap 7: Laporan & Fitur Export - 1.0 Hari
- Tahap 8: Concurrency & Quality Assurance testing - 1.0 Hari

### 12.2 Skenario QA & Test Matrix
Untuk memastikan ketangguhan sistem, QA harus menjalankan test matrix berikut:

| Skenario Uji | Tujuan | Metode Pengujian | Hasil yang Diharapkan |
|--------------|--------|------------------|-----------------------|
| **Concurrency Test** | Menguji keamanan dari race condition | Kirim transaksi Stock In/Out bersamaan dengan Submit Opname di mili-detik yang sama | Antrean diproses sekuensial lewat lock database, stok akhir tepat sesuai stok fisik opname |
| **Optimistic Lock Test** | Mencegah lost-update data draft | Dua browser membuka halaman edit draft yang sama, melakukan edit dan submit bergantian | Browser kedua menerima error validasi konflik dan diminta reload data |
| **Idempotency Test** | Mencegah double submit request | Kirim dua request submit identik dengan jeda waktu sangat rapat (<500ms) | Request pertama sukses, request kedua mengembalikan pesan error transaksional aman |
| **Boundary Value Test** | Menguji validasi input fisik | Input stok fisik dengan angka negatif, desimal, dan bernilai sangat besar | Sistem menolak angka negatif & desimal, serta memproses angka batas besar dengan aman |

---

## 📁 13. File Structure

### 13.1. Files to Create

#### Backend Files
- `app/Models/StockOpnameRecord.php`
- `app/Models/StockOpnameItem.php`
- `app/Models/StockOpnameAuditLog.php`
- `app/Events/StockOpnameSubmitted.php`
- `app/Listeners/AdjustProductVariantStock.php`
- `app/Listeners/CheckStockThresholdAfterOpname.php`
- `app/Http/Controllers/StockOpname/StockOpnameController.php`
- `app/Http/Controllers/StockOpname/StockOpnameReportController.php`
- `app/Http/Requests/StockOpname/StockOpnameCreateRequest.php`
- `app/Http/Requests/StockOpname/StockOpnameUpdateRequest.php`
- `app/Http/Requests/StockOpname/StockOpnameSubmitRequest.php`
- `app/Http/Requests/StockOpname/StockOpnameUpdateNoteRequest.php`
- `database/migrations/2026_07_30_000001_create_stock_opname_records_table.php`
- `database/migrations/2026_07_30_000002_create_stock_opname_items_table.php`
- `database/migrations/2026_07_30_000003_create_stock_opname_audit_logs_table.php`
- `routes/stock_opname.php`

#### Frontend Files
- `resources/js/Pages/StockOpname/Index.jsx`
- `resources/js/Pages/StockOpname/Create.jsx`
- `resources/js/Pages/StockOpname/Edit.jsx`
- `resources/js/Pages/StockOpname/Show.jsx`
- `resources/js/Pages/Reports/StockOpname/Index.jsx`

### 13.2. Files to Modify
- `routes/web.php`
- `resources/js/Components/Layouts/Sidebar.jsx`
- `database/seeders/PermissionSeeder.php`
- `database/seeders/RoleSeeder.php`

---

## 📝 14. Detail Implementasi Teknikal

### 14.1. Request Validations

#### StockOpnameCreateRequest.php (Drafting Parsial Diizinkan)
```php
<?php

namespace App\Http\Requests\StockOpname;

use Illuminate\Foundation\Http\FormRequest;

class StockOpnameCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date|date_format:Y-m-d',
            'note' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            // Nullable karena drafting parsial diizinkan selama berstatus DRAFT. Max 2147483647 untuk database integer safety.
            'items.*.physical_stock' => 'nullable|integer|min:0|max:2147483647',
        ];
    }
}
```

#### StockOpnameUpdateRequest.php (Optimistic Lock & Ownership Handling)
```php
<?php

namespace App\Http\Requests\StockOpname;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\StockOpnameRecord;

class StockOpnameUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = StockOpnameRecord::findOrFail($this->route('stock_opname'));
        
        // Ownership check: hanya pembuat draft atau Admin (dengan permission bypass) yang bisa mengupdate draft
        return $this->user()->hasRole('Admin') || 
               $this->user()->hasPermissionTo('stock_opname.bypass_ownership') || 
               $record->created_by === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date|date_format:Y-m-d',
            'note' => 'nullable|string|max:500',
            'last_updated_at' => 'required|date_format:Y-m-d H:i:s', // Verifikasi Optimistic Locking
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.physical_stock' => 'nullable|integer|min:0|max:2147483647',
        ];
    }
}
```

#### StockOpnameSubmitRequest.php (Wajib Lengkap, Max Integer, & Ownership)
```php
<?php

namespace App\Http\Requests\StockOpname;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Template;
use App\Models\StockOpnameRecord;

class StockOpnameSubmitRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = StockOpnameRecord::findOrFail($this->route('stock_opname'));
        return $this->user()->hasRole('Admin') || 
               $this->user()->hasPermissionTo('stock_opname.bypass_ownership') || 
               $record->created_by === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'last_updated_at' => 'required|date_format:Y-m-d H:i:s',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            // Wajib diisi (tidak boleh null) & max value PostgreSQL integer safety saat submit
            'items.*.physical_stock' => 'required|integer|min:0|max:2147483647',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Validasi Kelengkapan: Varian wajib mencakup seluruh template aktif (no partial counting on submit)
            $activeTemplate = Template::where('is_active', true)->first();
            if (!$activeTemplate) {
                $validator->errors()->add('template', 'Tidak ada template aktif di sistem.');
                return;
            }

            $templateVariantIds = $activeTemplate->variants()->pluck('product_variants.id')->toArray();
            $submittedVariantIds = collect($this->input('items'))->pluck('product_variant_id')->toArray();

            $missingIds = array_diff($templateVariantIds, $submittedVariantIds);
            if (count($missingIds) > 0) {
                $validator->errors()->add('items', 'Seluruh varian produk pada template aktif wajib dihitung fisiknya saat submit final (tidak boleh parsial).');
            }
        });
    }
}
```

#### StockOpnameUpdateNoteRequest.php (Konsistensi Form Request)
```php
<?php

namespace App\Http\Requests\StockOpname;

use Illuminate\Foundation\Http\FormRequest;

class StockOpnameUpdateNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'note' => 'nullable|string|max:500'
        ];
    }
}
```

---

### 14.2. Event Driven Architecture

#### Event: `StockOpnameSubmitted.php`
```php
<?php

namespace App\Events;

use App\Models\StockOpnameRecord;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockOpnameSubmitted
{
    use Dispatchable, SerializesModels;

    public $record;

    public function __construct(StockOpnameRecord $record)
    {
        $this->record = $record;
    }
}
```

#### Listener: `AdjustProductVariantStock.php` (Memutasi Stok Secara Sinkron dalam DB Transaction)
```php
<?php

namespace App\Listeners;

use App\Events\StockOpnameSubmitted;
use App\Models\ProductVariant;

class AdjustProductVariantStock
{
    /**
     * Listener sinkron yang memutasi stok fisik ke product variants.
     * Berjalan di dalam database transaction dari controller.
     */
    public function handle(StockOpnameSubmitted $event): void
    {
        $record = $event->record->load('items');

        foreach ($record->items as $item) {
            // Lakukan Row-level locking pada product variant
            $variant = ProductVariant::lockForUpdate()->findOrFail($item->product_variant_id);
            
            // Stok sistem submit diset ke stok sistem sebelum update
            $systemStockSubmit = $variant->stock_current;
            $physicalStock = $item->physical_stock;
            $difference = $physicalStock - $systemStockSubmit;

            // Simpan snapshot sistem submit aktual ke database (bukan dari payload)
            $item->update([
                'system_stock_submit' => $systemStockSubmit,
                'difference' => $difference,
            ]);

            // Mutasikan stok fisik secara mutlak
            $variant->stock_current = $physicalStock;
            $variant->save();
        }
    }
}
```

#### Listener: `CheckStockThresholdAfterOpname.php`
```php
<?php

namespace App\Listeners;

use App\Events\StockOpnameSubmitted;
use App\Services\StockThresholdService;

class CheckStockThresholdAfterOpname
{
    protected $thresholdService;

    public function __construct(StockThresholdService $thresholdService)
    {
        $this->thresholdService = $thresholdService;
    }

    public function handle(StockOpnameSubmitted $event): void
    {
        $record = $event->record->load('items.productVariant');

        foreach ($record->items as $item) {
            $variant = $item->productVariant;
            $this->thresholdService->checkVariant($variant);
        }
    }
}
```

---

### 14.3. Controller Implementation (Security & Safety)

#### `StockOpnameController.php`
```php
<?php

namespace App\Http\Controllers\StockOpname;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockOpname\StockOpnameCreateRequest;
use App\Http\Requests\StockOpname\StockOpnameUpdateRequest;
use App\Http\Requests\StockOpname\StockOpnameSubmitRequest;
use App\Http\Requests\StockOpname\StockOpnameUpdateNoteRequest;
use App\Models\StockOpnameRecord;
use App\Models\StockOpnameItem;
use App\Models\StockOpnameAuditLog;
use App\Models\ProductVariant;
use App\Events\StockOpnameSubmitted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StockOpnameController extends Controller
{
    public function store(StockOpnameCreateRequest $request)
    {
        try {
            $validated = $request->validated();

            $record = DB::transaction(function () use ($validated) {
                $opname = StockOpnameRecord::create([
                    'date' => $validated['date'],
                    'status' => 'draft',
                    'note' => $validated['note'] ?? null,
                    'created_by' => Auth::id(),
                ]);

                foreach ($validated['items'] as $item) {
                    $variant = ProductVariant::findOrFail($item['product_variant_id']);
                    $systemStock = $variant->stock_current;
                    $physicalStock = $item['physical_stock'] ?? null;
                    $difference = $physicalStock !== null ? ($physicalStock - $systemStock) : null;

                    $opname->items()->create([
                        'product_variant_id' => $item['product_variant_id'],
                        'system_stock_draft' => $systemStock,
                        'system_stock_submit' => 0,
                        'physical_stock' => $physicalStock,
                        'difference' => $difference,
                    ]);
                }

                // Log audit trail pembuatan draft
                StockOpnameAuditLog::create([
                    'stock_opname_record_id' => $opname->id,
                    'user_id' => Auth::id(),
                    'action' => 'created',
                    'new_values' => $opname->toArray(),
                ]);

                return $opname;
            });

            return redirect()->route('stock-opname.index')
                ->with('success', 'Stock opname berhasil disimpan sebagai draft.');

        } catch (\Exception $e) {
            Log::error('Failed to create draft stock opname', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Gagal menyimpan draft: ' . $e->getMessage())->withInput();
        }
    }

    public function update(StockOpnameUpdateRequest $request, string $id)
    {
        try {
            $validated = $request->validated();

            DB::transaction(function () use ($id, $validated) {
                // Lock record opname agar aman selama update
                $record = StockOpnameRecord::lockForUpdate()->findOrFail($id);

                if ($record->isSubmitted()) {
                    throw new \Exception('Dokumen stock opname ini sudah disubmit sebelumnya.');
                }

                // Optimistic Locking verification
                if ($record->updated_at->format('Y-m-d H:i:s') !== $validated['last_updated_at']) {
                    throw new \Exception('Data telah diperbarui oleh pengguna lain. Silakan reload data.');
                }

                $oldValues = $record->load('items')->toArray();

                $record->update([
                    'date' => $validated['date'],
                    'note' => $validated['note'] ?? null,
                ]);

                // Update items langsung tanpa delete-and-recreate untuk menjaga created_at asli
                foreach ($validated['items'] as $itemData) {
                    $item = StockOpnameItem::where('stock_opname_record_id', $record->id)
                        ->where('product_variant_id', $itemData['product_variant_id'])
                        ->first();

                    $physicalStock = $itemData['physical_stock'] ?? null;
                    
                    if ($item) {
                        $difference = $physicalStock !== null ? ($physicalStock - $item->system_stock_draft) : null;
                        $item->update([
                            'physical_stock' => $physicalStock,
                            'difference' => $difference,
                        ]);
                    }
                }

                // Log audit trail perubahan draft
                StockOpnameAuditLog::create([
                    'stock_opname_record_id' => $record->id,
                    'user_id' => Auth::id(),
                    'action' => 'updated_draft',
                    'old_values' => $oldValues,
                    'new_values' => $record->load('items')->toArray(),
                ]);
            });

            return redirect()->route('stock-opname.index')
                ->with('success', 'Draft stock opname berhasil diperbarui.');

        } catch (\Exception $e) {
            Log::error('Failed to update draft stock opname', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Gagal memperbarui draft: ' . $e->getMessage())->withInput();
        }
    }

    public function submit(StockOpnameSubmitRequest $request, string $id)
    {
        try {
            $validated = $request->validated();
            
            $result = DB::transaction(function () use ($id, $validated) {
                // 1. Lock record stock opname untuk mencegah double submit race condition (Idempotency)
                $record = StockOpnameRecord::lockForUpdate()->findOrFail($id);

                if ($record->isSubmitted()) {
                    throw new \Exception('Dokumen stock opname ini sudah disubmit sebelumnya.');
                }

                // 2. Verifikasi Optimistic Locking
                if ($record->updated_at->format('Y-m-d H:i:s') !== $validated['last_updated_at']) {
                    throw new \Exception('Data telah diperbarui oleh pengguna lain. Silakan reload data.');
                }

                // 3. Update data fisik item sebelum disubmit (tanpa menghapus data item asli agar created_at terjaga)
                foreach ($validated['items'] as $itemData) {
                    $item = StockOpnameItem::where('stock_opname_record_id', $record->id)
                        ->where('product_variant_id', $itemData['product_variant_id'])
                        ->firstOrFail();

                    $item->update([
                        'physical_stock' => $itemData['physical_stock']
                    ]);
                }

                // 4. Ubah status transaksi menjadi submit dan catat detail audit user
                $record->update([
                    'status' => 'submit',
                    'submitted_by' => Auth::id(),
                    'submitted_at' => now(),
                ]);

                // 5. Pemicu Event synchronous pasca submit sukses (Melakukan mutasi stok dalam transaksi aktif)
                event(new StockOpnameSubmitted($record));

                // Log audit trail submission
                StockOpnameAuditLog::create([
                    'stock_opname_record_id' => $record->id,
                    'user_id' => Auth::id(),
                    'action' => 'submitted',
                    'new_values' => $record->load('items')->toArray(),
                ]);

                return $record;
            });

            return redirect()->route('stock-opname.index')
                ->with('success', 'Stock opname berhasil disubmit. Kuantitas stok produk diperbarui.');

        } catch (\Exception $e) {
            Log::error('Stock opname submit failure', [
                'record_id' => $id,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Gagal memproses submit: ' . $e->getMessage());
        }
    }

    public function updateNote(StockOpnameUpdateNoteRequest $request, string $id)
    {
        $record = StockOpnameRecord::findOrFail($id);

        // Aturan Immutability Catatan: Cegah update note pada dokumen yang sudah disubmit
        if ($record->isSubmitted()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Catatan dokumen yang telah disubmit bersifat permanen (immutable).'
            ], 403);
        }

        $validated = $request->validated();
        
        $oldNote = $record->note;
        $record->update([
            'note' => $validated['note'] ?? null
        ]);

        // Log audit trail update catatan
        StockOpnameAuditLog::create([
            'stock_opname_record_id' => $record->id,
            'user_id' => Auth::id(),
            'action' => 'updated_note',
            'old_values' => ['note' => $oldNote],
            'new_values' => ['note' => $record->note],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Catatan berhasil diperbarui.'
        ]);
    }
}
```

---

### 14.4. Routing Configuration

#### `routes/stock_opname.php`
```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StockOpname\StockOpnameController;
use App\Http\Controllers\StockOpname\StockOpnameReportController;

Route::middleware(['auth', 'verified'])->group(function () {
    // Reports & Export
    Route::get('/reports/stock-opname', [StockOpnameReportController::class, 'index'])
        ->name('reports.stock-opname.index')
        ->middleware('can:view_reports');
        
    Route::get('/reports/stock-opname/export', [StockOpnameReportController::class, 'export'])
        ->name('reports.stock-opname.export')
        ->middleware('can:export_reports'); // Dipisahkan untuk security (data exfiltration mitigation)

    // Stock Opname Resources
    Route::get('/stock-opname', [StockOpnameController::class, 'index'])
        ->name('stock-opname.index')
        ->middleware('can:stock_opname.view');

    Route::get('/stock-opname/create', [StockOpnameController::class, 'create'])
        ->name('stock-opname.create')
        ->middleware('can:stock_opname.create');

    Route::post('/stock-opname', [StockOpnameController::class, 'store'])
        ->name('stock-opname.store')
        ->middleware('can:stock_opname.create');

    Route::get('/stock-opname/{stock_opname}', [StockOpnameController::class, 'show'])
        ->name('stock-opname.show')
        ->middleware('can:stock_opname.view');

    Route::get('/stock-opname/{stock_opname}/edit', [StockOpnameController::class, 'edit'])
        ->name('stock-opname.edit')
        ->middleware('can:stock_opname.edit');

    Route::put('/stock-opname/{stock_opname}', [StockOpnameController::class, 'update'])
        ->name('stock-opname.update')
        ->middleware('can:stock_opname.update');

    Route::delete('/stock-opname/{stock_opname}', [StockOpnameController::class, 'destroy'])
        ->name('stock-opname.destroy')
        ->middleware('can:stock_opname.delete');

    // Throttled Submit Endpoint untuk Keamanan (Mencegah double click lag)
    Route::post('/stock-opname/{stock_opname}/submit', [StockOpnameController::class, 'submit'])
        ->name('stock-opname.submit')
        ->middleware(['can:stock_opname.submit', 'throttle:5,1']);

    // Update note cepat (Hanya draft)
    Route::put('/stock-opname/{stock_opname}/note', [StockOpnameController::class, 'updateNote'])
        ->name('stock-opname.update-note')
        ->middleware('can:stock_opname.update');
});
```

---

## ✅ 15. Checklist Sebelum Rilis
- [ ] File migrasi telah lolos verifikasi dan dijalankan di server staging.
- [ ] Relasi model teruji dengan baik dan memproses penghapusan cascading secara aman (untuk draft).
- [ ] Logika database transaction terbukti melakukan rollback jika terjadi kegagalan data di tengah proses.
- [ ] Modal konfirmasi di frontend menampilkan ringkasan data selisih secara akurat sesuai input.
- [ ] Integrasi dengan `StockThresholdService` terbukti mengirimkan peringatan jika stok di bawah batas minimum.
- [ ] Izin (permission) baru `export_reports` dan `stock_opname.*` telah ditambahkan pada seeder role dan permission.

---

## 🔮 16. Future Enhancements
Beberapa pengembangan fitur ini di masa depan meliputi:
1. **Dukungan Scan Barcode / QR Code:** Integrasi kamera smartphone atau scanner bluetooth untuk melakukan scan SKU produk sehingga input stok fisik menjadi lebih cepat tanpa mengetik manual.
2. **Foto Bukti Fisik:** Menambahkan attachment berupa foto kondisi tumpukan barang di gudang sebagai lampiran pendukung dokumen opname.
3. **Approval Flow Berjenjang:** Menyediakan workflow di mana operator melakukan draft counting, lalu supervisor mereview selisih yang tinggi (> 10% discrepancy) sebelum memberikan persetujuan submit final.

---
**📄 End of PRD**
