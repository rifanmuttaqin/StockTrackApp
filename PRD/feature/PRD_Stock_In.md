# 📘 Product Requirement Document (PRD) — Stock In

## 🧩 1. Ringkasan Singkat
**Deskripsi Singkat:**  
Fitur Stock In memungkinkan pengguna untuk mencatat dan mengelola stok masuk barang ke sistem inventory dengan workflow draft → submit yang sama seperti Stock Out. Fitur ini akan secara otomatis menambah stok produk saat record disubmit, menggunakan template aktif untuk struktur pencatatan, dan menyediakan laporan stok masuk yang komprehensif.

**Status:** Draft  
**Prioritas:** Tinggi  
**Tanggal:** 2026-01-29  
**Author:** AI Software Product Analyst & Technical Writer  

---

## 🎯 2. Tujuan & Latar Belakang
- Saat ini sistem sudah memiliki fitur Stock Out yang berjalan dengan baik untuk mencatat pengeluaran stok.
- Sistem belum memiliki pencatatan stok masuk yang terstruktur, sehingga pergerakan stok tidak dapat dilacak secara lengkap.
- Fitur Stock In diperlukan untuk melengkapi siklus inventory management (masuk dan keluar).
- Fitur ini akan menjadi dasar untuk implementasi fitur Stock History di masa depan yang akan merekam semua pergerakan stok.
- Menggunakan template aktif yang sama dengan Stock Out untuk konsistensi struktur pencatatan.
- Workflow draft → submit memungkinkan review dan validasi sebelum stok benar-benar ditambahkan ke sistem.

---

## 👥 3. Stakeholder
| Peran | Nama | Tanggung Jawab |
|-------|------|----------------|
| Product Owner |  | Menentukan prioritas dan scope fitur Stock In |
| Backend Developer |  | Implementasi controller, model, migration, dan API endpoints |
| Frontend Developer |  | Implementasi komponen React dan UI/UX |
| QA |  | Uji fitur sebelum rilis dan memastikan konsistensi dengan Stock Out |
| Database Administrator |  | Review dan approval struktur database |

---

## ⚙️ 4. Deskripsi Fitur
Fitur Stock In adalah mirror dari fitur Stock Out dengan perbedaan utama pada operasi stok (increment bukan decrement). Fitur ini mencakup:

### 4.1. Alur Utama (Main Flow)
1. Pengguna membuka halaman Stock In Index untuk melihat daftar record stok masuk
2. Pengguna membuat record Stock In baru dengan memilih tanggal dan item dari template aktif
3. Record disimpan sebagai draft (stok belum bertambah)
4. Pengguna dapat mengedit draft sebelum disubmit
5. Pengguna mensubmit record untuk menambah stok ke sistem
6. Stok produk varian bertambah sesuai quantity pada setiap item
7. Record berubah status dari draft menjadi submit
8. Pengguna dapat melihat laporan Stock In untuk analisis

### 4.2. Sub-Flow / Edge Case
- Jika tidak ada template aktif, sistem menampilkan pesan error dan mencegah pembuatan record baru
- Jika record sudah disubmit, record tidak dapat diubah atau dihapus
- Jika record dalam status draft, pengguna dapat mengedit atau menghapusnya
- Catatan (note) dapat ditambahkan atau diedit untuk record dalam status draft maupun submit
- Validasi quantity minimal 0 (tidak ada batasan maksimal karena stok masuk)
- Tidak ada validasi ketersediaan stok karena ini adalah stok masuk

### 4.3. UI/UX
- Halaman yang terlibat:
  - `StockIn/Index` - Daftar semua record Stock In dengan filter dan statistik
  - `StockIn/Create` - Form pembuatan record Stock In baru
  - `StockIn/Edit` - Form pengeditan record Stock In (draft only)
  - `StockIn/Show` - Detail record Stock In
  - `Reports/StockIn/Index` - Laporan Stock In dengan filter tanggal dan produk
- Elemen penting:
  - Status badge (Draft: yellow, Submit: green)
  - Transaction code dengan format ALBR-{12 digit}
  - Filter status (Semua, Draft, Submit)
  - Statistik cards (Total Draft, Total Submit, Total Items)
  - Modal untuk tambah/edit catatan
  - Mobile-responsive design dengan card layout
  - Color coding untuk produk (sama seperti Stock Out)

---

## 🧠 5. Behavior & Logika Bisnis
- Status workflow: draft → submit (tidak dapat kembali ke draft)
- Stock increment hanya terjadi saat submit, bukan saat create/update
- Transaction code di-generate otomatis dengan format ALBR-{12 digit random number}
- Transaction code bersifat unik dan tidak dapat diubah setelah dibuat
- Catatan (note) bersifat opsional, maksimal 500 karakter
- Catatan dapat diupdate untuk record dalam status draft maupun submit
- Record dalam status draft dapat diedit dan dihapus
- Record dalam status submit tidak dapat diedit atau dihapus
- Semua operasi dicatat di audit log untuk tracking
- Quantity minimal 0, tidak ada batasan maksimal
- Tidak ada validasi ketersediaan stok (karena ini stok masuk)
- Menggunakan template aktif yang sama dengan Stock Out untuk struktur item

---

## 🔌 6. Integrasi & API
### 6.1. Endpoint Baru
| Method | Endpoint | Deskripsi | Auth | Permission |
|---------|-----------|-----------|------|------------|
| GET | `/stock-in` | Daftar stock in records dengan filter | Required | `stock_in.view` |
| GET | `/stock-in/create` | Form pembuatan stock in baru | Required | `stock_in.create` |
| POST | `/stock-in` | Simpan stock in baru (draft) | Required | `stock_in.create` |
| GET | `/stock-in/{stockIn}` | Detail stock in record | Required | `stock_in.view` |
| GET | `/stock-in/{stockIn}/edit` | Form edit stock in (draft only) | Required | `stock_in.edit` |
| PUT | `/stock-in/{stockIn}` | Update stock in (draft only) | Required | `stock_in.update` |
| DELETE | `/stock-in/{stockIn}` | Hapus stock in (draft only) | Required | `stock_in.delete` |
| POST | `/stock-in/{stockIn}/submit` | Submit stock in (tambah stok) | Required | `stock_in.submit` |
| PUT | `/stock-in/{stockIn}/note` | Update catatan stock in | Required | `stock_in.update` |
| GET | `/reports/stock-in` | Laporan stock in dengan filter | Required | `view_reports` |

### 6.2. Endpoint yang Terpengaruh
| Endpoint | Perubahan |
|-----------|------------|
| `product_variants/{id}` | Stok akan bertambah saat stock in disubmit |
| `/dashboard` | Statistik dashboard akan mencakup data stock in (jika ditambahkan) |

---

## 🧱 7. Struktur Data
### 7.1. Model / Entity

#### StockInRecord
```php
StockInRecord {
    id: uuid (primary key)
    date: date
    status: string (draft | submit)
    transaction_code: string (ALBR-{12 digit}) | nullable
    note: text | nullable
    created_at: timestamp
    updated_at: timestamp
    
    Relationships:
    - items: HasMany[StockInItem]
    
    Accessors:
    - items_count: int (jumlah items)
    - total_quantity: int (total quantity semua items)
    
    Methods:
    - isDraft(): bool
    - isSubmitted(): bool
    - generateTransactionCode(): string
    - setTransactionCode(): void
}
```

#### StockInItem
```php
StockInItem {
    id: uuid (primary key)
    stock_in_record_id: uuid (foreign key to stock_in_records)
    product_variant_id: uuid (foreign key to product_variants)
    quantity: integer
    created_at: timestamp
    updated_at: timestamp
    
    Relationships:
    - stockInRecord: BelongsTo[StockInRecord]
    - productVariant: BelongsTo[ProductVariant]
    
    Accessors:
    - variantName: string | nullable
}
```

### 7.2. Migration / Schema

#### Migration 1: Create stock_in_records table
```sql
CREATE TABLE stock_in_records (
    id CHAR(36) PRIMARY KEY,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    transaction_code VARCHAR(20) NULL UNIQUE,
    note TEXT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    INDEX idx_date (date),
    INDEX idx_status (status)
);
```

#### Migration 2: Create stock_in_items table
```sql
CREATE TABLE stock_in_items (
    id CHAR(36) PRIMARY KEY,
    stock_in_record_id CHAR(36) NOT NULL,
    product_variant_id CHAR(36) NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    FOREIGN KEY (stock_in_record_id) 
        REFERENCES stock_in_records(id) 
        ON DELETE CASCADE,
    
    FOREIGN KEY (product_variant_id) 
        REFERENCES product_variants(id) 
        ON DELETE RESTRICT,
    
    INDEX idx_stock_in_record_id (stock_in_record_id),
    INDEX idx_product_variant_id (product_variant_id)
);
```

---

## 🧪 8. Acceptance Criteria
| No | Kriteria | Diterima Jika |
|----|-----------|---------------|
| 1 | Pengguna dapat membuat stock in record | Record tersimpan dengan status draft dan transaction code ter-generate |
| 2 | Pengguna dapat mengedit stock in draft | Data berhasil diupdate dan stok belum bertambah |
| 3 | Pengguna dapat menghapus stock in draft | Record dan items terhapus dari database |
| 4 | Pengguna dapat mensubmit stock in | Status berubah ke submit dan stok bertambah sesuai quantity |
| 5 | Stock in submit tidak dapat diedit | Sistem menolak request edit untuk record submit |
| 6 | Stock in submit tidak dapat dihapus | Sistem menolak request delete untuk record submit |
| 7 | Transaction code bersifat unik | Sistem menolak jika transaction code duplikat |
| 8 | Catatan dapat ditambahkan/diedit | Catatan tersimpan dan dapat diupdate untuk draft dan submit |
| 9 | Template aktif digunakan untuk struktur item | Item diambil dari template aktif yang sama dengan Stock Out |
| 10 | Laporan stock in dapat diakses | Laporan menampilkan data stock in dengan filter tanggal dan produk |
| 11 | Statistik ditampilkan dengan benar | Total draft, total submit, dan total items dihitung dengan benar |
| 12 | Filter status berfungsi | Daftar stock in dapat difilter berdasarkan status |
| 13 | Mobile-responsive design | UI berfungsi dengan baik di desktop dan mobile |
| 14 | Audit log tercatat | Semua aksi stock in dicatat di log |
| 15 | Error handling berfungsi | Pesan error yang jelas ditampilkan saat terjadi kesalahan |

---

## 🧰 9. Dependencies
- [x] Laravel 11.x framework
- [x] Inertia.js untuk frontend integration
- [x] React untuk UI components
- [x] Spatie Laravel Permission untuk permission management
- [x] Template system (sudah ada untuk Stock Out)
- [x] Product dan ProductVariant models (sudah ada)
- [x] Audit log system (sudah ada)
- [x] Stock Out implementation (sebagai referensi)

---

## 🧩 10. Risiko & Mitigasi
| Risiko | Dampak | Solusi |
|--------|---------|--------|
| Transaction code collision | Stock in gagal dibuat | Implementasi retry mechanism dengan fallback timestamp-based code |
| Race condition saat submit | Stok bertambah lebih dari seharusnya | Gunakan database transaction dan locking |
| Template aktif tidak tersedia | Tidak bisa membuat stock in | Tampilkan pesan error yang jelas dan redirect ke template management |
| Stok bertambah padahal seharusnya tidak | Data inventory tidak akurat | Validasi status record sebelum increment stok |
| User menghapus record submit | Stok tidak dikurangi kembali | Mencegah delete untuk record submit, hanya draft yang bisa dihapus |
| Performance issue dengan banyak data | Query lambat | Implementasi pagination dan indexing yang tepat |
| Inkonsistensi dengan Stock Out | UX tidak konsisten | Gunakan struktur dan pattern yang sama dengan Stock Out |

---

## 📊 11. Metrics / Success Criteria
- Target 100% consistency dengan pattern Stock Out
- Error rate < 2% untuk operasi stock in
- Average stock in creation time < 3 detik
- Stock increment accuracy 100%
- User dapat membuat stock dalam kurang dari 30 detik
- Laporan stock in dapat diakses dalam kurang dari 5 detik

---

## 🚀 12. Rencana Implementasi
| Tahap | Tugas | Penanggung Jawab | Estimasi |
|--------|-------|------------------|-----------|
| 1 | Buat migration untuk stock_in_records dan stock_in_items | Backend Dev | 0.5 hari |
| 2 | Buat models StockInRecord dan StockInItem | Backend Dev | 0.5 hari |
| 3 | Buat request validation classes (Create, Update, Submit) | Backend Dev | 0.5 hari |
| 4 | Implementasi StockInController (index, create, store, edit, update, destroy, show, updateNote) | Backend Dev | 1.5 hari |
| 5 | Implementasi StockInReportController | Backend Dev | 1 hari |
| 6 | Buat routes file untuk stock_in | Backend Dev | 0.5 hari |
| 7 | Buat permissions untuk stock_in di seeder | Backend Dev | 0.5 hari |
| 8 | Implementasi frontend Index component | Frontend Dev | 1 hari |
| 9 | Implementasi frontend Create component | Frontend Dev | 1 hari |
| 10 | Implementasi frontend Edit component | Frontend Dev | 1 hari |
| 11 | Implementasi frontend Show component | Frontend Dev | 0.5 hari |
| 12 | Implementasi frontend Report component | Frontend Dev | 1.5 hari |
| 13 | Update sidebar untuk menu Stock In | Frontend Dev | 0.5 hari |
| 14 | QA Testing | QA | 1 hari |
| 15 | Bug fixes dan refinements | Dev Team | 1 hari |
| **Total** | | | **12.5 hari** |

---

## 🧾 13. Catatan Tambahan
- Fitur Stock In dirancang sebagai mirror dari Stock Out untuk konsistensi UX dan kemudahan maintenance
- Perbedaan utama hanya pada operasi stok (increment vs decrement) dan tidak ada validasi ketersediaan stok
- Transaction code menggunakan prefix yang sama (ALBR-) untuk konsistensi
- Struktur database menggunakan UUID untuk primary keys, sama dengan Stock Out
- Semua operasi menggunakan database transaction untuk data integrity
- Audit logging diimplementasikan untuk semua aksi stock in
- Fitur ini akan menjadi dasar untuk implementasi Stock History di masa depan
- Pertimbangan untuk fitur masa depan: supplier information, purchase order number, batch tracking
- Catatan (note) field dapat digunakan untuk mencatat informasi tambahan seperti supplier atau referensi PO
- Cache active template untuk performance improvement

---

## ✅ 14. Checklist Sebelum Rilis
- [ ] Migration files sudah dijalankan di database
- [ ] Models sudah dibuat dengan relasi yang benar
- [ ] Request validation classes sudah lengkap
- [ ] Controllers sudah diimplementasikan dengan error handling
- [ ] Routes sudah ditambahkan dengan permissions yang benar
- [ ] Permissions sudah ditambahkan di database seeder
- [ ] Frontend components sudah diimplementasikan
- [ ] Sidebar sudah diupdate dengan menu Stock In
- [ ] Unit test untuk controllers dan models lulus
- [ ] Integration test untuk workflow draft → submit lulus
- [ ] QA checklist sudah disetujui
- [ ] Dokumentasi API diperbarui
- [ ] Testing di staging environment sukses
- [ ] Performance testing memenuhi criteria
- [ ] Approval Product Owner diterima

---

## 📁 15. File Structure

### 15.1. Files to Create

#### Backend Files

**Controllers:**
- `app/Http/Controllers/StockIn/StockInController.php` (mirip StockOutController dengan stock increment)
- `app/Http/Controllers/StockIn/StockInReportController.php` (mirip StockOutReportController)

**Models:**
- `app/Models/StockInRecord.php` (mirip StockOutRecord)
- `app/Models/StockInItem.php` (mirip StockOutItem)

**Request Validation:**
- `app/Http/Requests/StockIn/StockInCreateRequest.php` (mirip StockOutCreateRequest)
- `app/Http/Requests/StockIn/StockOutUpdateRequest.php` (mirip StockOutUpdateRequest)
- `app/Http/Requests/StockIn/StockInSubmitRequest.php` (mirip StockOutSubmitRequest TANPA validasi stock availability)

**Migrations:**
- `database/migrations/2026_01_29_000001_create_stock_in_records_table.php`
- `database/migrations/2026_01_29_000002_create_stock_in_items_table.php`

**Routes:**
- `routes/stock_in.php`

#### Frontend Files

**Pages:**
- `resources/js/Pages/StockIn/Index.jsx` (mirip StockOut/Index)
- `resources/js/Pages/StockIn/Create.jsx` (mirip StockOut/Create)
- `resources/js/Pages/StockIn/Edit.jsx` (mirip StockOut/Edit)
- `resources/js/Pages/StockIn/Show.jsx` (mirip StockOut/Show)

**Reports:**
- `resources/js/Pages/Reports/StockIn/Index.jsx` (mirip Reports/StockOut/Index)

### 15.2. Files to Modify

**Database Seeder:**
- `database/seeders/PermissionSeeder.php` (tambahkan permissions: stock_in.view, stock_in.create, stock_in.edit, stock_in.update, stock_in.delete, stock_in.submit)

**Sidebar Component:**
- `resources/js/Components/Layouts/Sidebar.jsx` (tambahkan menu Stock In dan Reports > Stock In)

**Main Routes File:**
- `routes/web.php` (include routes/stock_in.php)

---

## 📝 16. Implementation Details

### 16.1. StockInController Key Methods

**store() - Create Stock In as Draft:**
```php
public function store(StockInCreateRequest $request)
{
    $validatedData = $request->validated();
    
    $stockInRecord = DB::transaction(function () use ($validatedData) {
        // Create stock in record with status 'draft'
        $record = StockInRecord::create([
            'date' => $validatedData['date'],
            'status' => 'draft',
            'note' => $validatedData['note'] ?? null,
        ]);
        
        // Create stock in items
        foreach ($validatedData['items'] as $item) {
            $record->items()->create([
                'product_variant_id' => $item['product_variant_id'],
                'quantity' => $item['quantity'],
            ]);
        }
        
        return $record;
    });
    
    // Log action
    $this->logStockInAction('create_stock_in', $stockInRecord->id, [...]);
    
    return Inertia::render('StockIn/Index', [...]);
}
```

**submit() - Submit Stock In and Increment Stock:**
```php
public function submit(StockInSubmitRequest $request, StockInRecord $stockIn)
{
    $validatedData = $request->validated();
    
    $stockInRecord = DB::transaction(function () use ($stockIn, $validatedData) {
        $record = StockInRecord::with(['items.productVariant'])
            ->findOrFail($stockIn->id);
        
        // Validate if record is already submitted
        if ($record->isSubmitted()) {
            throw new \Exception('Stock in sudah disubmit sebelumnya.');
        }
        
        // Delete old items and create new items
        $record->items()->delete();
        foreach ($validatedData['items'] as $item) {
            $record->items()->create([
                'product_variant_id' => $item['product_variant_id'],
                'quantity' => $item['quantity'],
            ]);
        }
        
        // Reload items
        $record->load(['items.productVariant']);
        
        // INCREMENT stock current for each variant (PERBEDAAN UTAMA dengan Stock Out)
        foreach ($record->items as $item) {
            $variant = $item->productVariant;
            
            // Increment stock current (bukan decrement)
            $variant->increment('stock_current', $item->quantity);
        }
        
        // Update status to 'submit'
        $record->update([
            'status' => 'submit',
        ]);
        
        return $record;
    });
    
    // Log action
    $this->logStockInAction('submit_stock_in', $stockIn->id, [...]);
    
    return redirect()->route('stock-in.index')
        ->with('success', 'Stock in berhasil disubmit dan stok telah ditambahkan.');
}
```

### 16.2. StockInSubmitRequest Validation

**PERBEDAAN UTAMA dengan StockOutSubmitRequest:**
- TIDAK ada validasi `validateStockAvailability()`
- Stock in tidak perlu mengecek ketersediaan stok karena ini adalah penambahan stok

```php
public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        $this->validateDraftStatus($validator);
        // TIDAK ADA validateStockAvailability() seperti di StockOut
    });
}
```

### 16.3. StockInReportController

Mirip dengan StockOutReportController dengan perbedaan:
- Query `StockInRecord` bukan `StockOutRecord`
- Label dan pesan disesuaikan untuk "Stock In"
- Statistik dan data grouping sama persis

### 16.4. Frontend Components

Semua komponen frontend mirip dengan Stock Out dengan perubahan:
- Route names: `stock-in.*` bukan `stock-out.*`
- Labels: "Stock Masuk" bukan "Stock Keluar"
- Icons: sama (menggunakan icon yang sama untuk konsistensi)
- Color coding: sama dengan Stock Out
- Behavior: sama persis, hanya beda pada operasi backend

### 16.5. Permissions

Tambahkan permissions berikut di `PermissionSeeder.php`:
- `stock_in.view` - Melihat daftar dan detail stock in
- `stock_in.create` - Membuat stock in baru
- `stock_in.edit` - Mengedit stock in draft
- `stock_in.update` - Mengupdate stock in draft
- `stock_in.delete` - Menghapus stock in draft
- `stock_in.submit` - Mensubmit stock in

### 16.6. Sidebar Update

Tambahkan menu berikut di Sidebar.jsx:
```jsx
{
  name: 'Stock Masuk',
  href: '/stock-in',
  icon: DocumentTextIcon,
  permission: 'stock_in.view'
},
{
  name: 'Laporan Stock Masuk',
  href: '/reports/stock-in',
  icon: ChartBarIcon,
  permission: 'view_reports'
}
```

---

## 🔮 17. Future Enhancements

Fitur-fitur yang dapat ditambahkan di masa depan:

1. **Stock History Tracking**
   - Menggabungkan data stock in dan stock out
   - Timeline pergerakan stok per produk/varian
   - Filter berdasarkan tanggal, jenis transaksi, dan produk

2. **Supplier Management**
   - Tambah field supplier di stock_in_records
   - Relasi dengan supplier master data
   - Laporan stock in per supplier

3. **Purchase Order Integration**
   - Tambah field purchase_order_number
   - Link ke purchase order system
   - Tracking PO fulfillment

4. **Batch/Expiry Tracking**
   - Tambah batch number dan expiry date di stock_in_items
   - FIFO (First In, First Out) untuk stock out
   - Alert untuk produk mendekati expiry

5. **Multi-Location Inventory**
   - Tambah field location/warehouse
   - Transfer stock antar location
   - Laporan per location

6. **Approval Workflow**
   - Multi-level approval untuk stock in besar
   - Email notification untuk approval
   - Approval history tracking

7. **Advanced Reporting**
   - Trend analysis stock in vs stock out
   - Forecasting berdasarkan historical data
   - Custom report builder

---

**📄 End of PRD**
