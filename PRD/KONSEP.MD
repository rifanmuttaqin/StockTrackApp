Kamu adalah seorang Senior Product Manager + System Analyst yang sangat detail, terbiasa menulis Product Requirements Document (PRD) profesional untuk aplikasi berbasis web & mobile.

TUGAS UTAMA:
Buatkan sebuah dokumen **PRD lengkap dalam format Markdown (.md)** untuk sebuah aplikasi internal monitoring stock keluar.

OUTPUT WAJIB:
- Format: Markdown (.md)
- Bahasa: Indonesia
- Struktur rapi, profesional, mudah dipahami oleh developer & stakeholder
- Fokus ke kebutuhan bisnis, alur user, dan kebutuhan teknis

DESKRIPSI UMUM APLIKASI:
Aplikasi ini adalah aplikasi sederhana untuk **monitoring stock keluar**, mirip seperti form stock opname, namun khusus untuk mencatat dan melaporkan **stock keluar**, bukan stock masuk.

TEKNOLOGI:
- Backend: Laravel
- Frontend: Inertia.js (UI Mobile-first)
- Database: PostgreSQL

FITUR & KEBUTUHAN FUNGSIONAL:

1. MASTER DATA
   - Master Produk
   - Produk memiliki banyak Varian (Produk Varian)
   - Setiap Produk Varian memiliki stock current

2. TEMPLATE STOCK KELUAR
   - User dapat membuat beberapa Template
   - Template berisi kumpulan grup/list Produk Varian
   - Template digunakan sebagai acuan input stock keluar
   - Satu Template bisa di-set sebagai **Template Aktif**
   - Template Aktif ditentukan melalui menu Pengaturan

3. INPUT STOCK KELUAR
   - User memilih tanggal input
   - Sistem otomatis menggunakan Template Aktif
   - Berdasarkan Template, user menginput stock keluar **satu per satu per Produk Varian**
   - Tersedia 2 status:
     a. Draft
        - Tidak mengurangi stock current
        - Tidak masuk laporan
     b. Submit (Publish)
        - Mengurangi stock current
        - Masuk ke laporan stock keluar

4. LAPORAN
   - Laporan stock keluar berdasarkan:
     - Tanggal
     - Produk
     - Produk Varian
     - Template
   - Data laporan hanya berasal dari data berstatus Submit

5. UI / UX
   - Mobile-first
   - Mirip form sederhana
   - Fokus ke kecepatan input
   - Minim klik
   - Cocok untuk penggunaan harian operasional

STRUKTUR PRD YANG WAJIB ADA:
1. Overview Produk
2. Tujuan Bisnis
3. Ruang Lingkup (In Scope & Out of Scope)
4. User Persona
5. User Flow (deskripsi teks, bukan diagram)
6. Functional Requirements (detail per fitur)
7. Non-Functional Requirements
8. Data Model (tabel utama & relasi, deskriptif)
9. Role & Permission (jika ada)
10. Edge Case & Validasi
11. Asumsi & Batasan
12. Catatan Teknis untuk Developer (Laravel, Inertia, PostgreSQL)

CATATAN PENTING:
- Jangan menulis kode
- Fokus pada kebutuhan produk & sistem
- Gunakan istilah teknis yang wajar untuk developer
- Gunakan heading Markdown (##, ###)
- Hasil akhir HARUS siap dijadikan dokumen PRD nyata
