# 📘 Product Requirement Document (PRD) — WhatsApp Settings & Notification Integration

## 🧩 1. Ringkasan Singkat
**Deskripsi Singkat:**
Fitur WhatsApp Settings & Notification Integration menyediakan modul pengaturan global untuk integrasi WhatsApp API (seperti Fonnte, Wablas, atau API serupa) yang memungkinkan pengiriman notifikasi otomatis ke nomor admin WhatsApp ketika stok produk varian mencapai atau melewati threshold yang ditentukan. Modul ini bersifat global dan reusable — akan digunakan sebagai fondasi untuk semua kebutuhan pengiriman WhatsApp di masa depan (stock alerts, laporan harian, user invitations, dll).

**Status:** Draft
**Prioritas:** Tinggi
**Tanggal:** 2026-07-25
**Author:** AI Software Product Analyst & Technical Writer

---

## 🎯 2. Tujuan & Latar Belakang
- Sistem saat ini sudah memiliki fitur **stock threshold monitoring** yang mendeteksi produk dengan stok rendah dan membuat notifikasi di database (via `StockThresholdService` dan `StockLowNotification`).
- Notifikasi yang ada hanya tersimpan di database dan dapat dilihat melalui dropdown/header notifikasi di UI — **tidak ada push notification ke luar sistem**.
- Admin/Supervisor seringkali tidak membuka aplikasi secara real-time, sehingga notifikasi penting tentang stok rendah bisa terlewat.
- WhatsApp adalah platform komunikasi yang paling banyak digunakan di Indonesia, sehingga menjadi channel notifikasi yang paling efektif.
- Diperlukan modul **pengaturan WhatsApp** yang terpusat (global) agar konfigurasi API WhatsApp dapat digunakan oleh berbagai fitur di masa depan.
- Modul ini menjadi **entry point pertama** untuk integrasi WhatsApp — stock threshold notifications akan menjadi use case pertama yang diimplementasikan.

**Masalah bisnis yang ingin diselesaikan:**
- Admin tidak mendapat peringatan langsung saat stok produk rendah atau habis
- Hanya mengandalkan notifikasi in-app yang memerlukan user aktif di aplikasi
- Tidak ada mekanisme push notification ke channel eksternal
- Kebutuhan WhatsApp untuk berbagai fitur masa depan memerlukan konfigurasi terpusat

---

## 👥 3. Stakeholder
| Peran | Nama | Tanggung Jawab |
|-------|------|----------------|
| Product Owner | | Menentukan prioritas dan scope fitur WhatsApp |
| Backend Developer | | Implementasi WhatsApp settings model, service, controller, dan integrasi API |
| Frontend Developer | | Implementasi halaman settings WhatsApp dan UI komponen |
| QA | | Uji integrasi WhatsApp API, test notification, dan edge cases |
| Warehouse Supervisor | | Mengkonfigurasi WhatsApp settings dan menerima notifikasi |

---

## ⚙️ 4. Deskripsi Fitur
Fitur WhatsApp Settings & Notification Integration terdiri dari dua komponen utama: (1) Modul Pengaturan WhatsApp (global, reusable) dan (2) Integrasi Notifikasi WhatsApp untuk Stock Threshold Alerts.

### 4.1. Alur Utama (Main Flow)

#### Flow 1: Konfigurasi WhatsApp Settings
1. Admin/Supervisor mengakses menu **Pengaturan > WhatsApp** di sidebar
2. Sistem menampilkan halaman WhatsApp Settings dengan form input:
   - **API Key**: Kunci API dari penyedia WhatsApp Gateway
   - **API URL**: Endpoint URL WhatsApp Gateway
   - **Admin Phone Number**: Nomor telepon admin yang akan menerima notifikasi (format internasional, e.g., `628xxxxxxxxxx`)
   - **WhatsApp Notifications Active**: Toggle switch untuk mengaktifkan/menonaktifkan notifikasi WhatsApp
3. Admin mengisi form dan menekan tombol **Simpan**
4. Sistem menyimpan konfigurasi ke database
5. Admin dapat menekan tombol **Test WhatsApp** untuk mengirim pesan test ke nomor admin
6. Sistem mengirim pesan test dan menampilkan status berhasil/gagal

#### Flow 2: Notifikasi Stok Rendah via WhatsApp (Background Process)
1. Sistem mendeteksi stok produk varian mencapai atau melewati threshold (via `StockThresholdService`)
2. Sistem membuat notifikasi database (existing flow — tidak berubah)
3. **[BARU]** Sistem memeriksa apakah WhatsApp notification aktif di settings
4. **[BARU]** Jika aktif, sistem mengirim pesan WhatsApp ke nomor admin yang terdaftar
5. **[BARU]** Sistem mencatat log pengiriman (berhasil/gagal) di audit log
6. Admin menerima pesan WhatsApp berisi informasi produk yang stoknya rendah

### 4.2. Sub-Flow / Edge Case
- Jika API Key kosong atau tidak valid, WhatsApp notification di-skip dan hanya notifikasi database yang dibuat
- Jika API URL tidak dapat dijangkau (timeout/error), sistem mencatat log error dan retry pada interval berikutnya
- Jika nomor admin tidak diisi, WhatsApp notification di-skip
- Jika toggle WhatsApp notification nonaktif, semua notifikasi WhatsApp di-skip — notifikasi database tetap berjalan normal
- Jika terjadi error saat mengirim WhatsApp, tidak mengganggu proses penyimpanan notifikasi database (fire-and-forget)
- Jika ada beberapa varian yang trigger threshold sekaligus, sistem mengirim satu pesan WhatsApp yang berisi ringkasan semua varian (bukan satu pesan per varian)
- Format nomor telepon divalidasi: harus diawali dengan kode negara (62 untuk Indonesia), hanya angka, minimal 10 digit, maksimal 15 digit

### 4.3. UI/UX
- Halaman yang terlibat:
  - `Settings/WhatsApp/Index` — Halaman konfigurasi WhatsApp settings
- Elemen penting:
  - Form input: API Key (dengan mask/toggle visibility), API URL, Admin Phone Number
  - Toggle switch untuk mengaktifkan/nonaktifkan notifikasi WhatsApp
  - Tombol **Simpan** untuk menyimpan konfigurasi
  - Tombol **Test WhatsApp** untuk mengirim pesan test
  - Status indicator: Badge yang menampilkan status koneksi WhatsApp (Terhubung / Tidak Terhubung / Belum Dikonfigurasi)
  - Riwayat pengiriman terakhir (last sent timestamp)
  - Toast notification untuk feedback berhasil/gagal
  - Informasi kontekstual: penjelasan format nomor, keterangan field
  - Mobile-responsive design dengan layout yang konsisten

---

## 🧠 5. Behavior & Logika Bisnis

### 5.1. WhatsApp Settings Management
- WhatsApp settings bersifat **singleton** — hanya ada satu konfigurasi global dalam sistem
- Jika belum ada konfigurasi, sistem membuat record baru saat admin pertama kali menyimpan
- API Key disimpan dengan **enkripsi** di database menggunakan Laravel's built-in encryption
- API URL divalidasi sebagai URL yang valid (format `https://...`)
- Admin phone number disimpan dalam format internasional tanpa tanda `+` di depan
- Semua perubahan settings dicatat di audit log

### 5.2. WhatsApp Notification Logic
- WhatsApp notification **hanya** dikirim untuk notifikasi **baru** (unread) yang dibuat oleh `StockThresholdService`
- Notifikasi yang sudah ada sebelumnya (sudah read) tidak di-trigger ulang
- Sistem menggunakan pola **fire-and-forget** — kegagalan pengiriman WhatsApp tidak mempengaruhi flow utama
- Untuk efisiensi, beberapa alert stok rendah yang terjadi dalam waktu berdekatan (batch) akan digabungkan menjadi satu pesan WhatsApp
- Format pesan WhatsApp:
  ```
  ⚠️ *Peringatan Stok Rendah - StockTrackApp*

  Produk berikut memiliki stok di bawah threshold:

  • [Nama Produk] - [Nama Varian]
    Stok: [current] / Threshold: [threshold]
    Status: [Rendah/Habis]

  • [Nama Produk] - [Nama Varian]
    Stok: [current] / Threshold: [threshold]
    Status: [Rendah/Habis]

  ---
  Waktu: [timestamp]
  ```
- Pesan test menggunakan format:
  ```
  ✅ *Test Notifikasi - StockTrackApp*

  Koneksi WhatsApp berhasil!
  Pesan ini dikirim dari sistem StockTrackApp.

  Waktu: [timestamp]
  ```

### 5.3. Validasi & Keamanan
- API Key tidak boleh kosong jika WhatsApp notification aktif
- API URL harus berupa URL yang valid
- Phone number harus format internasional (diawali 62), hanya angka
- API Key ditampilkan masked di frontend (hanya menampilkan 4 karakter terakhir)
- Hanya Admin/Supervisor yang dapat mengakses halaman settings WhatsApp

---

## 🔌 6. Integrasi & API

### 6.1. Endpoint Baru
| Method | Endpoint | Deskripsi | Auth | Permission |
|--------|-----------|-----------|------|------------|
| GET | `/settings/whatsapp` | Halaman WhatsApp settings | Required | `manage_settings` |
| PUT | `/settings/whatsapp` | Simpan/update WhatsApp settings | Required | `manage_settings` |
| POST | `/settings/whatsapp/test` | Kirim test message WhatsApp | Required | `manage_settings` |
| GET | `/settings/whatsapp/status` | Cek status koneksi WhatsApp (API) | Required | `manage_settings` |

### 6.2. Endpoint yang Terpengaruh
| Endpoint | Perubahan |
|-----------|------------|
| `StockThresholdService::checkVariant()` | Setelah membuat notifikasi database, trigger WhatsApp notification jika aktif |
| `StockThresholdService::checkAllVariants()` | Setelah batch check, kirim ringkasan WhatsApp jika ada notifikasi baru |

---

## 🧱 7. Struktur Data

### 7.1. Model / Entity

#### WhatsAppSetting (Singleton)
```php
WhatsAppSetting {
    id: uuid (primary key)
    api_key: text (encrypted)
    api_url: string
    admin_phone: string
    is_active: boolean (default: false)
    last_sent_at: timestamp | nullable
    last_error: text | nullable
    created_at: timestamp
    updated_at: timestamp
    
    Methods:
    - isConfigured(): bool — api_key, api_url, admin_phone terisi semua
    - isActiveAndConfigured(): bool — is_active AND isConfigured()
    - getMaskedApiKey(): string — menampilkan masked API key
    - getFormattedPhone(): string — format phone dengan prefix +
}
```

### 7.2. Migration / Schema

#### Migration: Create whatsapp_settings table
```sql
CREATE TABLE whatsapp_settings (
    id CHAR(36) PRIMARY KEY,
    api_key TEXT NOT NULL,
    api_url VARCHAR(500) NOT NULL,
    admin_phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    last_sent_at TIMESTAMP NULL,
    last_error TEXT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### 7.3. Service Layer

#### WhatsAppService
```php
WhatsAppService {
    Dependencies:
    - WhatsAppSetting model
    - HTTP Client (GuzzleHttp / Laravel HTTP Client)
    
    Methods:
    - send(string $phone, string $message): array — kirim pesan WhatsApp
    - sendTestMessage(): array — kirim pesan test
    - sendStockAlert(Collection $variants): array — kirim alert stok rendah
    - getSettings(): WhatsAppSetting|null — ambil konfigurasi
    - saveSettings(array $data): WhatsAppSetting — simpan/update konfigurasi
    - isConfigured(): bool — cek apakah WhatsApp sudah dikonfigurasi
    - isActive(): bool — cek apakah WhatsApp notification aktif
}
```

### 7.4. Integrasi dengan StockThresholdService

Modifikasi pada `StockThresholdService`:
```php
// Method baru yang ditambahkan:
private function sendWhatsAppAlert(array $variants): void
{
    // Dipanggil setelah checkAllVariants() selesai
    // Mengirim ringkasan semua varian yang baru dibuatkan notifikasi
    // Hanya mengirim jika WhatsApp aktif dan terkonfigurasi
    // Fire-and-forget: error di-log, tidak throw exception
}
```

---

## 🧪 8. Acceptance Criteria
| No | Kriteria | Diterima Jika |
|----|-----------|---------------|
| 1 | Admin dapat mengakses halaman WhatsApp Settings | Halaman ter-load dengan form input yang lengkap |
| 2 | Admin dapat menyimpan WhatsApp settings | Data tersimpan di database dengan API key ter-encrypt |
| 3 | Admin dapat mengedit WhatsApp settings | Data berhasil diupdate dan konfigurasi terbaru digunakan |
| 4 | Toggle WhatsApp notification berfungsi | Mengaktifkan/menonaktifkan pengiriman WhatsApp tanpa menghapus konfigurasi |
| 5 | Tombol test WhatsApp berfungsi | Pesan test terkirim ke nomor admin dan status berhasil ditampilkan |
| 6 | Test WhatsApp gagal ditangani dengan baik | Pesan error yang jelas ditampilkan dan error dicatat di log |
| 7 | Notifikasi stok rendah terkirim via WhatsApp | Saat stok varian melewati threshold, pesan WhatsApp dikirim ke admin |
| 8 | Notifikasi database tetap berjalan normal | Tidak ada perubahan pada alur notifikasi database yang sudah ada |
| 9 | WhatsApp nonaktif tidak mengirim pesan | Saat toggle off, tidak ada pesan WhatsApp yang dikirim |
| 10 | Konfigurasi tidak lengkap tidak mengirim pesan | Jika API key/URL/phone kosong, WhatsApp di-skip tanpa error |
| 11 | API key ditampilkan masked | Hanya 4 karakter terakhir API key yang terlihat di UI |
| 12 | Validasi nomor telepon berfungsi | Format nomor yang salah ditolak dengan pesan error |
| 13 | Sidebar menampilkan menu WhatsApp Settings | Menu tersedia di bawah Pengaturan untuk role yang sesuai |
| 14 | Mobile-responsive design | Halaman settings berfungsi dengan baik di mobile dan desktop |
| 15 | Audit log tercatat | Semua perubahan settings dicatat di log |

---

## 🧰 9. Dependencies
- [x] Laravel 11.x framework
- [x] Inertia.js untuk frontend integration
- [x] React untuk UI components
- [x] Spatie Laravel Permission untuk permission management
- [x] `WhatsAppSetting` model (baru)
- [x] `WhatsAppService` (baru)
- [x] `StockThresholdService` (sudah ada, perlu modifikasi)
- [x] `StockLowNotification` (sudah ada, tidak perlu modifikasi)
- [x] Sidebar component (sudah ada, perlu update)
- [x] Database migration (baru)
- [ ] WhatsApp Gateway API (Fonnte/Wablas/sejenis) — **eksternal dependency**

---

## 🧩 10. Risiko & Mitigasi
| Risiko | Dampak | Solusi |
|--------|---------|--------|
| WhatsApp Gateway API down | Notifikasi tidak terkirim | Implementasi retry mechanism dengan exponential backoff, log error, notifikasi database tetap berjalan |
| API Key expired/diblokir | Notifikasi terhenti | Tampilkan status error di halaman settings, kirim notifikasi in-app ke admin |
| Rate limit WhatsApp API | Pesan terbatas | Implementasi throttling, batch pesan (gabungkan beberapa alert dalam satu pesan) |
| Format nomor salah | Pesan gagal terkirim | Validasi ketat format nomor di frontend dan backend |
| API Key bocor/terekspos | Keamanan kompromi | Enkripsi API key di database, mask di frontend, tidak tampil di log |
| Error WhatsApp mengganggu flow utama | Sistem terganggu | Fire-and-forget pattern, WhatsApp error tidak throw exception ke caller |
| Biaya WhatsApp Gateway meningkat | Cost overrun | Batasi frekuensi pengiriman, deduplicate pesan serupa |

---

## 📊 11. Metrics / Success Criteria
- Target 100% delivery rate untuk WhatsApp notification saat gateway tersedia
- WhatsApp notification terkirim dalam < 5 detik setelah threshold ter-trigger
- Zero impact pada performa stock threshold check (WhatsApp async/fire-and-forget)
- Error rate < 5% untuk pengiriman WhatsApp
- Settings page load time < 2 detik
- Test message delivery < 3 detik
- Mobile usability score > 85%

---

## 🚀 12. Rencana Implementasi
| Tahap | Tugas | Penanggung Jawab | Estimasi |
|--------|-------|------------------|-----------|
| 1 | Buat migration untuk `whatsapp_settings` table | Backend Dev | 0.5 hari |
| 2 | Buat model `WhatsAppSetting` dengan enkripsi API key | Backend Dev | 0.5 hari |
| 3 | Buat `WhatsAppService` (send, sendTest, sendStockAlert, config) | Backend Dev | 1 hari |
| 4 | Buat `WhatsAppSettingController` (index, update, test, status) | Backend Dev | 1 hari |
| 5 | Buat request validation classes (WhatsAppSettingUpdateRequest) | Backend Dev | 0.5 hari |
| 6 | Buat routes untuk WhatsApp settings | Backend Dev | 0.5 hari |
| 7 | Modifikasi `StockThresholdService` untuk trigger WhatsApp | Backend Dev | 1 hari |
| 8 | Tambah permission `manage_settings` di seeder | Backend Dev | 0.5 hari |
| 9 | Buat frontend halaman `Settings/WhatsApp/Index` | Frontend Dev | 1.5 hari |
| 10 | Update sidebar dengan menu Pengaturan > WhatsApp | Frontend Dev | 0.5 hari |
| 11 | Integrasi test WhatsApp button dengan backend API | Frontend Dev | 0.5 hari |
| 12 | Testing end-to-end (settings, test message, threshold alert) | QA | 1 hari |
| 13 | Bug fixes dan refinements | Dev Team | 0.5 hari |
| **Total** | | | **9 hari** |

---

## 🧾 13. Catatan Tambahan

### 13.1. WhatsApp Gateway Compatibility
- Modul ini dirancang **gateway-agnostic** — dapat digunakan dengan berbagai WhatsApp Gateway API (Fonnte, Wablas, WA-Plus, dll) selama mengikuti pola POST request dengan API key di header
- API URL dan API Key dikonfigurasi oleh admin, sehingga fleksibel untuk berganti gateway
- Format request body mengikuti standar umum: `{ phone, message }` — disesuaikan di `WhatsAppService` agar mudah diubah

### 13.2. Global Module Design
- WhatsApp settings bersifat **global** — bukan per-user atau per-role
- Semua fitur yang membutuhkan WhatsApp di masa depan akan menggunakan service yang sama
- Contoh penggunaan masa depan:
  - Laporan stock harian via WhatsApp
  - Notifikasi stock masuk/keluar besar
  - Notifikasi approval workflow
  - Broadcast pengumuman ke grup WhatsApp

### 13.3. Security Considerations
- API key dienkripsi menggunakan `Crypt::encrypt()` / `Crypt::decrypt()` milik Laravel
- API key tidak pernah ditampilkan penuh di frontend (masked)
- API key tidak dicatat di log (hanya 4 karakter terakhir)
- Endpoint WhatsApp settings dilindungi oleh permission `manage_settings`

### 13.4. Performance Considerations
- Pengiriman WhatsApp bersifat **fire-and-forget** dan sebaiknya dijalankan secara asinkron (queue) untuk tidak memblokir request
- Batch notification: beberapa alert stok rendah yang terjadi dalam waktu berdekatan digabungkan dalam satu pesan
- Jika WhatsApp Gateway timeout (> 10 detik), operasi di-skip dan dicatat di log

---

## ✅ 14. Checklist Sebelum Rilis
- [ ] Migration file sudah dijalankan di database
- [ ] Model `WhatsAppSetting` sudah dibuat dengan enkripsi API key
- [ ] `WhatsAppService` sudah diimplementasikan dengan proper error handling
- [ ] `WhatsAppSettingController` sudah diimplementasikan
- [ ] Request validation class sudah lengkap
- [ ] Routes sudah ditambahkan dengan permission yang benar
- [ ] Permission `manage_settings` sudah ditambahkan di seeder
- [ ] `StockThresholdService` sudah dimodifikasi untuk trigger WhatsApp
- [ ] Frontend halaman WhatsApp Settings sudah diimplementasikan
- [ ] Sidebar sudah diupdate dengan menu Pengaturan > WhatsApp
- [ ] Test message button berfungsi dengan baik
- [ ] Notifikasi WhatsApp terkirim saat threshold ter-trigger
- [ ] Notifikasi database tetap berjalan normal
- [ ] Mobile-responsive design berfungsi dengan baik
- [ ] Security review: API key enkripsi dan masking
- [ ] QA checklist sudah disetujui

---

## 📁 15. File Structure

### 15.1. Files to Create

#### Backend Files

**Controllers:**
- `app/Http/Controllers/Settings/WhatsAppSettingController.php`

**Models:**
- `app/Models/WhatsAppSetting.php`

**Services:**
- `app/Services/WhatsAppService.php`

**Request Validation:**
- `app/Http/Requests/Settings/WhatsAppSettingUpdateRequest.php`
- `app/Http/Requests/Settings/WhatsAppTestRequest.php`

**Migrations:**
- `database/migrations/2026_07_25_000001_create_whatsapp_settings_table.php`

**Routes:**
- `routes/settings.php`

#### Frontend Files

**Pages:**
- `resources/js/Pages/Settings/WhatsApp/Index.jsx`

### 15.2. Files to Modify

**Services (modifikasi):**
- `app/Services/StockThresholdService.php` — tambah integrasi WhatsApp setelah notifikasi database

**Database Seeder:**
- `database/seeders/PermissionSeeder.php` — tambah permission: `manage_settings`

**Sidebar Component:**
- `resources/js/Components/Layouts/Sidebar.jsx` — tambah menu Pengaturan > WhatsApp

**Main Routes File:**
- `routes/web.php` — include routes/settings.php

---

## 📝 16. Implementation Details

### 16.1. WhatsAppSettingController Key Methods

**index() - Display WhatsApp Settings Page:**
```php
public function index(): Response
{
    $setting = WhatsAppSetting::first();
    
    return Inertia::render('Settings/WhatsApp/Index', [
        'setting' => $setting ? [
            'id' => $setting->id,
            'api_key_masked' => $setting->getMaskedApiKey(),
            'api_url' => $setting->api_url,
            'admin_phone' => $setting->admin_phone,
            'is_active' => $setting->is_active,
            'last_sent_at' => $setting->last_sent_at,
            'last_error' => $setting->last_error,
            'is_configured' => $setting->isConfigured(),
        ] : null,
    ]);
}
```

**update() - Save/Update WhatsApp Settings:**
```php
public function update(WhatsAppSettingUpdateRequest $request)
{
    $validated = $request->validated();
    
    $setting = WhatsAppSetting::first();
    
    if ($setting) {
        $setting->update($validated);
    } else {
        $setting = WhatsAppSetting::create($validated);
    }
    
    // Log action
    Log::info('WhatsApp settings updated', [...]);
    
    return redirect()->route('settings.whatsapp.index')
        ->with('success', 'Pengaturan WhatsApp berhasil disimpan.');
}
```

**test() - Send Test WhatsApp Message:**
```php
public function test()
{
    $setting = WhatsAppSetting::first();
    
    if (!$setting || !$setting->isConfigured()) {
        return response()->json([
            'success' => false,
            'message' => 'Pengaturan WhatsApp belum lengkap.',
        ], 422);
    }
    
    $result = $this->whatsAppService->sendTestMessage();
    
    return response()->json($result);
}
```

### 16.2. WhatsAppService Implementation

**send() - Core Send Method:**
```php
public function send(string $phone, string $message): array
{
    $setting = WhatsAppSetting::first();
    
    if (!$setting || !$setting->isActiveAndConfigured()) {
        return ['success' => false, 'message' => 'WhatsApp tidak aktif atau belum dikonfigurasi.'];
    }
    
    try {
        $response = Http::timeout(10)
            ->withHeaders([
                'Authorization' => $setting->api_key,
            ])
            ->post($setting->api_url, [
                'phone' => $phone,
                'message' => $message,
            ]);
        
        $setting->update([
            'last_sent_at' => now(),
            'last_error' => null,
        ]);
        
        return ['success' => true, 'message' => 'Pesan berhasil dikirim.'];
    } catch (\Exception $e) {
        $setting->update([
            'last_error' => $e->getMessage(),
        ]);
        
        Log::error('WhatsApp send failed', [...]);
        
        return ['success' => false, 'message' => 'Gagal mengirim pesan WhatsApp.'];
    }
}
```

**sendStockAlert() - Stock Threshold Alert:**
```php
public function sendStockAlert(Collection $variants): array
{
    if ($variants->isEmpty()) {
        return ['success' => false, 'message' => 'Tidak ada varian untuk dikirim.'];
    }
    
    $lines = $variants->map(function ($variant) {
        $status = $variant->stock_current <= 0 ? 'Habis' : 'Rendah';
        return "• {$variant->product->name} - {$variant->variant_name}\n  Stok: {$variant->stock_current} / Threshold: {$variant->stock_threshold}\n  Status: {$status}";
    });
    
    $message = "⚠️ *Peringatan Stok Rendah - StockTrackApp*\n\n" .
        "Produk berikut memiliki stok di bawah threshold:\n\n" .
        implode("\n\n", $lines->toArray()) .
        "\n\n---\nWaktu: " . now()->format('d/m/Y H:i:s');
    
    $setting = WhatsAppSetting::first();
    
    return $this->send($setting->admin_phone, $message);
}
```

### 16.3. Modification to StockThresholdService

```php
// Di method checkAllVariants(), tambahkan di akhir:

// Setelah loop selesai, kirim WhatsApp notification jika ada notifikasi baru
if ($notificationsCreated > 0) {
    $this->sendWhatsAppNotification($newlyTriggeredVariants);
}

// Method baru:
private function sendWhatsAppNotification(Collection $variants): void
{
    try {
        $whatsAppService = app(WhatsAppService::class);
        $whatsAppService->sendStockAlert($variants);
    } catch (\Exception $e) {
        // Fire-and-forget: log error tapi tidak throw
        Log::error('WhatsApp stock alert failed', [
            'error' => $e->getMessage(),
        ]);
    }
}
```

### 16.4. Permissions

Tambahkan permission di `PermissionSeeder.php`:
- `manage_settings` — Mengakses dan mengubah pengaturan WhatsApp (dan pengaturan lainnya di masa depan)

### 16.5. Sidebar Update

Tambahkan menu berikut di Sidebar.jsx:
```jsx
{
    name: 'Pengaturan',
    icon: CogIcon,
    permission: 'manage_settings',
    subMenu: [
        {
            name: 'WhatsApp',
            href: '/settings/whatsapp',
            permission: 'manage_settings',
        }
    ],
},
```

### 16.6. Routes

File `routes/settings.php`:
```php
Route::middleware(['auth'])->prefix('settings')->name('settings.')->group(function () {
    Route::get('/whatsapp', [WhatsAppSettingController::class, 'index'])->name('whatsapp.index');
    Route::put('/whatsapp', [WhatsAppSettingController::class, 'update'])->name('whatsapp.update');
    Route::post('/whatsapp/test', [WhatsAppSettingController::class, 'test'])->name('whatsapp.test');
    Route::get('/whatsapp/status', [WhatsAppSettingController::class, 'status'])->name('whatsapp.status');
});
```

---

## 🔮 17. Future Enhancements

Fitur-fitur yang dapat ditambahkan di masa depan (di luar scope PRD ini):

1. **Multiple Admin Phone Numbers**
   - Support beberapa nomor admin untuk menerima notifikasi
   - Konfigurasi per-role (Supervisor dapat beda nomor dengan Staff)

2. **WhatsApp Group Messaging**
   - Kirim notifikasi ke grup WhatsApp, bukan individual
   - Konfigurasi group ID di settings

3. **Customizable Message Templates**
   - Admin dapat mengubah format pesan WhatsApp
   - Template variable: `{product_name}`, `{variant_name}`, `{stock}`, `{threshold}`

4. **Notification Schedule**
   - Jadwal pengiriman notifikasi (misal: ringkasan harian jam 8 pagi)
   - Quiet hours (tidak kirim notifikasi di luar jam kerja)

5. **Stock In/Out Notifications**
   - Notifikasi WhatsApp untuk transaksi stock masuk/keluar tertentu
   - Filter berdasarkan jumlah minimum transaksi

6. **Laporan Harian via WhatsApp**
   - Ringkasan stock harian dikirim via WhatsApp
   - Include summary: total stock in, total stock out, low stock count

7. **Multi-Gateway Support**
   - Konfigurasi beberapa WhatsApp Gateway dengan fallback
   - Auto-switch jika primary gateway down

8. **Notification History**
   - Tabel riwayat pengiriman WhatsApp (berhasil/gagal)
   - Retry manual untuk pesan yang gagal

---

**📄 End of PRD**
