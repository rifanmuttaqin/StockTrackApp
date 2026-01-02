# Product Requirements Document (PRD)
## Aplikasi Monitoring Stock Keluar

---

## 1. Overview Produk

Aplikasi Monitoring Stock Keluar adalah sistem internal yang dirancang khusus untuk mencatat, memantau, dan melaporkan pergerakan stock keluar dari gudang atau lokasi penyimpanan. Aplikasi ini berfungsi mirip dengan form stock opname namun fokus pada pencatatan barang yang keluar, bukan barang yang masuk.

Aplikasi ini dikembangkan dengan pendekatan mobile-first untuk memudahkan penggunaan dalam operasional harian, dengan antarmuka yang sederhana dan proses input yang cepat serta minim klik. Sistem ini menggunakan template untuk mempercepat proses input data stock keluar secara berulang.

### Teknologi yang Digunakan
- **Backend**: Laravel
- **Frontend**: Inertia.js dengan UI Mobile-first
- **Database**: PostgreSQL

---

## 2. Tujuan Bisnis

### Tujuan Utama
- **Meningkatkan Akurasi Data**: Menyediakan sistem pencatatan stock keluar yang akurat dan terstandar
- **Efisiensi Operasional**: Mempercepat proses pencatatan stock keluar dengan penggunaan template
- **Visibility Real-time**: Memberikan informasi aktual mengenai pergerakan stock keluar
- **Pelaporan Terstruktur**: Menyediakan laporan yang komprehensif untuk pengambilan keputusan bisnis

### Target Bisnis
- Mengurangi kesalahan manual dalam pencatatan stock keluar
- Mempercepat proses inventory control
- Memberikan data yang reliable untuk perencanaan pembelian
- Menyederhanakan proses audit internal

---

## 3. Ruang Lingkup

### In Scope
1. **Master Data Management**
   - Manajemen Produk dan Varian Produk
   - Tracking stock current per varian

2. **Template Management**
   - Pembuatan dan pengelolaan template stock keluar
   - Penentuan template aktif

3. **Stock Out Recording**
   - Input stock keluar berbasis template
   - Manajemen status Draft dan Submit
   - Update otomatis stock current saat submit

4. **Reporting System**
   - Laporan stock keluar berdasarkan berbagai filter
   - Export data laporan

5. **Mobile-First UI/UX**
   - Antarmuka yang dioptimalkan untuk perangkat mobile
   - Proses input yang cepat dan minim klik

### Out of Scope
1. **Stock Masuk Management**
   - Tidak mencakup pencatatan barang masuk
   - Tidak ada integrasi dengan sistem penerimaan barang

2. **Multi-Location/Warehouse Management**
   - Fokus pada satu lokasi/gudang
   - Tidak ada fitur transfer antar lokasi

3. **Purchase Order Management**
   - Tidak ada integrasi dengan sistem pembelian
   - Tidak ada fungsi reorder point

4. **Advanced Analytics**
   - Tidak ada prediksi atau forecasting
   - Tidak ada dashboard analytics kompleks

5. **User Management & Authentication**
   - Asumsikan sudah ada sistem autentikasi terpisah
   - Tidak ada SSO atau manajemen pengguna kompleks

---

## 4. User Persona

### Primary User: Inventory Staff
- **Demografi**: Usia 25-40 tahun, lulusan SMA/D3
- **Pengalaman Teknis**: Terbiasa dengan aplikasi mobile dasar
- **Karakteristik**: 
  - Detail-oriented dan teliti
  - Bekerja dengan rutinitas harian yang jelas
  - Membutuhkan proses input yang cepat dan tidak rumit
- **Pain Points**:
  - Proses pencatatan manual yang rawan error
  - Keterlambatan update data stock
  - Kesulitan membuat laporan harian

### Secondary User: Warehouse Supervisor
- **Demografi**: Usia 30-45 tahun, pengalaman 5+ tahun di bidang logistik
- **Pengalaman Teknis**: Terbiasa dengan sistem inventory dasar
- **Karakteristik**:
  - Bertanggung jawab atas akurasi data
  - Membutuhkan laporan untuk monitoring harian
  - Memerlukan akses ke data historis
- **Pain Points**:
  - Sulit memantau pergerakan stock secara real-time
  - Kesulitan dalam membuat laporan komprehensif
  - Tidak ada visibility terhadap trend pergerakan stock

### Tertiary User: Management
- **Demografi**: Usia 35-50 tahun, posisi manajerial
- **Pengalaman Teknis**: Terbiasa dengan dashboard dan laporan
- **Karakteristik**:
  - Fokus pada data untuk pengambilan keputusan
  - Membutuhkan insight dari data stock
  - Memerlukan akses ke laporan ringkasan
- **Pain Points**:
  - Tidak ada data yang reliable untuk perencanaan
  - Sulit melakukan audit internal
  - Tidak ada visibility terhadap efisiensi operasional

---

## 5. User Flow

### Flow 1: Master Data Management
1. User mengakses menu Master Produk
2. User menambahkan produk baru dengan informasi dasar (nama, kode, deskripsi)
3. User menambahkan varian untuk setiap produk (ukuran, warna, dll)
4. User menginput stock awal untuk setiap varian
5. Sistem menyimpan data dan menampilkan daftar produk beserta varian dan stock current

### Flow 2: Template Creation & Management
1. User mengakses menu Template Stock Keluar
2. User membuat template baru dengan nama dan deskripsi
3. User menambahkan produk varian ke dalam template
4. User menyimpan template
5. User dapat mengedit atau menghapus template yang ada
6. User mengatur template aktif melalui menu Pengaturan

### Flow 3: Stock Out Input (Draft)
1. User mengakses menu Input Stock Keluar
2. User memilih tanggal input
3. Sistem otomatis menampilkan template aktif
4. User menginput quantity stock keluar untuk setiap varian dalam template
5. User menyimpan sebagai Draft
6. Sistem menyimpan data tanpa mengubah stock current

### Flow 4: Stock Out Submission
1. User membuka data Draft yang tersimpan
2. User melakukan review dan perubahan jika diperlukan
3. User mengubah status dari Draft menjadi Submit
4. Sistem memvalidasi data dan mengurangi stock current
5. Sistem menyimpan data dengan status Submit
6. Data masuk ke dalam sistem laporan

### Flow 5: Report Generation
1. User mengakses menu Laporan
2. User memilih filter (tanggal, produk, varian, template)
3. Sistem menampilkan data yang sesuai dengan filter
4. User dapat melihat detail data
5. User dapat export laporan ke format Excel/PDF

---

## 6. Functional Requirements

### FR-1: Master Data Management

#### FR-1.1: Product Management
- User dapat menambah produk baru dengan fields: nama, kode, deskripsi
- User dapat mengedit data produk yang ada
- User dapat menghapus produk (jika tidak ada transaksi terkait)
- Sistem menampilkan daftar produk dengan pagination
- Sistem menyediakan fungsi search pada daftar produk

#### FR-1.2: Product Variant Management
- User dapat menambah varian untuk setiap produk dengan fields: nama varian, kode varian, stock current
- User dapat mengedit data varian yang ada
- User dapat menghapus varian (jika tidak ada transaksi terkait)
- Sistem menampilkan daftar varian per produk
- Sistem menyediakan fungsi search pada daftar varian

#### FR-1.3: Stock Management
- Sistem tracking stock current untuk setiap varian
- Stock current berkurang otomatis saat stock keluar di-submit
- Sistem menyimpan histori perubahan stock
- User dapat melakukan adjustment stock manual (dengan alasan)

### FR-2: Template Management

#### FR-2.1: Template Creation
- User dapat membuat template baru dengan fields: nama, deskripsi
- User dapat menambahkan produk varian ke dalam template
- User dapat mengatur urutan produk varian dalam template
- Sistem menyimpan template dengan status aktif/non-aktif

#### FR-2.2: Template Management
- User dapat mengedit template yang ada (nama, deskripsi, daftar varian)
- User dapat menghapus template (jika tidak ada transaksi terkait)
- Sistem menampilkan daftar template dengan status
- User dapat mengatur template aktif melalui menu Pengaturan

#### FR-2.3: Template Usage
- Sistem otomatis menggunakan template aktif saat input stock keluar
- User dapat mengganti template saat input (jika ada multiple template)
- Sistem menampilkan daftar varian sesuai template yang dipilih

### FR-3: Stock Out Input

#### FR-3.1: Input Process
- User dapat memilih tanggal input
- Sistem menampilkan template aktif secara default
- User dapat menginput quantity stock keluar per varian
- Sistem melakukan validasi input (tidak boleh negatif, tidak boleh melebihi stock current)
- Sistem menyimpan data dengan status Draft

#### FR-3.2: Draft Management
- User dapat melihat daftar data Draft
- User dapat mengedit data Draft
- User dapat menghapus data Draft
- User dapat mengubah status Draft menjadi Submit

#### FR-3.3: Submission Process
- Sistem melakukan validasi final saat submit
- Sistem mengurangi stock current otomatis saat submit
- Sistem menyimpan data dengan status Submit
- Sistem mencatat waktu submit dan user yang submit
- Data Submit tidak dapat diubah (hanya dapat dibatalkan dengan alasan)

### FR-4: Reporting System

#### FR-4.1: Report Generation
- User dapat memilih filter: tanggal range, produk, varian, template
- Sistem menampilkan data sesuai filter
- Sistem menampilkan summary total stock keluar
- Sistem menampilkan detail per transaksi

#### FR-4.2: Report Export
- User dapat export laporan ke format Excel
- User dapat export laporan ke format PDF
- Sistem menyediakan format laporan yang standar
- Export hanya untuk data berstatus Submit

#### FR-4.3: Report Viewing
- User dapat melihat detail transaksi stock keluar
- Sistem menampilkan informasi: tanggal, template, varian, quantity, user
- User dapat melakukan search pada laporan
- Sistem menampilkan data dengan pagination

### FR-5: User Interface & Experience

#### FR-5.1: Mobile-First Design
- Antarmuka dioptimalkan untuk layar mobile minimal 320px
- Tombol dan elemen interaktif memiliki ukuran minimal 44px
- Form input yang mudah digunakan dengan thumb
- Navigasi yang sederhana dan intuitif

#### FR-5.2: Input Efficiency
- Proses input stock keluar minimal 3 klik per varian
- Sistem menyimpan state input secara otomatis
- User dapat navigasi antar varian dengan swipe atau tombol next/prev
- Sistem menyediakan autocomplete untuk pencarian produk

#### FR-5.3: Visual Feedback
- Sistem memberikan feedback visual untuk setiap aksi
- Sistem menampilkan notifikasi untuk error dan success
- Sistem menampilkan loading state untuk proses yang memakan waktu
- Sistem menampilkan konfirmasi untuk aksi krusial

---

## 7. Non-Functional Requirements

### NFR-1: Performance
- **Response Time**: Waktu respon maksimal 2 detik untuk operasi standar
- **Load Time**: Halaman utama dimuat dalam maksimal 3 detik pada koneksi 3G
- **Concurrent Users**: Sistem dapat menangani minimal 50 concurrent users
- **Data Processing**: Laporan dengan 10.000 records dimuat dalam maksimal 5 detik

### NFR-2: Reliability
- **Uptime**: Sistem tersedia 99.5% waktu operasional (jam kerja)
- **Data Integrity**: Tidak ada kehilangan data saat sistem failure
- **Backup**: Data backup harian dengan retensi 30 hari
- **Recovery**: Sistem dapat pulih dalam maksimal 1 jam setelah downtime

### NFR-3: Usability
- **Learnability**: User baru dapat menggunakan sistem dasar dalam 30 menit
- **Efficiency**: Input stock keluar untuk 20 varian dapat diselesaikan dalam 5 menit
- **Error Prevention**: Sistem mencegah 90% error input melalui validasi
- **Satisfaction**: User satisfaction rate minimal 4/5 dalam survey

### NFR-4: Security
- **Authentication**: Sistem menggunakan autentikasi yang sudah ada
- **Authorization**: Akses berdasarkan role yang ditentukan
- **Data Protection**: Data sensitif dienkripsi di database
- **Audit Trail**: Semua perubahan data tercatat dengan user dan timestamp

### NFR-5: Compatibility
- **Browser**: Kompatibel dengan Chrome, Firefox, Safari versi terbaru
- **Mobile**: Optimal pada iOS 12+ dan Android 8+
- **Screen Resolution**: Responsif dari 320px hingga 1920px width
- **Orientation**: Mendukung portrait dan landscape orientation

---

## 8. Data Model

### Tabel Utama

#### products
- **id** (PK, UUID)
- **code** (VARCHAR, Unique, Not Null)
- **name** (VARCHAR, Not Null)
- **description** (TEXT, Nullable)
- **created_at** (TIMESTAMP, Not Null)
- **updated_at** (TIMESTAMP, Not Null)

#### product_variants
- **id** (PK, UUID)
- **product_id** (FK to products, Not Null)
- **code** (VARCHAR, Not Null)
- **name** (VARCHAR, Not Null)
- **current_stock** (INTEGER, Default 0, Not Null)
- **created_at** (TIMESTAMP, Not Null)
- **updated_at** (TIMESTAMP, Not Null)

#### stock_out_templates
- **id** (PK, UUID)
- **name** (VARCHAR, Not Null)
- **description** (TEXT, Nullable)
- **is_active** (BOOLEAN, Default False, Not Null)
- **created_by** (VARCHAR, Not Null)
- **created_at** (TIMESTAMP, Not Null)
- **updated_at** (TIMESTAMP, Not Null)

#### stock_out_template_items
- **id** (PK, UUID)
- **template_id** (FK to stock_out_templates, Not Null)
- **product_variant_id** (FK to product_variants, Not Null)
- **sort_order** (INTEGER, Default 0, Not Null)
- **created_at** (TIMESTAMP, Not Null)

#### stock_out_transactions
- **id** (PK, UUID)
- **transaction_date** (DATE, Not Null)
- **template_id** (FK to stock_out_templates, Not Null)
- **status** (ENUM: 'draft', 'submitted', Not Null)
- **notes** (TEXT, Nullable)
- **created_by** (VARCHAR, Not Null)
- **submitted_by** (VARCHAR, Nullable)
- **submitted_at** (TIMESTAMP, Nullable)
- **created_at** (TIMESTAMP, Not Null)
- **updated_at** (TIMESTAMP, Not Null)

#### stock_out_transaction_items
- **id** (PK, UUID)
- **transaction_id** (FK to stock_out_transactions, Not Null)
- **product_variant_id** (FK to product_variants, Not Null)
- **quantity** (INTEGER, Not Null)
- **created_at** (TIMESTAMP, Not Null)
- **updated_at** (TIMESTAMP, Not Null)

#### stock_adjustments
- **id** (PK, UUID)
- **product_variant_id** (FK to product_variants, Not Null)
- **adjustment_type** (ENUM: 'increase', 'decrease', Not Null)
- **quantity** (INTEGER, Not Null)
- **reason** (TEXT, Not Null)
- **created_by** (VARCHAR, Not Null)
- **created_at** (TIMESTAMP, Not Null)

### Relasi Utama
- **products** 1:N **product_variants**
- **stock_out_templates** 1:N **stock_out_template_items**
- **stock_out_templates** 1:N **stock_out_transactions**
- **stock_out_transactions** 1:N **stock_out_transaction_items**
- **product_variants** 1:N **stock_out_transaction_items**
- **product_variants** 1:N **stock_adjustments**

### Index yang Diperlukan
- Unique index pada products(code)
- Index pada product_variants(product_id)
- Index pada product_variants(code)
- Index pada stock_out_templates(is_active)
- Index pada stock_out_transactions(transaction_date)
- Index pada stock_out_transactions(status)
- Index pada stock_out_transaction_items(transaction_id)
- Index pada stock_out_transaction_items(product_variant_id)

---

## 9. Role & Permission

### Role yang Didefinisikan

#### Inventory Staff
- **Master Data**: View, Create, Edit
- **Template**: View, Create, Edit
- **Stock Input**: View, Create, Edit, Submit
- **Report**: View, Export
- **Settings**: View (terbatas)

#### Warehouse Supervisor
- **Master Data**: View, Create, Edit, Delete
- **Template**: View, Create, Edit, Delete
- **Stock Input**: View, Create, Edit, Submit, Cancel
- **Report**: View, Export, All Data Access
- **Settings**: Full Access
- **Stock Adjustment**: View, Create

#### Management
- **Master Data**: View Only
- **Template**: View Only
- **Stock Input**: View Only
- **Report**: View, Export, All Data Access
- **Settings**: View Only
- **Stock Adjustment**: View Only

### Permission Matrix

| Fitur | Inventory Staff | Warehouse Supervisor | Management |
|-------|-----------------|----------------------|------------|
| View Products | ✓ | ✓ | ✓ |
| Create Products | ✓ | ✓ | ✗ |
| Edit Products | ✓ | ✓ | ✗ |
| Delete Products | ✗ | ✓ | ✗ |
| View Templates | ✓ | ✓ | ✓ |
| Create Templates | ✓ | ✓ | ✗ |
| Edit Templates | ✓ | ✓ | ✗ |
| Delete Templates | ✗ | ✓ | ✗ |
| Set Active Template | ✗ | ✓ | ✗ |
| Create Stock Input | ✓ | ✓ | ✗ |
| Edit Stock Input | ✓ | ✓ | ✗ |
| Submit Stock Input | ✓ | ✓ | ✗ |
| Cancel Stock Input | ✗ | ✓ | ✗ |
| View Reports | ✓ | ✓ | ✓ |
| Export Reports | ✓ | ✓ | ✓ |
| Stock Adjustment | ✗ | ✓ | ✗ |
| User Management | ✗ | ✗ | ✗ |

---

## 10. Edge Case & Validasi

### Validasi Input

#### Master Data
- **Product Code**: Unique, tidak boleh kosong, format alphanumeric
- **Product Name**: Tidak boleh kosong, maksimal 100 karakter
- **Variant Code**: Unique per product, tidak boleh kosong
- **Variant Name**: Tidak boleh kosong, maksimal 100 karakter
- **Current Stock**: Minimal 0, integer

#### Template
- **Template Name**: Tidak boleh kosong, maksimal 100 karakter
- **Template Items**: Minimal 1 item, tidak boleh duplicate varian dalam template yang sama
- **Active Template**: Hanya satu template yang bisa aktif

#### Stock Input
- **Transaction Date**: Tidak boleh kosong, tidak boleh di masa depan
- **Quantity**: Minimal 1, tidak boleh melebihi current stock
- **Status**: Harus Draft atau Submitted
- **Draft to Submitted**: Validasi quantity vs current stock

### Edge Cases

#### Stock Management
- **Stock Negatif**: Sistem mencegah stock menjadi negatif
- **Concurrent Updates**: Sistem handle concurrent updates pada stock
- **Stock Adjustment**: Adjustment dengan alasan wajib
- **Stock Out of Range**: Input quantity melebihi current stock

#### Template Management
- **Template dengan Item Tidak Aktif**: Template tetap bisa digunakan jika varian tidak aktif
- **Delete Template dengan Transaksi**: Tidak bisa delete template yang sudah digunakan
- **Change Active Template**: Transaksi yang sedang berjalan tetap menggunakan template lama

#### Transaction Management
- **Edit Submitted Transaction**: Tidak bisa edit transaksi yang sudah submitted
- **Delete Submitted Transaction**: Tidak bisa delete transaksi yang sudah submitted
- **Submit Draft dengan Invalid Data**: Validasi ulang saat submit

#### Reporting
- **Large Dataset**: Pagination untuk data > 100 records
- **Date Range**: Maksimal 1 tahun untuk report generation
- **No Data Found**: Menampilkan pesan yang jelas saat tidak ada data

### Error Handling
- **Network Error**: Menampilkan pesan error dengan opsi retry
- **Server Error**: Menampilkan pesan error yang user-friendly
- **Validation Error**: Menampilkan error spesifik per field
- **Permission Error**: Menampilkan pesan akses ditolak

---

## 11. Asumsi & Batasan

### Asumsi

#### Sistem Existing
- Sudah ada sistem autentikasi yang dapat diintegrasikan
- Sudah ada master data produk dasar yang dapat diimport
- User sudah terbiasa dengan penggunaan mobile device
- Koneksi internet tersedia di lokasi operasional

#### Operasional
- Input stock keluar dilakukan setiap hari kerja
- Template tidak berubah secara drastis dalam waktu singkat
- Stock adjustment jarang dilakukan (kasus khusus)
- Laporan dibutuhkan untuk monitoring harian dan mingguan

#### Teknis
- Device yang digunakan memiliki browser modern
- User memiliki akses internet yang stabil
- Tidak ada kebutuhan offline functionality
- Database backup sudah ada di infrastruktur perusahaan

### Batasan

#### Fungsionalitas
- Tidak ada multi-warehouse/lokasi support
- Tidak ada forecasting atau prediction capability
- Tidak ada integration dengan sistem eksternal
- Tidak ada barcode scanning capability

#### Teknis
- Maksimal 1000 produk dan 5000 varian
- Maksimal 50 concurrent users
- Maksimal 1000 transaksi per hari
- Tidak ada high availability setup

#### Operasional
- Hanya mendukung satu bahasa (Indonesia)
- Tidak ada multi-currency support
- Tidak ada audit trail kompleks
- Tidak ada approval workflow

---

## 12. Catatan Teknis untuk Developer

### Laravel Implementation Notes

#### Architecture
- Gunakan Laravel 9.x atau versi terbaru
- Implementasikan Repository Pattern untuk business logic
- Gunakan Service Class untuk complex operations
- Implementasikan Request Classes untuk validasi

#### Database
- Gunakan UUID untuk primary keys
- Implementasikan soft deletes untuk master data
- Gunakan database transactions untuk operasi kritis
- Implementasikan database indexing untuk performa query

#### API Design
- Gunakan API Resources untuk response formatting
- Implementasikan rate limiting untuk API endpoints
- Gunakan proper HTTP status codes
- Implementasikan API versioning

### Inertia.js Implementation Notes

#### Frontend Structure
- Gunakan Vue.js 3 dengan Composition API
- Implementasikan shared props untuk user data
- Gunakan Ziggy untuk route helper
- Implementasikan form state management dengan Pinia

#### Component Organization
- Buat reusable components untuk form elements
- Implementasikan layout components untuk consistency
- Gunakan composables untuk shared logic
- Implementasikan loading states dan error handling

#### Mobile-First Design
- Gunakan responsive design dengan CSS Grid/Flexbox
- Implementasikan touch-friendly interface elements
- Optimalkan untuk performa mobile
- Implementasikan PWA features jika memungkinkan

### PostgreSQL Implementation Notes

#### Database Design
- Gunakan UUID data type untuk primary keys
- Implementasikan proper foreign key constraints
- Gunakan index yang tepat untuk performa query
- Implementasikan database triggers untuk audit trail

#### Performance Optimization
- Gunakan query optimization untuk laporan kompleks
- Implementasikan database connection pooling
- Gunakan proper indexing strategy
- Monitor query performance dengan EXPLAIN ANALYZE

#### Backup & Recovery
- Implementasikan automated backup strategy
- Gunakan point-in-time recovery capability
- Test backup restoration procedures
- Implementasikan database monitoring

### Security Considerations

#### Authentication & Authorization
- Implementasikan proper middleware untuk route protection
- Gunakan Laravel Policy untuk authorization
- Implementasikan CSRF protection
- Validasi semua input data

#### Data Protection
- Enkripsi data sensitif di database
- Implementasikan proper session management
- Gunakan HTTPS untuk semua komunikasi
- Implementasikan input sanitization

### Deployment & DevOps

#### Environment Configuration
- Gunakan environment variables untuk konfigurasi
- Implementasikan proper logging strategy
- Gunakan queue system untuk background jobs
- Implementasikan caching strategy

#### Monitoring & Maintenance
- Implementasikan application monitoring
- Gunakan error tracking system
- Implementasikan health check endpoints
- Monitor database performance

### Testing Strategy

#### Unit Testing
- Test semua business logic di Service Classes
- Test validation rules di Request Classes
- Test database operations di Repository Classes
- Target coverage minimal 80%

#### Feature Testing
- Test semua user flows end-to-end
- Test form validation dan error handling
- Test authorization dan permissions
- Test API endpoints

#### Browser Testing
- Test responsive design pada berbagai ukuran layar
- Test touch interactions pada mobile devices
- Test cross-browser compatibility
- Implementasikan automated E2E testing

---

*Document Version: 1.0*
*Last Updated: 31 Desember 2023*
*Author: Senior Product Manager*