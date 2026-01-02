# 📘 Product Requirement Document (PRD) — Mobile-First Layout Design Transformation

## 🧩 1. Ringkasan Singkat
**Deskripsi Singkat:**
Transformasi total layout aplikasi StockTrackApp menjadi mobile-first design menggunakan shadcn/ui untuk module dashboard, login, dan user management. Transformasi ini fokus pada perubahan UI/UX tanpa mengubah backend, API, atau logika bisnis yang sudah ada. Implementasi ini akan menjadi pondasi dasar untuk pengembangan module kedepannya dengan design system yang konsisten.

**Status:** Draft
**Prioritas:** Tinggi
**Tanggal:** 2026-01-02
**Author:** AI Software Product Analyst & Technical Writer

---

## 🎯 2. Tujuan & Latar Belakang
- Aplikasi StockTrackApp saat ini telah memiliki implementasi responsive design dasar dengan Tailwind CSS, namun belum optimal untuk penggunaan mobile
- Transformasi mobile-first akan menjadi fondasi untuk pengembangan module-module baru kedepannya
- Pengguna mengakses aplikasi dari berbagai perangkat dengan ukuran layar yang berbeda, membutuhkan pengalaman yang konsisten
- shadcn/ui menyediakan komponen UI modern yang telah teruji dengan aksesibilitas dan performa yang baik
- Mobile-first approach akan meningkatkan engagement dan usability pengguna mobile yang diproyeksikan meningkat 40% dalam 6 bulan ke depan
- Tidak ada perubahan pada backend atau endpoint yang sudah ada, fokus hanya pada transformasi UI/UX

---

## 👥 3. Stakeholder
| Peran | Nama | Tanggung Jawab |
|-------|------|----------------|
| Product Owner |  | Menentukan prioritas dan scope |
| Frontend Developer |  | Implementasi komponen shadcn/ui dan transformasi layout mobile |
| UI/UX Designer |  | Desain wireframe dan mockup mobile dengan design system |
| QA |  | Uji fitur pada berbagai perangkat mobile |

---

## ⚙️ 4. Deskripsi Fitur
Transformasi total layout aplikasi StockTrackApp menjadi mobile-first design menggunakan shadcn/ui untuk module yang sudah ada: dashboard, login, dan user management. Fokus pada perubahan UI/UX tanpa mengubah logika bisnis atau API yang sudah ada.

### 4.1. Design System Specification
#### 4.1.1. Typography
- **Font Family:** Poppins (Google Fonts)
- **Font Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Hierarchy:**
  - H1: 32px / 48px (Mobile: 24px / 36px) - Weight 700
  - H2: 28px / 42px (Mobile: 20px / 30px) - Weight 600
  - H3: 24px / 36px (Mobile: 18px / 28px) - Weight 600
  - H4: 20px / 30px (Mobile: 16px / 24px) - Weight 500
  - Body Large: 18px / 28px (Mobile: 16px / 24px) - Weight 400
  - Body: 16px / 24px (Mobile: 14px / 21px) - Weight 400
  - Body Small: 14px / 21px (Mobile: 12px / 18px) - Weight 400
  - Caption: 12px / 18px (Mobile: 10px / 15px) - Weight 400

#### 4.1.2. Color Palette
- **Primary Blue:** #2563EB (Blue 600)
- **Primary Light:** #3B82F6 (Blue 500)
- **Primary Dark:** #1D4ED8 (Blue 700)
- **Primary Darkest:** #1E40AF (Blue 800)
- **Secondary Blue:** #0EA5E9 (Sky 500)
- **Secondary Light:** #38BDF8 (Sky 400)
- **Background:** #F8FAFC (Slate 50)
- **Surface:** #FFFFFF (White)
- **Text Primary:** #0F172A (Slate 900)
- **Text Secondary:** #475569 (Slate 600)
- **Text Tertiary:** #94A3B8 (Slate 400)
- **Border:** #E2E8F0 (Slate 200)
- **Error:** #EF4444 (Red 500)
- **Warning:** #F59E0B (Amber 500)
- **Success:** #10B981 (Emerald 500)

#### 4.1.3. Spacing & Sizing
- **Base Unit:** 4px
- **Scale:** 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px
- **Component Heights:**
  - Buttons: 32px (Small), 40px (Medium), 48px (Large)
  - Inputs: 40px (Medium), 48px (Large)
  - Navigation Bar: 56px (Mobile), 64px (Desktop)
- **Border Radius:** 4px (Small), 8px (Medium), 12px (Large), 16px (Extra Large)

### 4.2. Alur Utama (Main Flow)
1. Pengguna mengakses aplikasi melalui perangkat mobile
2. Sistem mendeteksi ukuran layar dan menerapkan layout mobile-first
3. Komponen shadcn/ui yang responsif dirender sesuai dengan ukuran layar
4. Navigasi disesuaikan dengan pattern mobile (bottom navigation, hamburger menu)
5. Konten ditata dengan hierarki yang sesuai untuk layar kecil dengan design system yang konsisten

### 4.3. Sub-Flow / Edge Case
- Jika ukuran layar berubah (rotasi), layout akan menyesuaikan secara dinamis
- Jika device tidak mendukung feature tertentu, sistem akan fallback ke komponen dasar
- Jika loading data terlalu lama, skeleton loader akan ditampilkan dengan warna biru primary

### 4.4. UI/UX
- Halaman yang terlibat: Login, Dashboard, User Management (Index, Create, Edit, Show)
- Wireframe: Mobile-first design dengan bottom navigation, card-based layout, dan swipe gestures
- Elemen penting: Bottom navigation bar, floating action button, collapsible sidebar, mobile-optimized tables, touch-friendly buttons
- Design System: Menggunakan font Poppins dan warna biru sebagai identitas visual yang konsisten

---

## 🧠 5. Behavior & Logika Bisnis
- Layout akan beradaptasi berdasarkan breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Navigation pattern berubah dari sidebar (desktop) menjadi bottom navigation (mobile)
- Tables akan dikonversi menjadi card layout pada layar mobile untuk readability yang lebih baik
- Forms akan menggunakan full-width layout dengan input yang lebih besar untuk kemudahan input pada mobile
- Dashboard widgets akan ditata dalam single column layout pada mobile dengan scroll yang optimal

---

## 🔌 6. Integrasi & API
### 6.1. Endpoint Baru
**Tidak ada endpoint baru yang akan ditambahkan.**

### 6.2. Endpoint yang Terpengaruh
**Tidak ada perubahan pada endpoint yang sudah ada.** Semua endpoint backend akan tetap digunakan apa adanya tanpa modifikasi. Transformasi ini fokus pada perubahan frontend layout saja.

### 6.3. Integrasi Frontend
- Frontend akan menggunakan endpoint yang sudah ada tanpa perubahan
- Data response akan dioptimasi di frontend untuk tampilan mobile
- Tidak ada perubahan pada struktur data atau format response dari backend

---

## 🧱 7. Struktur Data
### 7.1. Model / Entity (Tidak ada perubahan pada model yang ada)
```php
User {
    id: uuid
    name: string
    email: string
    // ... existing fields
}
```

### 7.2. Komponen shadcn/ui yang akan dikustomisasi
```jsx
// Mobile Navigation Components
<BottomNavigation className="bg-blue-600 text-white" />
<MobileMenu className="bg-white border-blue-200" />

// Mobile Layout Components
<MobileCard className="bg-white border-blue-100 shadow-md" />
<MobileTable className="text-slate-900" />
<MobileForm className="space-y-4" />

// shadcn/ui Customized Components
<Button variant="default" size="lg" className="w-full bg-blue-600 hover:bg-blue-700" />
<Card className="shadow-lg border-blue-100" />
<Input className="h-12 text-base border-blue-200 focus:border-blue-500" />
<Sheet className="bg-white" />
<Drawer className="bg-white" />
```

### 7.3. Kustomisasi shadcn/ui dengan Design System
- **Button:** Menggunakan warna biru primary (#2563EB) dengan variasi hover dan active states
- **Card:** Border dengan warna biru muda (#E2E8F0) dan shadow yang konsisten
- **Input:** Border biru saat focus dengan font Poppins
- **Navigation:** Background biru primary dengan teks putih
- **Typography:** Mengimplementasikan font Poppins untuk semua komponen

---

## 🧪 8. Acceptance Criteria
| No | Kriteria | Diterima Jika |
|----|-----------|---------------|
| 1 | Layout responsif pada mobile | Tampilan optimal pada ukuran layar 320px-768px |
| 2 | Navigasi mobile-friendly | Bottom navigation dengan ikon yang jelas dan tap area minimal 44px |
| 3 | Tables readable pada mobile | Data ditampilkan dalam format card pada layar < 768px |
| 4 | Forms mudah digunakan pada mobile | Input fields dengan tinggi minimal 44px dan spacing yang cukup |
| 5 | Touch interaction optimal | Semua interactive elements memiliki tap area minimal 44px |
| 6 | Performa loading | Halaman mobile load time < 2 detik pada koneksi 3G |
| 7 | Konsistensi desain | Semua module menggunakan komponen shadcn/ui yang konsisten |

---

## 🧰 9. Dependencies
- [x] shadcn/ui package installation
- [x] Tailwind CSS configuration untuk mobile-first approach
- [x] React/Inertia.js existing structure
- [x] Laravel backend API yang sudah ada
- [x] Permission-based access system yang sudah ada

---

## 🧩 10. Risiko & Mitigasi
| Risiko | Dampak | Solusi |
|--------|---------|--------|
| Kompatibilitas browser mobile | Tampilan tidak konsisten di berbagai device | Progressive enhancement dan fallback untuk browser lama |
| Performa pada device low-end | Loading time lambat | Lazy loading dan code splitting untuk mobile |
| Touch interaction issues | User experience buruk | Testing pada berbagai device dan implementasi proper touch targets |
| Breaking changes pada existing features | Regression bugs | Comprehensive testing dan gradual rollout |

---

## 📊 11. Metrics / Success Criteria
- Target 80% user engagement pada mobile dalam 3 bulan
- Bounce rate pada mobile < 30%
- Average session duration pada mobile meningkat 25%
- Task completion rate pada mobile > 85%
- Loading time < 2 detik pada 3G network

---

## 🚀 12. Rencana Implementasi
| Tahap | Tugas | Penanggung Jawab | Estimasi |
|--------|-------|------------------|-----------|
| 1 | Setup shadcn/ui dan konfigurasi mobile-first dengan design system | Frontend Dev | 2 hari |
| 2 | Implementasi design system (font Poppins, warna biru) | Frontend Dev | 2 hari |
| 3 | Implementasi mobile navigation dengan design system | Frontend Dev | 2 hari |
| 4 | Redesign login page untuk mobile dengan design system | Frontend Dev | 1 hari |
| 5 | Redesign dashboard untuk mobile dengan design system | Frontend Dev | 3 hari |
| 6 | Redesign user management untuk mobile dengan design system | Frontend Dev | 3 hari |
| 7 | Cross-device testing dengan fokus pada design system | QA | 2 hari |
| 8 | Performance optimization untuk mobile-first | Frontend Dev | 2 hari |

### 12.1. Migrasi Gradual Komponen
- **Phase 1:** Transformasi komponen fundamental (Button, Input, Card) dengan design system
- **Phase 2:** Implementasi layout components (Navigation, Layouts)
- **Phase 3:** Transformasi page-specific components (Dashboard, User Management)
- **Phase 4:** Optimasi dan fine-tuning untuk mobile experience

---

## 🧾 13. Catatan Tambahan
- Implementasi akan menggunakan mobile-first approach dengan progressive enhancement
- Komponen shadcn/ui akan dikustomisasi dengan font Poppins dan warna biru sesuai design system
- Touch gestures akan ditambahkan untuk interaksi yang lebih natural pada mobile
- Tidak ada perubahan pada backend atau endpoint yang sudah ada
- Design system yang dibuat akan menjadi pondasi untuk pengembangan module-module baru
- Offline capability akan dipertimbangkan untuk future enhancement

---

## ✅ 14. Checklist Sebelum Rilis
- [ ] Unit test untuk komponen mobile lulus semua
- [ ] Cross-device testing checklist disetujui
- [ ] Performance benchmark memenuhi target
- [ ] Accessibility testing pada mobile selesai
- [ ] User acceptance testing (UAT) dengan pengguna mobile selesai
- [ ] Documentation untuk mobile components diperbarui

---

## 📁 15. File yang akan ditambahkan dan diubah

### 15.1. File yang akan ditambahkan
```
resources/js/Components/Layouts/MobileLayout.jsx
resources/js/Components/Navigation/BottomNavigation.jsx
resources/js/Components/Navigation/MobileMenu.jsx
resources/js/Components/UI/MobileCard.jsx
resources/js/Components/UI/MobileTable.jsx
resources/js/Components/UI/MobileForm.jsx
resources/js/Components/UI/MobileButton.jsx
resources/js/Components/Dashboard/MobileDashboard.jsx
resources/js/Components/Auth/MobileLogin.jsx
resources/js/Components/Users/MobileUserList.jsx
resources/js/Components/Users/MobileUserCard.jsx
resources/js/Hooks/useMobileDetection.js
```

### 15.2. File yang akan diubah
```
resources/js/app.jsx (untuk mobile detection)
resources/js/Layouts/AppLayout.jsx (untuk conditional rendering)
resources/js/Layouts/AuthenticatedLayout.jsx (untuk mobile navigation)
resources/js/Pages/Dashboard.jsx (untuk mobile view)
resources/js/Pages/Auth/Login.jsx (untuk mobile view)
resources/js/Pages/Users/Index.jsx (untuk mobile view)
resources/js/Components/Tables/UserTable.jsx (untuk mobile responsive)
tailwind.config.cjs (untuk mobile-first configuration dan design system)
package.json (menambahkan shadcn/ui dependencies)
resources/css/app.css (untuk font Poppins dan design system variables)
```

### 15.3. Konfigurasi Design System
```
// tailwind.config.cjs akan ditambahkan:
theme: {
  extend: {
    fontFamily: {
      'poppins': ['Poppins', 'sans-serif'],
    },
    colors: {
      'primary': {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      }
    }
  }
}
```

---

**📄 End of PRD**
