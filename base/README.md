# 🍪 Apsari Patisserie

**Apsari Patisserie** adalah platform manajemen konten (CMS) mandiri yang dirancang khusus untuk mengelola operasional digital toko kue *handmade* Yogyakarta. Platform ini mengutamakan presisi visual tingkat tinggi, efisiensi pengelolaan inventaris, dan pelacakan data pelanggan secara *real-time*.

---

## 🚀 Fitur Utama & Keunggulan

### 1. **Visual Framing Engine (WYSIWYG)**
Sistem kustomisasi gambar produk yang menjamin sinkronisasi visual 100% antara Portal Admin dan Landing Page:
*   **Precision Zoom & Pan**: Kontrol penuh untuk mengatur skala dan posisi gambar menggunakan koordinat yang akurat.
*   **Aspect Ratio Sync**: Memastikan tampilan di admin (1:1) identik dengan tampilan *card* produk di sisi pelanggan.
*   **CORS Management**: Integrasi mulus aset grafis dari GitHub tanpa kendala keamanan browser.

### 2. **Real-time Business Analytics**
Pusat komando yang menyajikan data interaksi pengguna secara akurat tanpa ketergantungan pada database eksternal:
*   **Live Inventory Tracking**: Sinkronisasi otomatis dengan jumlah produk yang aktif di katalog.
*   **Visitor Counter**: Pelacakan jumlah kunjungan unik berbasis sesi lokal.
*   **CTA Interaction Monitor**: Mencatat setiap klik tombol pemesanan WhatsApp secara *real-time* untuk analisis konversi.
*   **Status Sistem**: Indikator visual lampu hijau berkedip (*ping pulse*) yang menunjukkan sinkronisasi aktif.

### 3. **Dynamic WhatsApp Order Integration**
Sistem komunikasi yang dipersonalisasi untuk setiap produk:
*   **Custom Automated Messaging**: Admin dapat menentukan pesan WhatsApp yang berbeda untuk tiap produk (misal: "Halo Apsari, saya mau pesan Semprit!").
*   **Dynamic Encoding**: Menjamin karakter khusus dan spasi pada pesan terbaca sempurna oleh API WhatsApp.

### 4. **Modern & Adaptive UI/UX**
*   **Mobile-First Design**: Navigasi bawah (*Bottom Nav*) yang intuitif untuk penggunaan di *smartphone*.
*   **Smart Sidebar**: Sidebar yang dapat menyusut (*collapsed*) dengan tetap menampilkan icon navigasi yang presisi.
*   **Custom Scrollbar**: Modifikasi *scrollbar* global menjadi tipis, membulat (*rounded*), dan elegan ala aplikasi SaaS kelas atas.

---

## 🛠️ Arsitektur Teknologi

*   **Core Framework**: React.js dengan TypeScript.
*   **Styling Engine**: Tailwind CSS untuk desain UI yang presisi dan responsif.
*   **State Management**: React Hooks & LocalStorage untuk persistensi data analitik.
*   **Build Tool**: Vite untuk kecepatan pengembangan dan efisiensi *bundling*.

---

## 📂 Struktur Repositori

| File / Direktori | Deskripsi |
| :--- | :--- |
| `src/` | Logika utama aplikasi, komponen React, dan pengelolaan state. |
| `index.html` | Struktur dasar Landing Page Apsari. |
| `fix-css.cjs` | Script optimasi untuk presisi layout dan padding. |
| `.env.example` | Template untuk konfigurasi API Key (Gemini). |
| `metadata.json` | Konfigurasi global dan data statis aplikasi. |

---

## 💻 Panduan Instalasi & Deployment

### Menjalankan Secara Lokal
1. **Instal Dependensi**:
   ```bash
   npm install
   ```
2. **Konfigurasi Environment**:
   Salin `.env.example` menjadi `.env.local` dan masukkan Gemini API Key Anda.
3. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```

### Deployment ke Vercel
1. Hubungkan repositori GitHub Anda ke Vercel.
2. Gunakan pengaturan berikut:
   *   **Framework Preset**: Vite.
   *   **Root Directory**: `./`.
   *   **Build Command**: `npm run build`.
   *   **Output Directory**: `dist`.
---

**© 2026 Apsari Patisserie — Crafted with Precision in Yogyakarta.**
