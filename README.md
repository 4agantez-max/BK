# Underwater Room — Pameran Karya

Website React + Vite + Tailwind dengan `HashRouter`, disiapkan untuk GitHub Pages dan Firebase. Jika Firebase belum dikonfigurasi, aplikasi berjalan dalam **mode demo** dengan enam karya contoh dan penyimpanan sementara di `sessionStorage`.

## Jalankan lokal

```bash
npm install
npm run dev
```

Demo admin: buka `/#/admin`, lalu masuk menggunakan:

- Email: `admin@underwaterroom.id`
- Password: `underwater-demo`

Login ini hanya untuk demo lokal. Jangan gunakan sebagai autentikasi produksi.

## Konfigurasi Firebase

1. Buat proyek Firebase dengan Firestore dan Authentication (Google).
2. Salin `.env.example` menjadi `.env.local`, lalu isi konfigurasi Web Firebase. Konfigurasi Web Firebase bersifat publik; jangan masukkan service-account key atau private key.
3. Aktifkan App Check dengan reCAPTCHA v3. Isi `VITE_FIREBASE_APPCHECK_SITE_KEY`, deploy situs, lalu aktifkan enforcement untuk Firestore dari Firebase Console.
4. Aktifkan provider Google di Firebase Console > Authentication > Sign-in method dan pastikan domain lokal serta domain deployment ada di daftar authorized domains.
5. Buat dokumen `admins/{email}` di Firestore lewat Console, dengan ID dokumen berupa email Google admin yang terverifikasi (huruf kecil). Tidak perlu membuat akun admin secara manual di Authentication; pengguna akan dibuat saat pertama kali login dengan Google. Hanya email terverifikasi yang tercatat di koleksi `admins` yang dapat mengakses data admin.
6. Deploy `firestore.rules` dan `firestore.indexes.json` dari Firebase Console atau Firebase CLI. Buat dokumen `settings/config` dengan field `feedbackOpen: true` dan konfigurasi `questions` yang sama dengan `src/data/works.js`.
7. Tambahkan dokumen karya ke koleksi `works`. Bentuk field mengikuti objek contoh di `src/data/works.js`; field dokumen `works` menggunakan `title`, `creator`, `description`, `images`, `linkUrl`, `apk`, `extras`, `order`, dan `visible`.
8. Di Google Cloud Console, batasi API key Firebase ke domain GitHub Pages dan localhost serta API yang diperlukan. Jangan mengandalkan kerahasiaan API key frontend.

UI tidak menyediakan sign-up. Akses admin tetap harus dilindungi melalui Firebase Auth **dan** Security Rules; hanya menyembunyikan halaman admin bukan kontrol keamanan.

Perhatian: login Google pertama kali dapat membuat akun di Firebase Authentication secara otomatis. Itu tidak otomatis memberi akses admin: hanya email Google terverifikasi yang memiliki dokumen `admins/{email}` yang dapat mengakses data admin menurut Security Rules. Pengguna Google lain mungkin tercatat di Authentication, tetapi tetap tidak mendapat akses admin.

### Data publik dan moderasi

- Komentar karya dan feedback keseluruhan dibuat dengan status `approved: false`.
- Feedback mentah (rating, jawaban, dan komentar) hanya dibaca admin.
- Komentar feedback keseluruhan yang disetujui disalin ke `publicFeedbackComments`, agar rating dan jawaban pilihan ganda tidak ikut terbaca publik.
- Pengunjung hanya bisa membaca komentar karya yang disetujui dan tidak disembunyikan.
- Rules membatasi field, panjang teks, status awal komentar, HTTPS untuk link karya, serta perubahan statistik.

Uji rules sebagai pengunjung anonim dan admin menggunakan Firebase Emulator atau Rules Playground sebelum rilis. Firestore Rules tidak dapat mengubah public API key menjadi secret; pembatasan akses data harus selalu dilakukan melalui rules dan App Check.

## Gambar dan aplikasi

- Taruh gambar karya yang sudah dioptimasi di `public/images/`, idealnya WebP di bawah 300 KB. Isi path seperti `images/karya-01.webp` pada form admin.
- Admin tidak bisa mengunggah gambar dari browser. Tambahkan file melalui perubahan repo.
- Upload APK ke GitHub Releases, lalu isi URL HTTPS, ukuran, versi, dan checksum SHA-256 pada data karya.

## Deploy GitHub Pages

Workflow `.github/workflows/deploy.yml` membangun proyek dan menerbitkan folder `dist` saat ada push ke branch `main`.

1. Push repo ke GitHub dan pilih Settings > Pages > Source: **GitHub Actions**.
2. Tambahkan nilai Firebase `VITE_...` sebagai GitHub Actions Variables (bukan service-account secrets). App Check site key juga bukan secret.
3. Aktifkan Secret Scanning dan Push Protection pada repo, serta tinjau hasil `npm audit`.
4. Pastikan API key Firebase dibatasi ke host GitHub Pages yang benar.

Alamat admin tetap `https://USERNAME.github.io/NAMA-REPO/#/admin`.

## Batas mode demo

Data contoh tidak terhubung ke Firebase, autentikasi demo tidak membuktikan identitas admin, dan statistik demo hanya berlaku pada tab sesi tersebut. Gambar, link redirect, dan APK belum diisi aset produksi. Sambungkan dan uji Firebase sebelum situs dipakai untuk menerima feedback publik.
