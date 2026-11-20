# PRD: Website Pameran Karya

Versi 1.0 | 19 November 2026 | Status: Draft untuk review

## 1. Ringkasan

Website pameran karya online yang menampilkan sekitar 6 karya (gambar, info, link redirect, dan download aplikasi bila ada), mengumpulkan feedback pengunjung per karya dan untuk pameran secara keseluruhan, serta memantau jumlah pengunjung. Admin mengelola konten, memoderasi komentar, dan mengekspor data lewat halaman admin.

Hosting memakai GitHub Pages (repo publik) dan database memakai Firebase (Firestore dan Authentication) di plan gratis (Spark).

## 2. Tujuan dan Non-Tujuan

**Tujuan**

- Menampilkan karya dengan nyaman di HP maupun layar lebih besar.
- Mengumpulkan feedback pengunjung secara anonim dan terkontrol (dimoderasi admin).
- Memberi admin angka pengunjung tanpa melanggar privasi.
- Memungkinkan pengunjung mengunduh aplikasi (APK) yang dipamerkan langsung dari website.
- Tidak ada kebocoran secret di repo GitHub maupun di sisi pengguna.

**Non-tujuan**

- Tidak ada checkout atau pembayaran.
- Tidak ada login untuk pengunjung.
- Tidak ada pengelompokan karya (kategori, filter).
- Tidak ada penghitungan jumlah download.
- Tidak ada backend server sendiri (Cloud Functions tidak dipakai).
- Tidak ada pelacakan IP, lokasi, atau data pribadi pengunjung.

## 3. Pengguna

| Peran | Deskripsi | Akses |
| --- | --- | --- |
| Pengunjung | Publik, anonim, tanpa login | Lihat karya, kirim feedback, unduh APK, ganti bahasa |
| Admin | Beberapa orang, akun dibuat manual | Login email/password, kelola semua konten dan data |

## 4. Keputusan Utama

| Topik | Keputusan |
| --- | --- |
| Frontend | React + Vite + Tailwind CSS, mobile-first dan responsif |
| Routing | HashRouter (contoh `/#/karya/3`) agar aman di GitHub Pages dan cocok untuk QR code |
| Deploy | GitHub Actions otomatis setiap push ke branch utama |
| Database | Firestore (Spark/gratis) |
| Auth | Firebase Auth email/password, sign-up publik dimatikan |
| Gambar karya | Di-commit ke repo (di-optimasi) |
| File APK | GitHub Releases, link dimasukkan ke data karya |
| Bahasa | UI Indonesia dan Inggris. Konten karya satu bahasa saja, diisi admin |
| Visitor tracking | Buatan sendiri di Firestore, ID acak anonim di localStorage |
| Moderasi | Komentar per karya harus di-approve admin sebelum tampil di publik |
| Export | JSON, hanya admin |

## 5. Fitur Publik

### 5.1 Halaman Beranda / Galeri

- Header pameran (judul, deskripsi singkat) dan pemilih bahasa (ID/EN).
- Daftar karya (sekitar 6) dalam bentuk kartu: gambar utama, judul, kreator.
- Layout: 1 kolom di HP, 2 kolom di tablet, 3 kolom di desktop.
- Tombol/bagian untuk membuka form feedback pameran (jika feedback sedang dibuka).

### 5.2 Halaman Detail Karya

- Galeri gambar (lebih dari satu, bisa digeser/swipe).
- Judul, kreator, deskripsi, dan field opsional tambahan (misalnya tahun, tools, tag) yang tampil hanya jika diisi.
- Tombol **Buka Link** jika karya punya link redirect (dibuka di tab baru dengan `rel="noopener noreferrer"`).
- Tombol **Download Aplikasi (APK)** hanya muncul jika karya punya aplikasi. Menampilkan ukuran file, versi (opsional), checksum SHA-256, dan catatan: "Aplikasi belum ditandatangani resmi, Android mungkin menampilkan peringatan saat instalasi."
- Bagian komentar: daftar komentar yang sudah disetujui admin, dan form kirim komentar.

### 5.3 Feedback per Karya

- Isi: komentar teks saja (tanpa rating, tanpa pilihan ganda).
- Nama opsional (kosong = "Anonim").
- Batas panjang: komentar maksimal 500 karakter, nama maksimal 50 karakter.
- Satu perangkat hanya bisa mengirim satu komentar per karya.
- Komentar yang dikirim berstatus **menunggu persetujuan**, baru tampil di publik setelah admin approve.
- Pengunjung melihat pesan "Terima kasih, komentar menunggu persetujuan admin."
- Form ditutup otomatis jika admin menutup periode feedback.

### 5.4 Feedback Keseluruhan Pameran

- Isi: rating bintang (1-5), pertanyaan pilihan ganda, dan komentar teks bebas.
- Nama opsional, anonim secara default.
- Satu perangkat satu kali pengisian.
- Daftar pertanyaan pilihan ganda dikelola sebagai konfigurasi (lihat Lampiran A untuk draft).
- Hanya komentar teks yang bisa ditampilkan ke publik setelah di-approve. Rating dan pilihan ganda hanya terlihat oleh admin (rekap rata-rata bisa dibahas di versi berikutnya).

### 5.5 Multi-Bahasa (UI)

- Bahasa: Indonesia (default) dan Inggris.
- Bahasa awal mengikuti bahasa browser, jika bukan ID/EN maka Indonesia. Pilihan pengunjung disimpan di localStorage.
- Yang diterjemahkan: teks UI, label, pesan sistem, dan pertanyaan feedback pameran.
- Yang **tidak** diterjemahkan: konten karya (judul, deskripsi) dan komentar pengunjung.

### 5.6 Tracking Visitor (otomatis, tanpa tampilan)

- Saat website dibuka, aplikasi membuat atau membaca ID acak (UUID) di localStorage.
- ID belum ada: dicatat sebagai **visitor baru** (unique +1) dan total kunjungan +1.
- ID sudah ada: hanya total kunjungan +1. Satu sesi browser dihitung sebagai satu kunjungan (memakai sessionStorage agar refresh tidak menambah hitungan).
- Saat halaman detail karya dibuka: view karya tersebut +1 (sekali per sesi per karya).
- Data yang disimpan: ID acak, waktu pertama dan terakhir kunjungan, jumlah kunjungan. **Tidak menyimpan** IP, lokasi, user agent lengkap, atau data pribadi.
- Karena tidak memakai cookie pelacak atau data pribadi, tidak diperlukan banner consent. Tetap sediakan catatan privasi singkat di footer.
- Angka unique visitor adalah perkiraan (ganti perangkat, mode incognito, atau hapus data browser akan terhitung visitor baru).

## 6. Fitur Admin

Admin mengakses halaman `/#/admin` dan harus login.

### 6.1 Autentikasi

- Login email dan password lewat Firebase Auth.
- Sign-up publik dimatikan. Akun admin dibuat manual di Firebase Console.
- Hak admin ditentukan oleh daftar UID admin di Firestore (koleksi `admins`), dicek oleh Security Rules. Tampilan halaman admin saja tidak cukup sebagai pengamanan.
- Logout, dan sesi berakhir mengikuti kebijakan Firebase Auth.

### 6.2 Kelola Karya (CRUD)

Field karya:

- Judul (wajib)
- Kreator (wajib)
- Deskripsi
- Gambar (satu atau lebih, berupa path file di repo)
- Link redirect (opsional)
- Link download APK dari GitHub Releases (opsional), ukuran file, versi, SHA-256 (opsional)
- Field tambahan bebas (pasangan label dan nilai, misalnya Tahun, Tools)
- Urutan tampil
- Status tampil/sembunyikan

Catatan: karena gambar disimpan di repo, menambah gambar baru berarti commit file ke repo, lalu admin mengisi path-nya di form. Tombol upload langsung tidak tersedia (Firebase Storage berbayar).

### 6.3 Moderasi Feedback

- Daftar komentar per karya dengan status: menunggu, disetujui, disembunyikan.
- Aksi: approve, sembunyikan, hapus.
- Lihat semua feedback keseluruhan pameran (rating, pilihan ganda, komentar), dengan rekap rata-rata rating dan sebaran jawaban pilihan ganda.
- Komentar overall yang ingin ditampilkan di publik harus di-approve terlebih dahulu.

### 6.4 Pengaturan

- Tombol buka/tutup feedback (per karya dan overall, atau satu saklar global).
- Opsional: tanggal mulai dan selesai pameran, dan setelah tanggal selesai feedback otomatis tertutup.

### 6.5 Dashboard Visitor

- Total kunjungan, unique visitor, dan view per karya.
- Opsional: grafik kunjungan per hari.

### 6.6 Export JSON

Tombol export (diunduh dari browser admin) untuk:

- Semua feedback per karya
- Semua feedback keseluruhan pameran
- Data visitor dan statistik
- Data karya

Format: file JSON dengan stempel waktu ekspor di nama file. Hanya admin yang login yang bisa mengakses data mentah ini.

## 7. Model Data (Firestore)

| Koleksi | Dokumen | Isi utama | Akses |
| --- | --- | --- | --- |
| `admins` | `{uid}` | penanda admin | Baca: admin. Tulis: hanya lewat Console |
| `works` | `{workId}` | judul, kreator, deskripsi, images\[\], linkUrl, apk{url,size,version,sha256}, extras\[\], order, visible | Baca: publik (yang visible). Tulis: admin |
| `works/{id}/comments` | `{workId}_{visitorId}` | name, text, approved, hidden, createdAt | Buat: publik (sekali). Baca: publik hanya approved dan tidak hidden. Ubah/hapus: admin |
| `exhibitionFeedback` | `{visitorId}` | name, rating, answers{}, comment, approved, createdAt | Buat: publik (sekali). Baca publik: hanya komentar approved. Ubah/hapus: admin |
| `visitors` | `{visitorId}` | firstSeen, lastSeen, visitCount | Buat/ubah terbatas: publik. Baca: admin |
| `stats` | `global`, `works_{workId}` | totalVisits, uniqueVisitors, views | Increment terbatas: publik. Baca: admin |
| `settings` | `config` | feedbackOpen, startDate, endDate, daftar pertanyaan | Baca: publik. Tulis: admin |

Catatan desain:

- ID dokumen komentar dan feedback berbentuk `{workId}_{visitorId}` atau `{visitorId}`, dan rules hanya mengizinkan **create** (bukan update) sehingga satu perangkat hanya bisa mengirim sekali.
- Untuk menampilkan komentar yang disetujui, query publik wajib memakai filter `approved == true` sesuai rules.
- Batasan: visitorId dibuat di sisi klien sehingga pengguna yang sengaja menghapus localStorage dapat mengirim lebih dari sekali. Ini diterima dan dimitigasi dengan App Check serta moderasi admin.

## 8. Keamanan

### 8.1 Prinsip

Konfigurasi Firebase di frontend (apiKey, projectId, dan sebagainya) **memang terlihat oleh pengguna** pada aplikasi statis seperti GitHub Pages. Itu bukan secret. Keamanan data berasal dari Security Rules, App Check, dan pembatasan API key, bukan dari menyembunyikan config.

### 8.2 Requirement

1. **Firestore Security Rules ketat** (default deny): hanya akses yang disebut di bagian 7 yang diizinkan. Rules memvalidasi tipe data, panjang teks, field yang boleh diisi, dan nilai awal (misalnya `approved` wajib `false` saat pengunjung membuat komentar). Increment statistik hanya boleh +1.
2. **Pengecekan admin di rules** lewat koleksi `admins`, bukan hanya di UI.
3. **Firebase App Check** dengan reCAPTCHA (v3 atau Enterprise) diaktifkan dan di-enforce untuk Firestore, untuk mengurangi spam dan penyalahgunaan dari luar website.
4. **Pembatasan API key** di Google Cloud Console: batasi HTTP referrer ke domain GitHub Pages (dan localhost untuk pengembangan), serta batasi API yang boleh dipakai.
5. **Auth**: sign-up publik dimatikan, hanya email/password, password kuat, admin dibuat manual. Pertimbangkan membatasi percobaan login.
6. **Tidak ada secret di repo**: service account JSON, private key, token, dan file `.env` berisi rahasia tidak boleh ada di repo maupun di history. Hanya config web Firebase publik yang boleh ada di kode atau variabel `VITE_...`.
7. **`.gitignore`** mencakup `.env*`, `*.pem`, `*serviceAccount*.json`, `firebase-debug.log`, dan folder `node_modules`.
8. **GitHub secret scanning dan push protection** diaktifkan di repo. Tambahkan pemindaian tambahan (misalnya gitleaks) sebagai langkah di GitHub Actions dan/atau pre-commit hook.
9. **Tanpa data sensitif di sisi pengguna**: localStorage hanya berisi ID visitor acak dan preferensi bahasa. Tidak ada token admin atau data pribadi yang disimpan manual.
10. **Proteksi XSS**: komentar dan nama dirender sebagai teks (bukan HTML), tidak memakai `dangerouslySetInnerHTML`.
11. **Link keluar** memakai `rel="noopener noreferrer"`. Hanya URL berskema `https` yang diterima untuk link redirect dan APK.
12. **Content Security Policy** dasar lewat meta tag jika memungkinkan.
13. **Dependensi**: aktifkan Dependabot dan `npm audit` di CI.
14. **Ekspor data** hanya berjalan di sisi admin yang sudah terautentikasi, data mentah tidak pernah tersedia ke publik.

### 8.3 Keamanan File APK

- Hosting di GitHub Releases, bukan di repo.
- Tampilkan checksum SHA-256 di halaman karya agar pengunjung bisa memverifikasi.
- Tampilkan catatan bahwa aplikasi belum ditandatangani resmi dan pengunjung perlu mengizinkan instalasi dari sumber luar Play Store.
- Tidak ada file APK yang di-commit ke repo.

### 8.4 Checklist Sebelum Push / Rilis

- [ ] Tidak ada file `.env`, service account, atau private key yang ter-stage (`git status`, `git diff --cached`)
- [ ] Hasil scan gitleaks bersih
- [ ] Security Rules sudah di-deploy dan diuji dengan Firebase Emulator atau Rules Playground
- [ ] App Check aktif dan enforcement Firestore menyala
- [ ] API key sudah dibatasi referrer dan API
- [ ] Sign-up publik di Firebase Auth nonaktif
- [ ] Hanya akun admin yang terdaftar di `admins`
- [ ] Secret scanning dan push protection GitHub aktif
- [ ] Uji sebagai pengunjung anonim: tidak bisa membaca `visitors`, `stats`, komentar belum disetujui, maupun feedback pameran mentah
- [ ] Jika pernah ada secret masuk history, **rotasi/cabut secret tersebut**, jangan hanya menghapus commit

## 9. Persyaratan Non-Fungsional

- **Mobile-first**: dirancang dari lebar 360 px, responsif hingga desktop. Target tap minimal 44 px.
- **Performa**: gambar dioptimasi (WebP/JPEG terkompresi, lebar maksimal sekitar 1600 px, lazy loading, ukuran ideal di bawah 300 KB per gambar). Target Lighthouse Performance 85+ di mobile.
- **Aksesibilitas**: alt text pada gambar, kontras warna cukup, navigasi keyboard, label form jelas.
- **SEO dasar**: judul dan meta description, Open Graph. Catatan: karena HashRouter, preview per karya saat dibagikan akan terbatas.
- **Browser**: dua versi terbaru Chrome, Safari, Firefox, Edge, termasuk browser mobile.
- **Batas gratis (Spark)**: kuota baca/tulis Firestore harian cukup untuk skala pameran kecil. Hindari listener realtime yang tidak perlu dan cache hasil baca bila bisa.
- **Privasi**: tidak menyimpan IP atau data pribadi. Catatan privasi singkat di footer menjelaskan data apa yang dicatat. Nama di feedback bersifat opsional dan sukarela.

## 10. Arsitektur Teknis

- **Frontend**: React, Vite, Tailwind CSS, React Router (HashRouter), library i18n ringan (misalnya `react-i18next` atau implementasi sederhana).
- **Firebase**: Firestore, Authentication, App Check. Tidak memakai Storage dan Cloud Functions.
- **Hosting**: GitHub Pages dengan `base` Vite disesuaikan nama repo, deploy lewat GitHub Actions (build lalu publish ke Pages).
- **Config**: nilai config Firebase publik lewat `VITE_...` (boleh ter-bundle). Secret tidak boleh memakai mekanisme ini.
- **Struktur repo (usulan)**: `src/` (komponen, halaman, i18n), `public/images/` (gambar karya), `firestore.rules`, `.github/workflows/` (deploy dan scan), `README.md` (panduan admin dan checklist keamanan).
- **Alur APK**: admin upload APK ke GitHub Releases, salin URL asset ke form karya di halaman admin, isi ukuran dan SHA-256.

## 11. Kriteria Penerimaan (ringkas)

1. Pengunjung dapat melihat semua karya yang berstatus tampil, di HP dan desktop tanpa layout rusak.
2. Detail karya menampilkan galeri, info, dan tombol link/APK hanya bila datanya ada.
3. Pengunjung dapat mengirim satu komentar per karya, dan komentar muncul di publik hanya setelah di-approve admin.
4. Pengunjung dapat mengisi feedback pameran (rating, pilihan ganda, komentar) satu kali.
5. Pengunjung dapat mengganti bahasa UI antara Indonesia dan Inggris, dan pilihan tersimpan.
6. Tombol download APK mengarahkan ke GitHub Releases dan menampilkan checksum serta catatan peringatan.
7. Total kunjungan, unique visitor, dan view per karya tercatat sesuai aturan di bagian 5.6.
8. Admin dapat login, CRUD karya, moderasi komentar, mengatur buka/tutup feedback, dan melihat dashboard visitor.
9. Admin dapat mengekspor feedback, data visitor, dan data karya dalam format JSON.
10. Pengguna non-admin tidak dapat membaca atau menulis data di luar yang diizinkan (terbukti lewat pengujian rules).
11. Tidak ada secret di repo, dan semua item checklist keamanan terpenuhi.

## 12. Di Luar Cakupan (V1)

- Checkout atau pembayaran
- Login pengunjung
- Kategori, filter, dan pencarian karya
- Penghitungan jumlah download
- Terjemahan otomatis konten karya dan komentar
- Upload gambar langsung dari halaman admin
- Analitik lanjutan (lokasi, sumber traffic, perangkat)

## 13. Asumsi dan Pertanyaan Terbuka

| # | Item | Default di PRD |
| --- | --- | --- |
| 1 | Daftar pertanyaan pilihan ganda feedback pameran | Memakai draft di Lampiran A, bisa diganti |
| 2 | QR code per karya untuk pameran offline | Nice to have: admin bisa membuat atau mencetak QR yang mengarah ke `/#/karya/{id}` |
| 3 | Durasi pameran dan tanggal tutup feedback | Opsional lewat pengaturan, default tidak ada tanggal |
| 4 | Rekap rata-rata rating tampil ke publik | Tidak, hanya admin |
| 5 | Grafik kunjungan harian | Opsional di dashboard admin |
| 6 | Jumlah admin | Beberapa, dibuat manual di Console |
| 7 | Nama repo dan domain GitHub Pages | Belum ditentukan, perlu untuk pembatasan API key |

## Lampiran A: Draft Pertanyaan Feedback Pameran (bisa diubah)

1. Rating keseluruhan pameran (bintang 1-5).
2. Bagaimana kamu mengetahui pameran ini? (pilihan ganda: media sosial / teman / QR di lokasi / lainnya)
3. Bagian mana yang paling menarik? (pilihan ganda: tampilan karya / informasi karya / aplikasi yang bisa diunduh / kemudahan navigasi website)
4. Seberapa mudah website ini digunakan? (pilihan ganda: sangat mudah / mudah / cukup / sulit)
5. Saran atau komentar untuk pameran (teks bebas, opsional).
