# 📘 Product Requirement Document (PRD) — User Management & Authentication & Pondasi Dasar

## 🧩 1. Ringkasan Singkat
**Deskripsi Singkat:**  
Dokumen ini mendefinisikan kebutuhan untuk sistem User Management & Authentication serta pondasi dasar aplikasi StockTrackApp, sistem monitoring stock keluar dengan arsitektur Repository Pattern dan Service Layer menggunakan teknologi Laravel + Inertia.js + React + PostgreSQL dengan pendekatan mobile-first.

**Status:** Draft  
**Prioritas:** Tinggi  
**Tanggal:** 2023-12-31  
**Author:** AI Software Product Analyst & Technical Writer  

---

## 🎯 2. Tujuan & Latar Belakang
Sistem User Management & Authentication menjadi fondasi keamanan dan kontrol akses untuk aplikasi StockTrackApp. Pondasi dasar aplikasi menyediakan struktur teknis yang diperlukan untuk pengembangan fitur-fitur bisnis utama.

**Alasan fitur ini dibuat:**
- Menyediakan sistem autentikasi yang aman dan andal untuk aplikasi internal
- Mengimplementasikan Role-Based Access Control (RBAC) untuk tiga role utama: Inventory Staff, Warehouse Supervisor, dan Management
- Membangun arsitektur dasar yang konsisten dengan pattern Repository dan Service Layer
- Menyediakan struktur UI/UX yang mobile-first untuk kemudahan operasional

**Masalah bisnis yang ingin diselesaikan:**
- Belum ada sistem autentikasi yang terintegrasi dengan aplikasi
- Perlu kontrol akses yang tepat berdasarkan peran pengguna
- Perlu struktur dasar aplikasi yang konsisten untuk pengembangan fitur selanjutnya
- Perlu antarmuka yang dioptimalkan untuk penggunaan mobile di lingkungan operasional

---

## 👥 3. Stakeholder
| Peran | Nama | Tanggung Jawab |
|-------|------|----------------|
| Product Owner | | Menentukan prioritas dan scope |
| Backend Developer | | Implementasi sistem autentikasi dan struktur dasar |
| Frontend Developer | | Implementasi UI/UX dan komponen dasar |
| DevOps | | Setup environment dan deployment |
| QA | | Uji fitur autentikasi dan keamanan |
| UI/UX Designer | | Desain antarmuka mobile-first |

---

## ⚙️ 4. Deskripsi Fitur

### 4.1. User Management & Authentication

#### 4.1.1. Alur Utama (Main Flow)
1. **Registrasi User**
   - Admin atau Warehouse Supervisor membuat akun user baru
   - Sistem mengirim email verifikasi (opsional untuk internal sistem)
   - User mengaktifkan akun melalui link verifikasi
   - User dapat login dengan kredensial yang dibuat

2. **Login**
   - User mengakses halaman login
   - User memasukkan email dan password
   - Sistem memvalidasi kredensial
   - Sistem membuat session dan redirect ke dashboard sesuai role
   - Sistem mencatat aktivitas login

3. **Logout**
   - User menekan tombol logout
   - Sistem menghapus session
   - Sistem redirect ke halaman login
   - Sistem mencatat aktivitas logout

4. **Role-Based Access Control**
   - Sistem mengidentifikasi role user setelah login
   - Sistem menyediakan menu dan fitur sesuai role
   - Sistem membatasi akses ke endpoint yang tidak diizinkan

5. **User Profile Management**
   - User dapat melihat profil pribadi
   - User dapat mengubah data dasar (nama, email)
   - User dapat mengubah password
   - Warehouse Supervisor dapat mengelola user lain

#### 4.1.2. Sub-Flow / Edge Case
- Jika user lupa password, user dapat request reset password melalui email
- Jika login gagal 3 kali, sistem akan lock account sementara (5 menit)
- Jika session expired, user akan di-redirect ke halaman login dengan pesan
- Jika user mencoba akses halaman tanpa izin, sistem akan menampilkan halaman 403

#### 4.1.3. UI/UX
- **Halaman yang terlibat:** Login, Register, Forgot Password, Reset Password, Profile, User Management
- **Wireframe:** Mobile-first design dengan form input yang sederhana
- **Elemen penting:** Form login, tombol login, link forgot password, notifikasi error/success, menu navigasi berdasarkan role

### 4.2. Pondasi Dasar Aplikasi

#### 4.2.1. Alur Utama (Main Flow)
1. **Setup Laravel + Inertia.js**
   - Inisiasi project Laravel
   - Install dan konfigurasi Inertia.js
   - Setup React dengan Hooks
   - Konfigurasi routing untuk SPA-like experience

2. **Struktur Database Awal**
   - Setup koneksi PostgreSQL
   - Buat migration untuk tabel users, roles, permissions
   - Setup seeder untuk role awal
   - Implementasi UUID untuk primary keys

3. **Layout dan Komponen Dasar UI**
   - Buat layout utama dengan header, sidebar, dan content area
   - Implementasi responsive design untuk mobile-first
   - Buat komponen reusable (form, button, modal, dll)
   - Setup state management dengan Redux Toolkit atau Context API

4. **Konfigurasi Awal dan Middleware**
   - Setup middleware untuk autentikasi
   - Setup middleware untuk role-based access control
   - Konfigurasi error handling
   - Setup logging dan monitoring

#### 4.2.2. Sub-Flow / Edge Case
- Jika database connection gagal, sistem akan menampilkan halaman error dengan informasi debugging
- Jika user tidak memiliki role yang valid, sistem akan menampilkan halaman error 403
- Jika terjadi error pada frontend, sistem akan menampilkan error boundary dengan opsi refresh

#### 4.2.3. UI/UX
- **Halaman yang terlibat:** Dashboard, Error Pages, Loading States
- **Wireframe:** Layout yang responsif dengan navigasi yang intuitif
- **Elemen penting:** Navigation menu, breadcrumb, loading spinner, toast notification, modal dialog

---

## 🧠 5. Behavior & Logika Bisnis

### 5.1. User Management & Authentication
- **Validasi Input:**
  - Email harus format yang valid dan unique
  - Password minimal 8 karakter dengan kombinasi huruf, angka, dan simbol
  - Nama user tidak boleh kosong
- **Logika Autentikasi:**
  - Password di-hash menggunakan bcrypt
  - Session berlaku selama 8 jam untuk keamanan
  - User hanya bisa login ke satu session aktif
- **Logika Role:**
  - Inventory Staff: Akses input data dan laporan dasar
  - Warehouse Supervisor: Akses penuh ke manajemen data dan user
  - Management: Akses view-only ke laporan dan dashboard
- **Password Reset:**
  - Token reset berlaku selama 1 jam
  - Link reset password dikirim ke email terdaftar
  - Password baru tidak boleh sama dengan 3 password sebelumnya

### 5.2. Pondasi Dasar Aplikasi
- **Struktur Repository Pattern:**
  - Setiap model memiliki Repository interface dan implementation
  - Repository menangani operasi database dasar (CRUD)
  - Service Layer mengimplementasikan business logic
- **Struktur Inertia.js:**
  - Backend mengirim props ke frontend melalui Inertia
  - Frontend menghandle state dan interaksi user
  - Navigation menggunakan Inertia links untuk SPA experience
- **Mobile-First Design:**
  - Layout dioptimalkan untuk layar minimal 320px
  - Touch-friendly elements dengan ukuran minimal 44px
  - Gestures support untuk swipe dan scroll

---

## 🔌 6. Integrasi & API

### 6.1. Endpoint User Management & Authentication
| Method | Endpoint | Deskripsi | Auth |
|---------|-----------|-----------|------|
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/logout` | Logout user | Required |
| POST | `/api/auth/register` | Registrasi user baru | Required |
| POST | `/api/auth/forgot-password` | Request reset password | Public |
| POST | `/api/auth/reset-password` | Reset password | Public |
| GET | `/api/auth/user` | Get current user info | Required |
| PUT | `/api/auth/profile` | Update profile | Required |
| PUT | `/api/auth/password` | Update password | Required |
| GET | `/api/users` | Get list users | Required |
| POST | `/api/users` | Create new user | Required |
| GET | `/api/users/{id}` | Get user detail | Required |
| PUT | `/api/users/{id}` | Update user | Required |
| DELETE | `/api/users/{id}` | Delete user | Required |
| GET | `/api/roles` | Get list roles | Required |
| GET | `/api/permissions` | Get list permissions | Required |

### 6.2. Endpoint Pondasi Dasar
| Method | Endpoint | Deskripsi | Auth |
|---------|-----------|-----------|------|
| GET | `/` | Dashboard page | Required |
| GET | `/dashboard` | Dashboard data | Required |
| GET | `/api/config` | Get app configuration | Required |
| POST | `/api/upload` | Upload file | Required |

### 6.3. Endpoint yang Terpengaruh
| Endpoint | Perubahan |
|-----------|------------|
| Semua endpoint bisnis | Menambahkan middleware auth dan role check |
| Semua response | Menambahkan user info dan permissions |

---

## 🧱 7. Struktur Data

### 7.1. Model / Entity

#### User Management & Authentication
```php
User {
    id: uuid
    name: string
    email: string (unique)
    email_verified_at: timestamp
    password: string (hashed)
    remember_token: string
    current_role_id: uuid
    is_active: boolean
    last_login_at: timestamp
    created_at: timestamp
    updated_at: timestamp
}

Role {
    id: uuid
    name: string (unique)
    display_name: string
    description: text
    is_active: boolean
    created_at: timestamp
    updated_at: timestamp
}

Permission {
    id: uuid
    name: string (unique)
    display_name: string
    description: text
    created_at: timestamp
    updated_at: timestamp
}

RoleUser {
    user_id: uuid (FK to users)
    role_id: uuid (FK to roles)
    assigned_by: uuid (FK to users)
    assigned_at: timestamp
}

PermissionRole {
    permission_id: uuid (FK to permissions)
    role_id: uuid (FK to roles)
    created_at: timestamp
}

PasswordResetToken {
    email: string
    token: string
    created_at: timestamp
}

UserSession {
    id: uuid
    user_id: uuid (FK to users)
    ip_address: string
    user_agent: text
    payload: text
    last_activity: timestamp
}
```

#### Pondasi Dasar
```php
AppConfiguration {
    id: uuid
    key: string (unique)
    value: text
    description: text
    is_public: boolean
    created_at: timestamp
    updated_at: timestamp
}

AuditLog {
    id: uuid
    user_id: uuid (FK to users)
    action: string
    table_name: string
    record_id: string
    old_values: json
    new_values: json
    ip_address: string
    user_agent: text
    created_at: timestamp
}
```

### 7.2. Migration / Schema

#### User Management & Authentication
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    current_role_id UUID NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Role assignments
CREATE TABLE role_user (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID NULL REFERENCES users(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Permission assignments
CREATE TABLE permission_role (
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (permission_id, role_id)
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload TEXT NOT NULL,
    last_activity TIMESTAMP NOT NULL
);
```

#### Pondasi Dasar
```sql
-- App configuration
CREATE TABLE app_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT NULL,
    is_public BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 7.3. Index yang Diperlukan
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_current_role_id ON users(current_role_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Roles
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_active ON roles(is_active);

-- Permissions
CREATE INDEX idx_permissions_name ON permissions(name);

-- User Sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 🧪 8. Acceptance Criteria

### 8.1. User Management & Authentication
| No | Kriteria | Diterima Jika |
|----|-----------|---------------|
| 1 | User dapat registrasi | Data user tersimpan dengan role default dan email terverifikasi |
| 2 | User dapat login dengan kredensial valid | Session dibuat dan user di-redirect ke dashboard sesuai role |
| 3 | User tidak dapat login dengan kredensial invalid | Pesan error ditampilkan dan tidak ada session yang dibuat |
| 4 | User dapat logout | Session dihapus dan user di-redirect ke halaman login |
| 5 | Role-based access control berfungsi | User hanya dapat akses fitur sesuai role yang dimiliki |
| 6 | Password reset berfungsi | User dapat reset password melalui email dan login dengan password baru |
| 7 | Profile management berfungsi | User dapat update data profil dan password |
| 8 | User management berfungsi | Admin dapat create, update, delete user dengan role assignment |

### 8.2. Pondasi Dasar Aplikasi
| No | Kriteria | Diterima Jika |
|----|-----------|---------------|
| 1 | Laravel + Inertia.js setup berhasil | Aplikasi berjalan dengan routing yang benar dan SPA experience |
| 2 | Database structure terbuat | Semua tabel dan relasi terbuat dengan benar |
| 3 | Repository pattern terimplementasi | Setiap model memiliki repository yang terstruktur dengan benar |
| 4 | Service layer terimplementasi | Business logic terpisah dengan baik dari controller |
| 5 | Layout responsif berfungsi | Aplikasi tampil optimal di mobile dan desktop |
| 6 | Komponen reusable berfungsi | Komponen dapat digunakan kembali di seluruh aplikasi |
| 7 | Middleware berfungsi | Auth dan role check berfungsi untuk melindungi endpoint |
| 8 | Error handling berfungsi | Error ditampilkan dengan user-friendly dan logging berfungsi |

---

## 🧰 9. Dependencies
- **Laravel 9.x+**: Framework backend
- **Inertia.js**: Bridge antara Laravel dan React
- **React**: Frontend framework dengan Hooks
- **PostgreSQL**: Database system
- **Redux Toolkit**: State management untuk React (opsional, bisa diganti dengan Context API)
- **Tailwind CSS**: CSS framework untuk styling
- **Laravel Breeze**: Starter kit untuk autentikasi
- **Spatie Laravel Permission**: Package untuk RBAC
- **Laravel UUID**: Package untuk UUID support
- **Laravel Audit**: Package untuk audit logging

---

## 🧩 10. Risiko & Mitigasi
| Risiko | Dampak | Solusi |
|--------|---------|--------|
| Session hijacking | Akses tidak sah ke akun user | Implementasi session timeout dan secure cookie |
| Password brute force | Akun dapat di-compromise | Implementasi rate limiting dan account lockout |
| SQL injection | Data dapat diakses tidak sah | Gunakan prepared statements dan ORM |
| XSS attack | Data user dapat dicuri | Implementasi input sanitization dan output escaping |
| CSRF attack | Aksi tidak sah atas nama user | Implementasi CSRF token pada semua form |
| Database connection failure | Aplikasi tidak dapat berfungsi | Implementasi connection retry dan error handling |
| Mobile compatibility issues | User experience buruk di mobile | Testing di berbagai device dan responsive design |
| Performance issues | Aplikasi lambat dan tidak responsif | Implementasi caching dan query optimization |

---

## 📊 11. Metrics / Success Criteria
- **Security**: 0 security breach incidents
- **Performance**: Login time < 2 seconds, page load time < 3 seconds
- **Usability**: User satisfaction rate > 4/5
- **Reliability**: Uptime 99.5% during business hours
- **Mobile Experience**: Mobile usability score > 85%
- **Code Quality**: Test coverage > 80%, code review approval rate > 95%

---

## 🚀 12. Rencana Implementasi
| Tahap | Tugas | Penanggung Jawab | Estimasi |
|--------|-------|------------------|-----------|
| 1 | Setup project Laravel + Inertia.js | Backend Dev | 2 hari |
| 2 | Setup database dan migration | Backend Dev | 1 hari |
| 3 | Implementasi User Authentication | Backend Dev | 3 hari |
| 4 | Implementasi Role-Based Access Control | Backend Dev | 2 hari |
| 5 | Setup React dan komponen dasar | Frontend Dev | 2 hari |
| 6 | Implementasi layout responsif | Frontend Dev | 3 hari |
| 7 | Implementasi Repository Pattern | Backend Dev | 2 hari |
| 8 | Implementasi Service Layer | Backend Dev | 2 hari |
| 9 | Integrasi frontend-backend | Fullstack Dev | 2 hari |
| 10 | Testing dan QA | QA | 3 hari |
| 11 | Documentation | Tech Writer | 1 hari |
| 12 | Deployment | DevOps | 1 hari |

---

## 🧾 13. Catatan Tambahan

### 13.1. User Management & Authentication
- Password harus di-hash menggunakan bcrypt dengan cost factor 12
- Email verification dapat di-skip untuk sistem internal
- Session timeout dapat dikonfigurasi melalui environment variable
- Default role untuk user baru adalah "Inventory Staff"
- Super admin account harus dibuat melalui seeder

### 13.2. Pondasi Dasar Aplikasi
- Gunakan UUID untuk semua primary keys untuk security dan scalability
- Implementasi soft deletes untuk data master
- Gunakan database transactions untuk operasi kritis
- Implementasi proper error logging dengan context
- Gunakan environment variables untuk semua konfigurasi sensitif

### 13.3. Mobile-First Design
- Gunakan viewport meta tag untuk proper mobile rendering
- Implementasi touch-friendly elements dengan ukuran minimal 44px
- Optimalkan untuk performa dengan lazy loading
- Implementasi swipe gestures untuk navigation
- Gunakan mobile-optimized form inputs

---

## ✅ 14. Checklist Sebelum Rilis
- [ ] Unit test untuk semua repository dan service lulus
- [ ] Feature test untuk semua user flow lulus
- [ ] Security test (penetration testing) lulus
- [ ] Performance test memenuhi kriteria
- [ ] Mobile compatibility test di berbagai device lulus
- [ ] Code review sudah disetujui
- [ ] Dokumentasi API sudah lengkap
- [ ] User manual sudah dibuat
- [ ] Deployment ke staging sukses
- [ ] User Acceptance Testing (UAT) sudah disetujui
- [ ] Backup dan recovery procedure sudah di-test
- [ ] Monitoring dan alerting sudah di-setup

---

## 📚 15. Referensi Teknis

### 15.1. Laravel Resources
- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Breeze Documentation](https://laravel.com/docs/starter-kits)
- [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)

### 15.2. Frontend Resources
- [React Documentation](https://react.dev/)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)

### 15.3. Database Resources
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [UUID Best Practices](https://www.ietf.org/rfc/rfc4122.txt)

---

**📄 End of PRD**