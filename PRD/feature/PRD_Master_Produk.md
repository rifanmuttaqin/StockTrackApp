# PRD: Master Produk - StockTrackApp

## 1. Overview Produk

StockTrackApp adalah aplikasi internal monitoring stock keluar yang dirancang khusus untuk mencatat dan melaporkan pengurangan stok barang secara real-time. Aplikasi ini berfokus pada kemudahan penggunaan dengan pendekatan mobile-first, memungkinkan operasional harian berjalan cepat dengan minimal interaksi pengguna.

**Teknologi Utama:**
- **Backend:** Laravel 10.x
- **Frontend:** Inertia.js dengan desain Mobile-first
- **Database:** PostgreSQL
- **Styling:** TailwindCSS

**Fokus Utama:**
- Mobile-first design untuk kemudahan akses di perangkat mobile
- Kecepatan input dengan minimal klik
- Template-based input untuk efisiensi operasional
- Kontrol status Draft dan Submit untuk akurasi data

---

## 2. Tujuan Bisnis

### 2.1 Monitoring Stock Keluar Real-time
- Memberikan kemampuan pemantauan stock keluar secara akurat dan tepat waktu
- Mengurangi kesalahan manual dalam pencatatan stock keluar
- Menyediakan data real-time untuk keputusan bisnis

### 2.2 Mempercepat Operasional
- Menggunakan template-based input untuk mengurangi waktu input
- Mengurangi jumlah klik yang diperlukan untuk input stock keluar
- Memungkinkan input harian yang cepat dan efisien

### 2.3 Kontrol Pengurangan Stock
- Mekanisme Draft untuk review sebelum finalisasi
- Status Submit untuk mengurangi stock current secara otomatis
- Mencegah kesalahan input yang berdampak pada stock

### 2.4 Laporan Akurat
- Menyediakan laporan stock keluar yang akurat berdasarkan data yang sudah Submit
- Filter laporan berdasarkan tanggal, produk, varian, dan template
- Mendukung pengambilan keputusan berbasis data

---

## 3. Ruang Lingkup

### 3.1 In Scope

**Master Produk:**
- CRUD (Create, Read, Update, Delete) sederhana untuk produk
- Field: nama, SKU, deskripsi
- Relasi dengan produk varian

**Master Produk Varian:**
- CRUD (Create, Read, Update, Delete) sederhana untuk varian produk
- Field: nama varian, SKU, stock current
- Terhubung dengan produk parent

**Template Stock Keluar:**
- Create template dengan kumpulan produk varian
- Set template aktif melalui pengaturan
- View daftar template

**Input Stock Keluar:**
- Pilih tanggal input
- Otomatis menggunakan template aktif
- Input stock keluar satu per satu per produk varian
- Simpan sebagai Draft (tidak mengurangi stock)
- Submit (mengurangi stock current, masuk laporan)

**Laporan Stock Keluar:**
- View laporan berdasarkan tanggal
- View laporan berdasarkan produk
- View laporan berdasarkan produk varian
- View laporan berdasarkan template

### 3.2 Out Scope

- Stock masuk (inbound)
- Manajemen harga produk
- Export data (CSV, Excel, dll)
- Statistics dashboard
- Stock adjustment manual dengan alasan
- Category management
- Bulk actions (edit/delete multiple items)
- Stock minimum & low stock warning
- Toggle status produk (active/inactive)
- Soft delete (delete permanen)
- Audit trail/history lengkap
- Complex filtering & sorting (hanya pencarian dasar)

---

## 4. User Persona

### 4.1 Operator Gudang
**Deskripsi:**
- Bertanggung jawab menginput stock keluar harian
- Menggunakan aplikasi secara rutin setiap hari
- Membutuhkan antarmuka yang cepat dan mudah digunakan

**Kebutuhan:**
- Input stock keluar yang cepat dengan minimal klik
- Template yang sudah dikonfigurasi untuk mempercepat input
- Kemampuan menyimpan Draft jika terganggu
- Konfirmasi sebelum Submit untuk menghindari kesalahan

**Pain Points:**
- Proses input yang lambat dan rumit
- Risiko kesalahan input yang berdampak pada stock
- Kebutuhan untuk mengulang input jika terjadi kesalahan

### 4.2 Supervisor
**Deskripsi:**
- Memantau laporan stock keluar secara berkala
- Mengambil keputusan berdasarkan data stock keluar

**Kebutuhan:**
- Akses ke laporan stock keluar yang akurat
- Filter laporan berdasarkan berbagai kriteria
- Visualisasi data yang mudah dipahami

**Pain Points:**
- Data yang tidak akurat atau tidak lengkap
- Kesulitan dalam melihat trend stock keluar

### 4.3 Admin
**Deskripsi:**
- Mengelola master data produk dan template
- Mengkonfigurasi sistem dan pengaturan

**Kebutuhan:**
- CRUD master produk dan varian
- Manajemen template stock keluar
- Pengaturan template aktif
- Kontrol akses user

**Pain Points:**
- Manajemen master data yang kompleks
- Kesalahan konfigurasi template yang berdampak pada operasional

---

## 5. User Flow

### 5.1 Flow Pembuatan Produk dan Varian

**Step 1: Create Produk beserta Varian (Satu Transaksi)**
1. User (Admin) mengakses menu Master Produk
2. Klik tombol "Tambah Produk"
3. Isi form data produk:
   - Nama Produk (wajib)
   - SKU (wajib, harus unik)
   - Deskripsi (opsional)
4. Tambahkan varian-varian yang diinginkan:
   - Klik tombol "Tambah Varian" untuk menambah form varian baru
   - Isi data untuk setiap varian:
     - Nama Varian (wajib)
     - SKU Varian (wajib, harus unik)
     - Stock Current (wajib, default 0)
   - Bisa tambah banyak varian sekaligus
   - Bisa hapus varian yang salah sebelum disimpan dengan tombol "Hapus"
5. Klik tombol "Simpan"
6. Sistem melakukan validasi:
   - Minimal 1 varian harus diisi
   - SKU produk dan semua SKU varian harus unik
   - Stock current tidak boleh negatif
7. Jika validasi sukses, sistem menyimpan produk dan semua varian dalam satu transaksi database
8. Jika validasi gagal atau terjadi error, seluruh transaksi dibatalkan (rollback) dan user dapat mengedit ulang
9. Sistem menampilkan pesan sukses/error

**Step 2: Edit/Delete (Opsional)**
1. User dapat mengedit produk/varian jika terjadi kesalahan
2. User dapat menghapus produk/varian jika tidak digunakan

### 5.2 Flow Pembuatan dan Pengaturan Template Aktif

**Step 1: Create Template**
1. User (Admin) mengakses menu Template Stock Keluar
2. Klik tombol "Tambah Template"
3. Isi form: Nama Template
4. Pilih produk varian yang akan dimasukkan ke template (multiple selection)
5. Klik "Simpan"
6. Sistem menyimpan template dengan daftar varian yang dipilih

**Step 2: Set Template Aktif**
1. User (Admin) mengakses menu Pengaturan
2. Pilih template yang akan dijadikan aktif dari dropdown
3. Klik "Simpan Pengaturan"
4. Sistem mengupdate template aktif dan menyimpan ke cache

**Step 3: View Template**
1. User dapat melihat daftar semua template yang tersedia
2. User dapat melihat detail varian dalam setiap template

### 5.3 Flow Input Stock Keluar (Draft → Submit)

**Step 1: Mulai Input**
1. User (Operator) mengakses menu Input Stock Keluar
2. Pilih tanggal input (default: hari ini)
3. Sistem otomatis memuat template aktif
4. Sistem menampilkan daftar produk varian dari template aktif

**Step 2: Input Stock Keluar**
1. User menginput quantity stock keluar untuk setiap varian
2. User dapat melewati varian yang tidak ada stock keluar (biarkan 0)
3. User dapat menyimpan sebagai Draft kapan saja
4. Jika disimpan sebagai Draft, stock current tidak berkurang

**Step 3: Review Draft**
1. User dapat melihat daftar Draft yang tersimpan
2. User dapat mengedit Draft yang belum disubmit
3. User dapat menghapus Draft jika tidak diperlukan

**Step 4: Submit**
1. Setelah selesai input, user klik tombol "Submit"
2. Sistem melakukan validasi:
   - Quantity tidak boleh negatif
   - Stock current tidak boleh kurang dari quantity yang diinput
3. Jika validasi sukses, sistem:
   - Mengurangi stock current untuk setiap varian
   - Mengubah status dari Draft ke Submit
   - Memasukkan data ke laporan stock keluar
4. Sistem menampilkan pesan sukses

### 5.4 Flow Melihat Laporan

**Step 1: Akses Laporan**
1. User (Supervisor/Admin) mengakses menu Laporan Stock Keluar
2. Sistem menampilkan daftar laporan yang sudah disubmit

**Step 2: Filter Laporan**
1. User dapat memfilter berdasarkan:
   - Tanggal (range tanggal atau tanggal spesifik)
   - Produk
   - Produk Varian
   - Template
2. Sistem menampilkan hasil filter

**Step 3: View Detail**
1. User dapat melihat detail laporan untuk setiap record
2. User dapat melihat total quantity per varian
3. User dapat melihat total quantity per produk

---

## 6. Functional Requirements

### 6.1 Master Produk

**FR-PRD-001: Create Produk beserta Varian (Satu Transaksi)**
- User dapat membuat produk baru beserta varian-varian dalam satu form dengan field:
  - **Data Produk:**
    - Nama Produk (required, max 255 karakter)
    - SKU (required, max 50 karakter, unik)
    - Deskripsi (optional, text)
  - **Data Varian (Dinamis):**
    - Nama Varian (required, max 100 karakter)
    - SKU Varian (required, max 50 karakter, unik)
    - Stock Current (required, default 0, integer, tidak boleh negatif)
- User dapat menambahkan multiple varian dalam satu form:
  - Klik tombol "Tambah Varian" untuk menambah form varian baru
  - Klik tombol "Hapus" untuk menghapus varian yang salah sebelum disimpan
- Sistem melakukan validasi:
  - Nama produk tidak boleh kosong
  - SKU produk harus unik di seluruh sistem
  - Minimal 1 varian harus diisi
  - Nama varian tidak boleh kosong
  - SKU varian harus unik (tidak boleh sama dengan SKU produk atau varian lain)
  - Stock current tidak boleh negatif
- Sistem menyimpan produk dan semua varian dalam satu transaksi database
- Jika validasi gagal atau terjadi error, seluruh transaksi dibatalkan (rollback)
- Sistem menampilkan pesan sukses/error

**FR-PRD-002: View Daftar Produk**
- User dapat melihat daftar semua produk
- Daftar ditampilkan dalam bentuk tabel/list
- Setiap produk menampilkan: Nama, SKU, Deskripsi, Jumlah Varian
- User dapat melakukan pencarian dasar berdasarkan nama atau SKU
- User dapat melihat detail varian untuk setiap produk

**FR-PRD-003: Edit Produk (Opsional)**
- User dapat mengedit produk yang sudah ada
- User dapat mengubah nama, SKU, atau deskripsi
- Sistem melakukan validasi SKU unik
- Sistem menyimpan perubahan ke database

**FR-PRD-004: Delete Produk (Opsional)**
- User dapat menghapus produk
- Sistem melakukan validasi:
  - Produk tidak boleh memiliki varian yang terkait
  - Produk tidak boleh digunakan dalam template
- Sistem menghapus produk dari database

### 6.2 UI/UX untuk Form Pembuatan Produk dan Varian

**FR-PRD-008: Layout Form Produk**
- Form produk ditampilkan di bagian atas halaman
- Field yang tersedia:
  - Input Nama Produk (required, max 255 karakter)
  - Input SKU (required, max 50 karakter, dengan indikator real-time jika SKU sudah digunakan)
  - Textarea Deskripsi (opsional)
- Label field jelas dan mudah dipahami
- Placeholder untuk membantu user mengisi form
- Validasi real-time untuk SKU unik

**FR-PRD-009: Section Varian**
- Section varian ditampilkan di bawah form produk
- Header section: "Varian Produk" dengan badge jumlah varian yang ditambahkan
- Tombol "Tambah Varian" untuk menambah form varian baru
  - Tombol berwarna primary (biru/hijau) untuk menarik perhatian
  - Icon "+" untuk indikasi tambah
  - Text: "Tambah Varian"
- Setiap form varian ditampilkan dalam card/container terpisah
- Setiap card varian berisi:
  - Input Nama Varian (required, max 100 karakter)
  - Input SKU Varian (required, max 50 karakter, dengan indikator real-time jika SKU sudah digunakan)
  - Input Stock Current (required, default 0, integer, tidak boleh negatif)
  - Tombol "Hapus" untuk menghapus varian
    - Tombol berwarna danger (merah) untuk indikasi hapus
    - Icon "×" atau trash
    - Text: "Hapus"
    - Konfirmasi sebelum menghapus (opsional)
- Validasi real-time untuk SKU unik (tidak boleh sama dengan SKU produk atau varian lain)
- Preview jumlah varian yang ditambahkan: "X Varian Ditambahkan"
- Jika belum ada varian ditambahkan, tampilkan pesan: "Belum ada varian ditambahkan"

**FR-PRD-010: Tombol Simpan**
- Tombol "Simpan" ditampilkan di bagian bawah form
- Tombol berwarna primary (biru/hijau) untuk indikasi aksi utama
- Text: "Simpan Produk"
- Tombol disabled jika:
  - Form produk belum lengkap
  - Belum ada varian ditambahkan
  - Ada error validasi
- Loading state saat menyimpan:
  - Spinner atau loading indicator
  - Text berubah menjadi "Menyimpan..."
  - Tombol disabled saat loading
- Success state:
  - Toast notification atau alert success
  - Pesan: "Produk dan varian berhasil dibuat"
  - Redirect ke halaman daftar produk
- Error state:
  - Toast notification atau alert error
  - Pesan error yang jelas dan spesifik
  - User tetap di halaman form untuk mengedit ulang

**FR-PRD-011: Responsive Design**
- Form responsif untuk mobile, tablet, dan desktop
- Pada mobile:
  - Stack layout (field ditumpuk vertikal)
  - Card varian ditampilkan satu per satu
  - Tombol "Tambah Varian" sticky di bawah atau mudah diakses
  - Tombol "Simpan" sticky di bawah atau mudah diakses
- Pada tablet:
  - 2-column layout untuk form produk
  - Card varian ditampilkan dalam grid 2 column
- Pada desktop:
  - 2-column layout untuk form produk
  - Card varian ditampilkan dalam grid 2-3 column

**FR-PRD-012: User Feedback**
- Validasi real-time untuk semua field
- Error message ditampilkan di bawah field yang error
- Success message ditampilkan di bagian atas form
- Loading state jelas terlihat saat menyimpan
- Indikator visual untuk field yang valid/invalid
- Tooltip atau help text untuk field yang membutuhkan penjelasan tambahan

### 6.3 Master Produk Varian

**FR-PRD-013: View Daftar Varian per Produk**
- User dapat melihat daftar varian untuk setiap produk
- Daftar ditampilkan dalam bentuk tabel/list
- Setiap varian menampilkan: Nama Varian, SKU, Stock Current
- User dapat melakukan pencarian dasar berdasarkan nama varian atau SKU

**FR-PRD-014: Edit Varian (Opsional)**
- User dapat mengedit varian yang sudah ada
- User dapat mengubah nama varian, SKU, atau stock current
- Sistem melakukan validasi SKU unik
- Sistem menyimpan perubahan ke database

**FR-PRD-015: Delete Varian (Opsional)**
- User dapat menghapus varian produk
- Sistem melakukan validasi:
  - Varian tidak boleh digunakan dalam template
  - Varian tidak boleh memiliki riwayat stock keluar
- Sistem menghapus varian dari database

### 6.4 Template Stock Keluar

**FR-PRD-016: Create Template**
- User dapat membuat template baru dengan field:
  - Nama Template (required, max 255 karakter)
  - Daftar Produk Varian (required, minimal 1 varian, multiple selection)
- Sistem melakukan validasi:
  - Nama template tidak boleh kosong
  - Minimal 1 varian harus dipilih
- Sistem menyimpan template dan daftar varian ke database
- Sistem menampilkan pesan sukses/error

**FR-PRD-017: View Daftar Template**
- User dapat melihat daftar semua template
- Daftar ditampilkan dalam bentuk tabel/list
- Setiap template menampilkan: Nama, Jumlah Varian, Status (Aktif/Tidak Aktif)
- User dapat melihat detail varian dalam setiap template

**FR-PRD-018: Set Template Aktif**
- User dapat mengatur template aktif melalui menu Pengaturan
- User memilih template dari dropdown
- Sistem melakukan validasi:
  - Hanya satu template yang boleh aktif
- Sistem mengupdate template aktif dan menyimpan ke cache
- Sistem menampilkan pesan sukses/error

**FR-PRD-019: Edit Template (Opsional)**
- User dapat mengedit template yang sudah ada
- User dapat mengubah nama template
- User dapat menambah/menghapus varian dari template
- Sistem menyimpan perubahan ke database

**FR-PRD-020: Delete Template (Opsional)**
- User dapat menghapus template
- Sistem melakukan validasi:
  - Template tidak boleh menjadi template aktif
  - Template tidak boleh digunakan dalam record stock keluar
- Sistem menghapus template dan semua item terkait dari database

### 6.5 Input Stock Keluar

**FR-PRD-021: Mulai Input Stock Keluar**
- User dapat memulai input stock keluar
- User memilih tanggal input (default: hari ini)
- Sistem otomatis memuat template aktif
- Sistem menampilkan daftar produk varian dari template aktif
- Sistem menampilkan form input untuk setiap varian

**FR-PRD-022: Input Quantity per Varian**
- User menginput quantity stock keluar untuk setiap varian
- Sistem melakukan validasi:
  - Quantity tidak boleh negatif
  - Quantity harus integer
- User dapat melewati varian yang tidak ada stock keluar (biarkan 0)
- Sistem menyimpan input secara real-time (auto-save atau manual)

**FR-PRD-023: Simpan sebagai Draft**
- User dapat menyimpan input sebagai Draft
- Sistem menyimpan data dengan status "draft"
- Stock current tidak berkurang
- Data tidak masuk ke laporan
- User dapat mengedit Draft kapan saja

**FR-PRD-024: Submit Stock Keluar**
- User dapat meng-submit input stock keluar
- Sistem melakukan validasi:
  - Semua quantity tidak boleh negatif
  - Stock current tidak boleh kurang dari quantity yang diinput
- Jika validasi sukses, sistem:
  - Mengurangi stock current untuk setiap varian
  - Mengubah status dari Draft ke Submit
  - Memasukkan data ke laporan stock keluar
  - Menampilkan pesan sukses
- Jika validasi gagal, sistem:
  - Menampilkan pesan error
  - Tidak mengubah stock current

**FR-PRD-025: View Daftar Draft**
- User dapat melihat daftar Draft yang tersimpan
- Daftar ditampilkan dalam bentuk tabel/list
- Setiap Draft menampilkan: Tanggal, Jumlah Varian, Status
- User dapat mengedit Draft yang belum disubmit
- User dapat menghapus Draft jika tidak diperlukan

**FR-PRD-026: Edit Draft**
- User dapat mengedit Draft yang belum disubmit
- User dapat mengubah quantity untuk setiap varian
- User dapat menyimpan kembali sebagai Draft atau Submit

**FR-PRD-027: Delete Draft**
- User dapat menghapus Draft
- Sistem menghapus Draft dari database
- Stock current tidak berubah

### 6.6 Laporan Stock Keluar

**FR-PRD-028: View Laporan Stock Keluar**
- User dapat melihat laporan stock keluar
- Sistem menampilkan daftar record yang sudah disubmit
- Setiap record menampilkan: Tanggal, Jumlah Varian, Total Quantity, Status
- User dapat melihat detail setiap record

**FR-PRD-029: Filter Laporan berdasarkan Tanggal**
- User dapat memfilter laporan berdasarkan tanggal
- User dapat memilih range tanggal atau tanggal spesifik
- Sistem menampilkan laporan sesuai filter tanggal

**FR-PRD-030: Filter Laporan berdasarkan Produk**
- User dapat memfilter laporan berdasarkan produk
- User memilih produk dari dropdown
- Sistem menampilkan laporan sesuai filter produk
- Sistem menghitung total quantity per produk

**FR-PRD-031: Filter Laporan berdasarkan Produk Varian**
- User dapat memfilter laporan berdasarkan produk varian
- User memilih produk varian dari dropdown
- Sistem menampilkan laporan sesuai filter varian
- Sistem menghitung total quantity per varian

**FR-PRD-032: Filter Laporan berdasarkan Template**
- User dapat memfilter laporan berdasarkan template
- User memilih template dari dropdown
- Sistem menampilkan laporan sesuai filter template
- Sistem menghitung total quantity per template

**FR-PRD-033: View Detail Laporan**
- User dapat melihat detail laporan untuk setiap record
- Sistem menampilkan:
  - Tanggal
  - Daftar varian dengan quantity
  - Total quantity
  - Status
- User dapat melihat riwayat perubahan stock per varian

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **Load Time:** Halaman harus dimuat dalam waktu < 2 detik
- **Response Time:** API response harus < 500ms untuk operasi CRUD sederhana
- **Query Performance:** Query laporan harus dioptimalkan dengan indexing
- **Caching:** Template aktif harus di-cache untuk akses cepat

### 7.2 Usability
- **Mobile-First Design:** Antarmuka harus dioptimalkan untuk perangkat mobile
- **Minimal Klik:** Input stock keluar harus memerlukan minimal klik
- **Intuitive Navigation:** Navigasi harus mudah dipahami dan digunakan
- **Clear Feedback:** Sistem harus memberikan feedback yang jelas untuk setiap aksi

### 7.3 Responsiveness
- **Multiple Screen Sizes:** Antarmuka harus responsif untuk berbagai ukuran layar (mobile, tablet, desktop)
- **Touch-Friendly:** Tombol dan elemen interaktif harus mudah di-tap pada layar kecil
- **Adaptive Layout:** Layout harus menyesuaikan dengan orientasi layar (portrait/landscape)

### 7.4 Security
- **RBAC:** Role-Based Access Control harus diterapkan untuk setiap fitur
- **Authentication:** User harus diautentikasi sebelum mengakses fitur
- **Authorization:** User hanya dapat mengakses fitur sesuai role dan permission
- **Data Validation:** Semua input harus divalidasi di sisi server
- **SQL Injection Prevention:** Query harus menggunakan parameter binding

### 7.5 Reliability
- **Data Integrity:** Stock current harus konsisten dan akurat
- **Transaction Management:** Operasi submit stock keluar harus menggunakan database transaction
- **Error Handling:** Sistem harus menangani error dengan baik dan memberikan pesan yang jelas
- **Backup:** Database harus di-backup secara berkala

### 7.6 Scalability
- **Database Optimization:** Database harus dioptimalkan untuk performa query
- **Indexing:** Tabel yang sering di-query harus memiliki index yang tepat
- **Lazy Loading:** Data harus dimuat sesuai kebutuhan untuk mengurangi load time

### 7.7 Maintainability
- **Code Quality:** Kode harus mengikuti best practice Laravel
- **Documentation:** Kode harus memiliki komentar yang jelas
- **Testing:** Unit test dan integration test harus tersedia
- **Version Control:** Git harus digunakan untuk version control

---

## 8. Data Model

### 8.1 Tabel Utama

#### 8.1.1 Products
**Deskripsi:** Tabel untuk menyimpan data produk.

| Field | Type | Constraint | Deskripsi |
|-------|------|------------|----------|
| id | UUID | Primary Key | ID unik produk |
| name | VARCHAR(255) | Not Null | Nama produk |
| sku | VARCHAR(50) | Unique, Not Null | SKU produk (harus unik) |
| description | TEXT | Nullable | Deskripsi produk |
| created_at | TIMESTAMP | Not Null | Waktu pembuatan record |
| updated_at | TIMESTAMP | Not Null | Waktu update terakhir |

**Index:**
- `sku` (untuk pencarian cepat berdasarkan SKU)

#### 8.1.2 Product Variants
**Deskripsi:** Tabel untuk menyimpan data varian produk.

| Field | Type | Constraint | Deskripsi |
|-------|------|------------|----------|
| id | UUID | Primary Key | ID unik varian |
| product_id | UUID | Foreign Key, Not Null | ID produk parent |
| variant_name | VARCHAR(100) | Not Null | Nama varian |
| sku | VARCHAR(50) | Unique, Not Null | SKU varian (harus unik) |
| stock_current | INTEGER | Default 0, Not Null | Stock saat ini |
| created_at | TIMESTAMP | Not Null | Waktu pembuatan record |
| updated_at | TIMESTAMP | Not Null | Waktu update terakhir |

**Index:**
- `sku` (untuk pencarian cepat berdasarkan SKU)
- `product_id` (untuk query varian berdasarkan produk)

**Foreign Key:**
- `product_id` → `products.id` (Cascade On Delete)

#### 8.1.3 Templates
**Deskripsi:** Tabel untuk menyimpan data template stock keluar.

| Field | Type | Constraint | Deskripsi |
|-------|------|------------|----------|
| id | UUID | Primary Key | ID unik template |
| name | VARCHAR(255) | Not Null | Nama template |
| is_active | BOOLEAN | Default false | Status aktif template |
| created_at | TIMESTAMP | Not Null | Waktu pembuatan record |
| updated_at | TIMESTAMP | Not Null | Waktu update terakhir |

#### 8.1.4 Template Items
**Deskripsi:** Tabel untuk menyimpan daftar varian dalam setiap template.

| Field | Type | Constraint | Deskripsi |
|-------|------|------------|----------|
| id | UUID | Primary Key | ID unik item template |
| template_id | UUID | Foreign Key, Not Null | ID template |
| product_variant_id | UUID | Foreign Key, Not Null | ID varian produk |
| created_at | TIMESTAMP | Not Null | Waktu pembuatan record |
| updated_at | TIMESTAMP | Not Null | Waktu update terakhir |

**Index:**
- `template_id` (untuk query item berdasarkan template)
- `product_variant_id` (untuk query template berdasarkan varian)

**Foreign Key:**
- `template_id` → `templates.id` (Cascade On Delete)
- `product_variant_id` → `product_variants.id` (Cascade On Delete)

#### 8.1.5 Stock Out Records
**Deskripsi:** Tabel untuk menyimpan record stock keluar (header).

| Field | Type | Constraint | Deskripsi |
|-------|------|------------|----------|
| id | UUID | Primary Key | ID unik record |
| date | DATE | Not Null | Tanggal stock keluar |
| status | VARCHAR(20) | Not Null | Status (draft/submit) |
| created_at | TIMESTAMP | Not Null | Waktu pembuatan record |
| updated_at | TIMESTAMP | Not Null | Waktu update terakhir |

**Index:**
- `date` (untuk query berdasarkan tanggal)
- `status` (untuk query berdasarkan status)

#### 8.1.6 Stock Out Items
**Deskripsi:** Tabel untuk menyimpan detail item stock keluar.

| Field | Type | Constraint | Deskripsi |
|-------|------|------------|----------|
| id | UUID | Primary Key | ID unik item |
| stock_out_record_id | UUID | Foreign Key, Not Null | ID record stock keluar |
| product_variant_id | UUID | Foreign Key, Not Null | ID varian produk |
| quantity | INTEGER | Not Null | Quantity stock keluar |
| created_at | TIMESTAMP | Not Null | Waktu pembuatan record |
| updated_at | TIMESTAMP | Not Null | Waktu update terakhir |

**Index:**
- `stock_out_record_id` (untuk query item berdasarkan record)
- `product_variant_id` (untuk query record berdasarkan varian)

**Foreign Key:**
- `stock_out_record_id` → `stock_out_records.id` (Cascade On Delete)
- `product_variant_id` → `product_variants.id` (Restrict On Delete)

### 8.2 Relasi Antar Tabel

#### 8.2.1 Products → Product Variants
- **Tipe:** One-to-Many
- **Deskripsi:** Satu produk dapat memiliki banyak varian
- **Foreign Key:** `product_variants.product_id` → `products.id`
- **Cascade:** Delete produk akan menghapus semua varian terkait

#### 8.2.2 Templates → Template Items
- **Tipe:** One-to-Many
- **Deskripsi:** Satu template dapat memiliki banyak item
- **Foreign Key:** `template_items.template_id` → `templates.id`
- **Cascade:** Delete template akan menghapus semua item terkait

#### 8.2.3 Template Items → Product Variants
- **Tipe:** Many-to-One
- **Deskripsi:** Banyak item dapat mengacu ke satu varian
- **Foreign Key:** `template_items.product_variant_id` → `product_variants.id`
- **Cascade:** Delete varian akan menghapus semua item terkait

#### 8.2.4 Stock Out Records → Stock Out Items
- **Tipe:** One-to-Many
- **Deskripsi:** Satu record dapat memiliki banyak item
- **Foreign Key:** `stock_out_items.stock_out_record_id` → `stock_out_records.id`
- **Cascade:** Delete record akan menghapus semua item terkait

#### 8.2.5 Stock Out Items → Product Variants
- **Tipe:** Many-to-One
- **Deskripsi:** Banyak item dapat mengacu ke satu varian
- **Foreign Key:** `stock_out_items.product_variant_id` → `product_variants.id`
- **Restrict:** Tidak bisa menghapus varian yang sudah digunakan dalam record

---

## 9. Role & Permission

### 9.1 Admin

**Deskripsi:** Role dengan akses penuh untuk mengelola sistem.

**Permissions:**

| Permission | Deskripsi |
|------------|-----------|
| `products.create` | Membuat produk baru |
| `products.edit` | Mengedit produk yang sudah ada |
| `products.delete` | Menghapus produk |
| `products.view` | Melihat daftar produk |
| `product_variants.create` | Membuat varian produk baru |
| `product_variants.edit` | Mengedit varian produk yang sudah ada |
| `product_variants.delete` | Menghapus varian produk |
| `product_variants.view` | Melihat daftar varian produk |
| `templates.manage` | Membuat, mengedit, menghapus template |
| `templates.set_active` | Mengatur template aktif |
| `templates.view` | Melihat daftar template |
| `stock_out.create` | Membuat input stock keluar |
| `stock_out.edit` | Mengedit draft stock keluar |
| `stock_out.delete` | Menghapus draft stock keluar |
| `stock_out.submit` | Submit stock keluar |
| `stock_out.view` | Melihat daftar stock keluar |
| `reports.view` | Melihat laporan stock keluar |
| `settings.manage` | Mengelola pengaturan sistem |

### 9.2 Operator

**Deskripsi:** Role untuk operator gudang yang bertugas menginput stock keluar harian.

**Permissions:**

| Permission | Deskripsi |
|------------|-----------|
| `products.view` | Melihat daftar produk |
| `product_variants.view` | Melihat daftar varian produk |
| `templates.view` | Melihat daftar template |
| `stock_out.create` | Membuat input stock keluar |
| `stock_out.edit` | Mengedit draft stock keluar |
| `stock_out.delete` | Menghapus draft stock keluar |
| `stock_out.submit` | Submit stock keluar |
| `stock_out.view` | Melihat daftar stock keluar |

### 9.3 Supervisor

**Deskripsi:** Role untuk supervisor yang memantau laporan stock keluar.

**Permissions:**

| Permission | Deskripsi |
|------------|-----------|
| `products.view` | Melihat daftar produk |
| `product_variants.view` | Melihat daftar varian produk |
| `templates.view` | Melihat daftar template |
| `stock_out.view` | Melihat daftar stock keluar |
| `reports.view` | Melihat laporan stock keluar |

### 9.4 Matriks Akses

| Fitur | Admin | Operator | Supervisor |
|-------|-------|----------|------------|
| Create Produk | ✅ | ❌ | ❌ |
| Edit Produk | ✅ | ❌ | ❌ |
| Delete Produk | ✅ | ❌ | ❌ |
| View Produk | ✅ | ✅ | ✅ |
| Create Varian | ✅ | ❌ | ❌ |
| Edit Varian | ✅ | ❌ | ❌ |
| Delete Varian | ✅ | ❌ | ❌ |
| View Varian | ✅ | ✅ | ✅ |
| Create Template | ✅ | ❌ | ❌ |
| Edit Template | ✅ | ❌ | ❌ |
| Delete Template | ✅ | ❌ | ❌ |
| Set Template Aktif | ✅ | ❌ | ❌ |
| View Template | ✅ | ✅ | ✅ |
| Create Stock Out | ✅ | ✅ | ❌ |
| Edit Draft | ✅ | ✅ | ❌ |
| Delete Draft | ✅ | ✅ | ❌ |
| Submit Stock Out | ✅ | ✅ | ❌ |
| View Stock Out | ✅ | ✅ | ✅ |
| View Laporan | ✅ | ❌ | ✅ |
| Manage Settings | ✅ | ❌ | ❌ |

---

## 10. Edge Case & Validasi

### 10.1 Validasi Produk

**EC-PRD-001: SKU Produk Harus Unik**
- **Deskripsi:** SKU produk harus unik di seluruh sistem
- **Validasi:** Cek keunikan SKU sebelum menyimpan produk
- **Error Message:** "SKU sudah digunakan, silakan gunakan SKU lain"

**EC-PRD-002: Nama Produk Tidak Boleh Kosong**
- **Deskripsi:** Nama produk adalah field wajib
- **Validasi:** Cek apakah nama produk diisi
- **Error Message:** "Nama produk wajib diisi"

**EC-PRD-003: Produk dengan Varian Tidak Bisa Dihapus**
- **Deskripsi:** Produk yang memiliki varian tidak bisa dihapus
- **Validasi:** Cek apakah produk memiliki varian terkait
- **Error Message:** "Produk tidak dapat dihapus karena memiliki varian terkait"

**EC-PRD-004: Produk yang Digunakan dalam Template Tidak Bisa Dihapus**
- **Deskripsi:** Produk yang varian-nya digunakan dalam template tidak bisa dihapus
- **Validasi:** Cek apakah varian produk digunakan dalam template
- **Error Message:** "Produk tidak dapat dihapus karena varian terkait digunakan dalam template"

### 10.2 Validasi Produk Varian

**EC-PRD-005: Minimal 1 Varian Harus Diisi Saat Create Produk**
- **Deskripsi:** Saat create produk, minimal 1 varian harus diisi
- **Validasi:** Cek apakah array variants tidak kosong dan minimal 1 varian diisi
- **Error Message:** "Minimal 1 varian harus diisi saat create produk"

**EC-PRD-006: SKU Varian Harus Unik**
- **Deskripsi:** SKU varian harus unik di seluruh sistem
- **Validasi:** Cek keunikan SKU sebelum menyimpan varian
- **Error Message:** "SKU sudah digunakan, silakan gunakan SKU lain"

**EC-PRD-007: SKU Varian Tidak Boleh Sama dengan SKU Produk**
- **Deskripsi:** SKU varian tidak boleh sama dengan SKU produk parent
- **Validasi:** Cek apakah SKU varian sama dengan SKU produk
- **Error Message:** "SKU varian tidak boleh sama dengan SKU produk"

**EC-PRD-008: SKU Varian Harus Unik Antar Varian**
- **Deskripsi:** SKU varian harus unik antar varian dalam satu produk
- **Validasi:** Cek apakah ada SKU varian yang duplikat dalam form
- **Error Message:** "SKU varian harus unik, tidak boleh ada duplikat"

**EC-PRD-009: Nama Varian Tidak Boleh Kosong**
- **Deskripsi:** Nama varian adalah field wajib
- **Validasi:** Cek apakah nama varian diisi
- **Error Message:** "Nama varian wajib diisi"

**EC-PRD-010: Stock Current Tidak Boleh Negatif**
- **Deskripsi:** Stock current harus >= 0
- **Validasi:** Cek apakah stock current >= 0
- **Error Message:** "Stock current tidak boleh negatif"

**EC-PRD-011: Produk Parent Harus Ada**
- **Deskripsi:** Produk parent harus ada di database
- **Validasi:** Cek apakah produk parent ada
- **Error Message:** "Produk parent tidak ditemukan"

**EC-PRD-012: Varian yang Digunakan dalam Template Tidak Bisa Dihapus**
- **Deskripsi:** Varian yang digunakan dalam template tidak bisa dihapus
- **Validasi:** Cek apakah varian digunakan dalam template
- **Error Message:** "Varian tidak dapat dihapus karena digunakan dalam template"

**EC-PRD-013: Varian yang Memiliki Riwayat Stock Keluar Tidak Bisa Dihapus**
- **Deskripsi:** Varian yang sudah digunakan dalam record stock keluar tidak bisa dihapus
- **Validasi:** Cek apakah varian digunakan dalam record stock keluar
- **Error Message:** "Varian tidak dapat dihapus karena memiliki riwayat stock keluar"

### 10.3 Validasi Template

**EC-PRD-014: Nama Template Tidak Boleh Kosong**
- **Deskripsi:** Nama template adalah field wajib
- **Validasi:** Cek apakah nama template diisi
- **Error Message:** "Nama template wajib diisi"

**EC-PRD-015: Template Harus Memiliki Minimal 1 Varian**
- **Deskripsi:** Template harus memiliki minimal 1 varian
- **Validasi:** Cek apakah minimal 1 varian dipilih
- **Error Message:** "Template harus memiliki minimal 1 varian"

**EC-PRD-016: Template Aktif Hanya Boleh Satu**
- **Deskripsi:** Hanya satu template yang boleh aktif
- **Validasi:** Cek apakah sudah ada template aktif
- **Error Message:** "Template aktif sudah ada, silakan nonaktifkan template aktif terlebih dahulu"

**EC-PRD-017: Template Aktif Tidak Bisa Dihapus**
- **Deskripsi:** Template yang sedang aktif tidak bisa dihapus
- **Validasi:** Cek apakah template sedang aktif
- **Error Message:** "Template aktif tidak dapat dihapus"

**EC-PRD-018: Template yang Digunakan dalam Record Tidak Bisa Dihapus**
- **Deskripsi:** Template yang sudah digunakan dalam record stock keluar tidak bisa dihapus
- **Validasi:** Cek apakah template digunakan dalam record stock keluar
- **Error Message:** "Template tidak dapat dihapus karena memiliki riwayat penggunaan"

### 10.4 Validasi Input Stock Keluar

**EC-PRD-019: Quantity Tidak Boleh Negatif**
- **Deskripsi:** Quantity stock keluar harus >= 0
- **Validasi:** Cek apakah quantity >= 0
- **Error Message:** "Quantity tidak boleh negatif"

**EC-PRD-020: Quantity Harus Integer**
- **Deskripsi:** Quantity harus berupa bilangan bulat
- **Validasi:** Cek apakah quantity adalah integer
- **Error Message:** "Quantity harus berupa bilangan bulat"

**EC-PRD-021: Stock Current Tidak Boleh Kurang dari Quantity**
- **Deskripsi:** Stock current harus >= quantity saat submit
- **Validasi:** Cek apakah stock current >= quantity untuk setiap varian
- **Error Message:** "Stock tidak mencukupi untuk varian [nama varian]"

**EC-PRD-022: Draft Tidak Bisa Diedit Setelah Disubmit**
- **Deskripsi:** Draft yang sudah disubmit tidak bisa diedit
- **Validasi:** Cek apakah status record adalah draft
- **Error Message:** "Record sudah disubmit, tidak dapat diedit"

**EC-PRD-023: Draft Tidak Bisa Dihapus Setelah Disubmit**
- **Deskripsi:** Draft yang sudah disubmit tidak bisa dihapus
- **Validasi:** Cek apakah status record adalah draft
- **Error Message:** "Record sudah disubmit, tidak dapat dihapus"

### 10.5 Validasi Laporan

**EC-PRD-024: Filter Tanggal Tidak Valid**
- **Deskripsi:** Filter tanggal harus valid (start date <= end date)
- **Validasi:** Cek apakah start date <= end date
- **Error Message:** "Tanggal awal tidak boleh lebih besar dari tanggal akhir"

**EC-PRD-025: Laporan Hanya Menampilkan Data Submit**
- **Deskripsi:** Laporan hanya menampilkan data dengan status submit
- **Validasi:** Filter data berdasarkan status submit
- **Error Message:** N/A (sistem otomatis filter)

### 10.6 Edge Case Lainnya

**EC-PRD-026: Tidak Ada Template Aktif**
- **Deskripsi:** Jika tidak ada template aktif, user tidak bisa input stock keluar
- **Validasi:** Cek apakah ada template aktif
- **Error Message:** "Tidak ada template aktif, silakan atur template aktif terlebih dahulu"

**EC-PRD-027: Tidak Ada Varian dalam Template Aktif**
- **Deskripsi:** Jika template aktif tidak memiliki varian, user tidak bisa input stock keluar
- **Validasi:** Cek apakah template aktif memiliki varian
- **Error Message:** "Template aktif tidak memiliki varian, silakan tambahkan varian ke template"

**EC-PRD-028: User Tidak Memiliki Permission**
- **Deskripsi:** User tidak bisa mengakses fitur jika tidak memiliki permission
- **Validasi:** Cek permission user sebelum mengakses fitur
- **Error Message:** "Anda tidak memiliki akses untuk fitur ini"

**EC-PRD-029: Concurrent Submit**
- **Deskripsi:** Jika dua user mencoba submit record yang sama secara bersamaan
- **Validasi:** Gunakan database transaction dan locking
- **Error Message:** "Record sedang diproses oleh user lain, silakan coba lagi"

---

## 11. Asumsi & Batasan

### 11.1 Asumsi

**AS-PRD-001: Inisialisasi Stock Current**
- Stock current diinisialisasi saat pembuatan varian produk
- Nilai default stock current adalah 0
- Admin dapat mengubah stock current saat pembuatan atau edit varian

**AS-PRD-002: Stock Hanya Berkurang**
- Stock hanya berkurang melalui input stock keluar
- Tidak ada fitur stock masuk untuk menambah stock
- Stock current tidak bisa bertambah secara otomatis

**AS-PRD-003: Satu User Per Hari (Opsional)**
- Satu user bisa menginput stock keluar per hari
- Jika perlu menginput lagi di hari yang sama, user bisa mengedit draft yang sudah ada
- Ini untuk menghindari duplikasi data

**AS-PRD-004: Template Aktif Global**
- Template aktif bersifat global untuk semua user
- Semua user akan menggunakan template aktif yang sama untuk input stock keluar

**AS-PRD-005: Pengaturan Template Aktif oleh Admin**
- Hanya admin yang bisa mengatur template aktif
- Operator dan supervisor tidak bisa mengubah template aktif

**AS-PRD-006: Laporan Hanya Data Submit**
- Laporan hanya menampilkan data yang sudah disubmit
- Data draft tidak masuk ke laporan
- Ini untuk memastikan akurasi laporan

**AS-PRD-007: Validasi Stock Saat Submit**
- Validasi stock current dilakukan saat submit, bukan saat simpan draft
- User bisa menyimpan draft meskipun stock current tidak mencukupi
- Error akan muncul saat submit

**AS-PRD-008: Database Transaction**
- Operasi submit stock keluar menggunakan database transaction
- Jika terjadi error, semua perubahan akan di-rollback
- Ini untuk memastikan konsistensi data

### 11.2 Batasan

**BT-PRD-001: Tidak Ada Fitur Stock Masuk**
- Aplikasi tidak menyediakan fitur stock masuk
- Stock hanya bisa berkurang, tidak bisa bertambah
- Penambahan stock harus dilakukan secara manual melalui edit varian

**BT-PRD-002: Tidak Ada Fitur Harga**
- Aplikasi tidak menyediakan fitur manajemen harga
- Tidak ada perhitungan nilai stock berdasarkan harga
- Fokus hanya pada quantity stock

**BT-PRD-003: Tidak Ada Fitur Kategori**
- Aplikasi tidak menyediakan fitur kategori produk
- Produk tidak dikelompokkan berdasarkan kategori
- Pencarian hanya berdasarkan nama dan SKU

**BT-PRD-004: Tidak Ada Fitur Export Data**
- Aplikasi tidak menyediakan fitur export data (CSV, Excel, dll)
- Data hanya bisa dilihat di dalam aplikasi
- Jika perlu export, harus dilakukan secara manual dari database

**BT-PRD-005: Tidak Ada Statistics Dashboard**
- Aplikasi tidak menyediakan dashboard statistik
- Tidak ada grafik atau visualisasi data
- Laporan hanya berupa tabel/list

**BT-PRD-006: Tidak Ada Stock Adjustment Manual dengan Alasan**
- Aplikasi tidak menyediakan fitur stock adjustment manual
- Penyesuaian stock harus dilakukan melalui edit varian
- Tidak ada pencatatan alasan penyesuaian

**BT-PRD-007: Tidak Ada Audit Trail Lengkap**
- Aplikasi tidak menyediakan audit trail lengkap
- Tidak ada pencatatan riwayat perubahan detail
- Hanya ada created_at dan updated_at

**BT-PRD-008: Tidak Ada Bulk Actions**
- Aplikasi tidak menyediakan fitur bulk actions
- Edit dan delete harus dilakukan satu per satu
- Tidak bisa mengedit/menghapus multiple items sekaligus

**BT-PRD-009: Tidak Ada Stock Minimum & Low Stock Warning**
- Aplikasi tidak menyediakan fitur stock minimum
- Tidak ada peringatan jika stock mencapai batas minimum
- User harus memantau stock secara manual

**BT-PRD-010: Tidak Ada Toggle Status Produk**
- Aplikasi tidak menyediakan fitur toggle status produk (active/inactive)
- Semua produk dan varian selalu aktif
- Jika tidak ingin digunakan, harus dihapus

**BT-PRD-011: Tidak Ada Soft Delete**
- Aplikasi tidak menyediakan fitur soft delete
- Delete adalah permanen
- Data yang dihapus tidak bisa dipulihkan

**BT-PRD-012: Tidak Ada Complex Filtering & Sorting**
- Aplikasi hanya menyediakan pencarian dasar
- Tidak ada advanced filter atau sorting
- Filter laporan hanya berdasarkan tanggal, produk, varian, dan template

**BT-PRD-013: Keterbatasan Teknologi**
- Aplikasi menggunakan Laravel 10.x, Inertia.js, dan PostgreSQL
- Tidak mendukung teknologi lain kecuali jika diupgrade
- Performa bergantung pada konfigurasi server dan database

**BT-PRD-014: Keterbatasan User**
- User harus terbiasa dengan penggunaan aplikasi mobile
- User harus memiliki koneksi internet yang stabil
- User harus mengerti konsep stock dan inventory

---

## 12. Catatan Teknis untuk Developer

### 12.1 Teknologi & Framework

**Backend:**
- **Laravel 10.x:** Framework PHP untuk backend
- **PostgreSQL:** Database untuk menyimpan data
- **Laravel Spatie Permission:** Package untuk RBAC
- **Laravel UUID:** Package untuk UUID primary keys

**Frontend:**
- **Inertia.js:** Bridge antara Laravel dan frontend framework
- **React.js:** Frontend framework untuk UI
- **TailwindCSS:** CSS framework untuk styling
- **Headless UI:** Komponen UI untuk React

### 12.2 Database Design

**Primary Keys:**
- Gunakan UUID untuk semua primary keys
- Package: `laravel-uuid` atau `ramsey/uuid`
- Contoh: `$table->uuid('id')->primary();`

**Indexing:**
- Tambahkan index untuk kolom yang sering di-query:
  - `products.sku`
  - `product_variants.sku`
  - `product_variants.product_id`
  - `template_items.template_id`
  - `template_items.product_variant_id`
  - `stock_out_records.date`
  - `stock_out_records.status`
  - `stock_out_items.stock_out_record_id`
  - `stock_out_items.product_variant_id`

**Foreign Keys:**
- Gunakan foreign key constraints untuk menjaga integritas data
- Cascade on delete untuk relasi parent-child (products → product_variants, templates → template_items)
- Restrict on delete untuk relasi yang tidak boleh dihapus (product_variants → stock_out_items)

**Database Transactions:**
- Gunakan database transaction untuk operasi submit stock keluar:
  ```php
  DB::transaction(function () {
      // Kurangi stock current
      // Update status record ke submit
      // Masukkan data ke laporan
  });
  ```

- Gunakan database transaction untuk operasi create produk beserta varian:
  ```php
  DB::transaction(function () {
      // Create produk
      $product = Product::create([
          'name' => $request->name,
          'sku' => $request->sku,
          'description' => $request->description,
      ]);
      
      // Create varian-varian
      foreach ($request->variants as $variant) {
          ProductVariant::create([
              'product_id' => $product->id,
              'variant_name' => $variant['name'],
              'sku' => $variant['sku'],
              'stock_current' => $variant['stock_current'],
          ]);
      }
  });
  ```

- **Penting:** Jika salah satu varian gagal validasi atau terjadi error, seluruh transaksi akan di-rollback dan tidak ada data yang tersimpan

### 12.3 Caching

**Template Aktif:**
- Cache template aktif untuk mengurangi query database
- Gunakan Laravel Cache:
  ```php
  $activeTemplate = Cache::remember('active_template', 3600, function () {
      return Template::where('is_active', true)->first();
  });
  ```
- Invalidate cache saat template aktif diubah:
  ```php
  Cache::forget('active_template');
  ```

**Query Optimization:**
- Gunakan eager loading untuk menghindari N+1 query:
  ```php
  Product::with('variants')->get();
  Template::with('items.variant')->get();
  StockOutRecord::with('items.variant')->get();
  ```

### 12.4 Validation

**Server-Side Validation:**
- Gunakan Laravel Form Request untuk validasi:
  ```php
  public function rules() {
      return [
          'name' => 'required|max:255',
          'sku' => 'required|max:50|unique:products,sku',
          'description' => 'nullable',
      ];
  }
  ```

**Custom Validation:**
- Buat custom validation untuk validasi stock current:
  ```php
  'quantity' => [
      'required',
      'integer',
              function ($attribute, $value, $fail) use ($variantId) {
                  $variant = ProductVariant::find($variantId);
                  if ($variant->stock_current < $value) {
                      $fail('Stock tidak mencukupi');
                  }
              },
          ],
  ];
  ```

- Buat custom validation untuk validasi SKU unik (produk dan varian):
  ```php
  public function rules() {
      $rules = [
          'name' => 'required|max:255',
          'sku' => 'required|max:50|unique:products,sku',
          'description' => 'nullable',
          'variants' => 'required|array|min:1',
          'variants.*.name' => 'required|max:100',
          'variants.*.sku' => [
              'required',
              'max:50',
              'unique:product_variants,sku',
              function ($attribute, $value, $fail) use ($request) {
                  // Validasi SKU varian tidak boleh sama dengan SKU produk
                  if ($value === $request->sku) {
                      $fail('SKU varian tidak boleh sama dengan SKU produk');
                  }
                  
                  // Validasi SKU varian tidak boleh sama dengan varian lain
                  $variantIndex = explode('.', $attribute)[1];
                  foreach ($request->variants as $index => $variant) {
                      if ($index != $variantIndex && $variant['sku'] === $value) {
                          $fail('SKU varian harus unik');
                      }
                  }
              },
          ],
          'variants.*.stock_current' => 'required|integer|min:0',
      ];
      
      return $rules;
  }
  ```

### 12.5 API Design

**RESTful API:**
- Gunakan RESTful API untuk semua endpoint:
  - GET /api/products - Get all products
  - POST /api/products - Create product
  - GET /api/products/{id} - Get product detail
  - PUT /api/products/{id} - Update product
  - DELETE /api/products/{id} - Delete product

**Response Format:**
- Gunakan format response yang konsisten:
  ```json
  {
      "success": true,
      "data": {
          "id": "uuid",
          "name": "Nama Produk",
          "sku": "SKU-001",
          "description": "Deskripsi"
      },
      "message": "Produk berhasil dibuat"
  }
  ```

**Error Handling:**
- Gunakan HTTP status code yang tepat:
  - 200 OK - Success
  - 201 Created - Resource created
  - 400 Bad Request - Validation error
  - 401 Unauthorized - Not authenticated
  - 403 Forbidden - No permission
  - 404 Not Found - Resource not found
  - 422 Unprocessable Entity - Validation error
  - 500 Internal Server Error - Server error

### 12.6 Frontend Development

**Mobile-First Design:**
- Gunakan TailwindCSS untuk mobile-first design:
  ```jsx
  <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-lg md:text-xl lg:text-2xl">Judul</h1>
  </div>
  ```

**Inertia.js:**
- Gunakan Inertia.js untuk SPA experience:
  ```jsx
  import { Head, Link } from '@inertiajs/react';
  
  export default function ProductIndex({ products }) {
      return (
          <>
              <Head title="Products" />
              <div>
                  {products.map(product => (
                      <div key={product.id}>{product.name}</div>
                  ))}
              </div>
          </>
      );
  }
  ```

**Form Handling:**
- Gunakan React Hook Form untuk form handling:
  ```jsx
  import { useForm } from 'react-hook-form';
  
  const { register, handleSubmit } = useForm();
  
  const onSubmit = (data) => {
      Inertia.post('/products', data);
  };
  ```

- Gunakan dynamic fields untuk input varian produk:
  ```jsx
  import { useState } from 'react';
  import { useForm } from 'react-hook-form';
  
  export default function ProductForm() {
      const { register, handleSubmit, control } = useForm();
      const [variants, setVariants] = useState([{ id: 1 }]);
      
      const addVariant = () => {
          setVariants([...variants, { id: Date.now() }]);
      };
      
      const removeVariant = (id) => {
          setVariants(variants.filter(v => v.id !== id));
      };
      
      const onSubmit = (data) => {
          Inertia.post('/products', data);
      };
      
      return (
          <form onSubmit={handleSubmit(onSubmit)}>
              {/* Form Produk */}
              <input {...register('name')} placeholder="Nama Produk" />
              <input {...register('sku')} placeholder="SKU" />
              <textarea {...register('description')} placeholder="Deskripsi" />
              
              {/* Form Varian */}
              {variants.map((variant, index) => (
                  <div key={variant.id}>
                      <input
                          {...register(`variants.${index}.name`)}
                          placeholder="Nama Varian"
                      />
                      <input
                          {...register(`variants.${index}.sku`)}
                          placeholder="SKU Varian"
                      />
                      <input
                          type="number"
                          {...register(`variants.${index}.stock_current`)}
                          placeholder="Stock Current"
                      />
                      <button type="button" onClick={() => removeVariant(variant.id)}>
                          Hapus
                      </button>
                  </div>
              ))}
              
              <button type="button" onClick={addVariant}>
                  Tambah Varian
              </button>
              
              <button type="submit">Simpan</button>
          </form>
      );
  }
  ```

**State Management:**
- Gunakan React Context atau Zustand untuk state management:
  ```jsx
  const AuthContext = createContext();
  
  export function AuthProvider({ children }) {
      const [user, setUser] = useState(null);
      return (
          <AuthContext.Provider value={{ user, setUser }}>
              {children}
          </AuthContext.Provider>
      );
  }
  ```

### 12.7 Performance Optimization

**Lazy Loading:**
- Gunakan lazy loading untuk komponen yang berat:
  ```jsx
  const ProductList = lazy(() => import('./ProductList'));
  ```

**Code Splitting:**
- Gunakan code splitting untuk mengurangi bundle size:
  ```jsx
  import { lazy, Suspense } from 'react';
  
  const Dashboard = lazy(() => import('./Dashboard'));
  ```

**Image Optimization:**
- Gunakan format gambar yang efisien (WebP, AVIF)
- Gunakan lazy loading untuk gambar:
  ```jsx
  <img src="image.jpg" loading="lazy" alt="Description" />
  ```

**Minification:**
- Gunakan minification untuk CSS dan JavaScript:
  ```javascript
  // vite.config.js
  export default {
      build: {
          minify: 'terser',
          cssCodeSplit: true,
      },
  };
  ```

### 12.8 Security

**Authentication:**
- Gunakan Laravel Sanctum atau Passport untuk authentication:
  ```php
  Route::middleware('auth:sanctum')->group(function () {
      Route::apiResource('products', ProductController::class);
  });
  ```

**Authorization:**
- Gunakan Spatie Permission untuk authorization:
  ```php
  public function store(Request $request) {
      $this->authorize('create', Product::class);
      // ...
  }
  ```

**CSRF Protection:**
- Aktifkan CSRF protection untuk semua form:
  ```php
  <form method="POST" action="/products">
      @csrf
      <!-- form fields -->
  </form>
  ```

**SQL Injection Prevention:**
- Gunakan parameter binding untuk query:
  ```php
  $product = Product::where('sku', $sku)->first();
  ```

**XSS Prevention:**
- Gunakan Laravel Blade atau React untuk escaping output:
  ```jsx
  <div>{product.name}</div>
  ```

### 12.9 Testing

**Unit Testing:**
- Tulis unit test untuk semua business logic:
  ```php
  public function test_create_product()
  {
      $response = $this->post('/api/products', [
          'name' => 'Test Product',
          'sku' => 'TEST-001',
          'description' => 'Test Description',
      ]);
  
      $response->assertStatus(201);
      $this->assertDatabaseHas('products', [
          'name' => 'Test Product',
          'sku' => 'TEST-001',
      ]);
  }
  ```

**Integration Testing:**
- Tulis integration test untuk API endpoints:
  ```php
  public function test_get_products()
  {
      $response = $this->get('/api/products');
  
      $response->assertStatus(200);
      $response->assertJsonStructure([
          'success',
          'data' => [
              '*' => ['id', 'name', 'sku', 'description'],
          ],
      ]);
  }
  ```

**E2E Testing:**
- Gunakan Cypress atau Playwright untuk E2E testing:
  ```javascript
  describe('Product Management', () => {
      it('should create a new product', () => {
          cy.visit('/products/create');
          cy.get('[name="name"]').type('Test Product');
          cy.get('[name="sku"]').type('TEST-001');
          cy.get('button[type="submit"]').click();
          cy.url().should('include', '/products');
      });
  });
  ```

### 12.10 Deployment

**Environment Configuration:**
- Gunakan environment variables untuk konfigurasi:
  ```env
  APP_ENV=production
  APP_URL=https://stocktrackapp.com
  DB_CONNECTION=pgsql
  DB_HOST=your-db-host
  DB_PORT=5432
  DB_DATABASE=stocktrackapp
  DB_USERNAME=your-db-username
  DB_PASSWORD=your-db-password
  ```

**Docker:**
- Gunakan Docker untuk containerization:
  ```dockerfile
  FROM php:8.2-fpm
  RUN apt-get update && apt-get install -y \
      git \
      curl \
      libpng-dev \
      libonig-dev \
      libxml2-dev \
      zip \
      unzip
  ```

**CI/CD:**
- Gunakan GitHub Actions atau GitLab CI untuk CI/CD:
  ```yaml
  name: CI
  on: [push]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - name: Run Tests
          run: |
            composer install
            php artisan test
  ```

**Monitoring:**
- Gunakan Laravel Telescope atau Laravel Horizon untuk monitoring:
  ```php
  // config/telescope.php
  'watchers' => [
      Watchers\RequestWatcher::class => true,
      Watchers\QueryWatcher::class => true,
      Watchers\JobWatcher::class => true,
  ],
  ```

### 12.11 Documentation

**API Documentation:**
- Gunakan Swagger atau Postman untuk dokumentasi API:
  ```yaml
  /api/products:
    post:
      summary: Create a new product
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                sku:
                  type: string
                description:
                  type: string
  ```

**Code Documentation:**
- Gunakan PHPDoc untuk dokumentasi kode:
  ```php
  /**
   * Create a new product.
   *
   * @param  \Illuminate\Http\Request  $request
   * @return \Illuminate\Http\Response
   */
  public function store(Request $request)
  {
      // ...
  }
  ```

**User Documentation:**
- Buat dokumentasi pengguna untuk fitur-fitur aplikasi:
  - Cara membuat produk
  - Cara membuat varian
  - Cara membuat template
  - Cara input stock keluar
  - Cara melihat laporan

---

## Appendix

### A. Glossary

| Istilah | Deskripsi |
|---------|-----------|
| SKU | Stock Keeping Unit - Kode unik untuk identifikasi produk |
| UUID | Universally Unique Identifier - ID unik global |
| RBAC | Role-Based Access Control - Kontrol akses berdasarkan role |
| CRUD | Create, Read, Update, Delete - Operasi dasar database |
| Draft | Status belum disubmit, stock tidak berkurang |
| Submit | Status sudah disubmit, stock berkurang, masuk laporan |
| Template Aktif | Template yang sedang digunakan untuk input stock keluar |
| Stock Current | Stock saat ini yang tersedia |
| Stock Keluar | Stock yang berkurang dari gudang |

### B. Referensi

- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js Documentation](https://inertiajs.com/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Spatie Permission Documentation](https://spatie.be/docs/laravel-permission)

### C. Changelog

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.1 | 2026-01-06 | Update pembuatan produk dan varian dalam satu transaksi database |
| 1.0 | 2026-01-06 | Initial PRD - Master Produk (Simplified Version) |

---

**Dokumen ini dibuat oleh:** Product Manager
**Tanggal:** 6 Januari 2026
**Versi:** 1.1
**Status:** Final
