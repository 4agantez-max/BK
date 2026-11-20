# Style Guide: Underwater Room

Panduan desain website pameran karya, diturunkan dari poster promosi "Underwater Room XI TMB?". Dokumen ini pelengkap PRD dan dipakai sebagai acuan saat membangun UI (React + Vite + Tailwind).

> Nilai hex di bawah adalah **perkiraan dari gambar poster**. Cocokkan dengan color picker pada file desain asli sebelum dikunci.

---

## 1. Pemahaman Tema

**Judul:** Underwater Room (ditulis dengan tanda tanya, "XI TMB" kemungkinan identitas kelas penyelenggara).
**Tagline:** "Menyelam kedalam, menemukan ketenangan".
**Status di poster:** Coming soon.

**Konsep inti:** pameran dibayangkan sebagai sebuah ruangan di bawah laut. Pengunjung diajak menyelam, meninggalkan keriuhan di permukaan, lalu menemukan ketenangan lewat karya. Tanda tanya di judul memberi nuansa misteri dan rasa penasaran: ruangan apa yang ada di bawah sana?

**Cerita visual di poster (dari atas ke bawah):**

1. Permukaan air dengan pantulan cahaya (caustic) di atas. Ini adalah "sebelum menyelam".
2. Tulisan tangan "Coming Soon !!!" yang ringan, seperti coretan di atas air.
3. Sobekan kertas/kain biru yang membuka sebuah "jendela" terang berisi judul. Ini momen "masuk ke ruangan".
4. Ombak yang dilukis dengan busa putih di pojok kiri bawah. Ini sentuhan tangan (handmade), bukan ilustrasi digital yang mulus.
5. Tagline putih di bagian paling bawah sebagai penutup.

**Kata kunci rasa:** tenang, dalam, misterius, handmade, bertekstur, segar.

**Satu hal yang paling diingat (spend boldness in one place):** efek **sobekan kertas yang membuka judul**. Ini dijadikan elemen khas website. Elemen lain dibuat tenang dan disiplin supaya karya tetap jadi pusat perhatian.

---

## 2. Prinsip Desain

1. **Karya adalah bintang.** Dekorasi laut menjadi bingkai, bukan pesaing. Area gambar karya selalu bersih.
2. **Dari permukaan ke dasar.** Warna bergerak dari cyan terang di atas ke biru dalam di bawah halaman. Semakin ke bawah scroll, semakin "dalam".
3. **Handmade, bukan glossy.** Tekstur kertas, tepi sobek, dan ombak lukisan. Hindari gradient plastik, glow neon, dan bayangan generik.
4. **Tenang dalam interaksi.** Gerak lambat dan lembut. Tidak ada animasi berisik.
5. **Terbaca dulu, indah kemudian.** Kontras teks wajib terpenuhi, terutama di atas latar teal dan biru.
6. **Satu momen besar.** Efek sobekan dipakai di hero dan sebagai pembuka karya. Sisanya polos.

---

## 3. Warna

### Palet inti

| Token | Hex (perkiraan) | Peran |
|---|---|---|
| `surface` | `#7FD6E3` | Cahaya permukaan air, aksen terang, dekorasi |
| `lagoon` | `#1F9BB8` | Teal tengah, gelombang, latar section atas |
| `denim` | `#3F62A0` | Biru kain/kertas sobek, warna judul "UNDERWATER" |
| `deep` | `#123F66` | Biru dalam, latar section bawah, footer |
| `paper` | `#E9EDF0` | Kertas terang di balik sobekan, permukaan form dan kartu |
| `foam` | `#FFFFFF` | Busa ombak, teks di atas latar gelap |
| `ink` | `#0A0A0A` | Teks "ROOM", tanda tanya, teks utama di atas kertas |

### Gradient latar halaman (atas ke bawah)

`surface` → `lagoon` → `denim` → `deep`. Dipakai untuk latar beranda saja, dibuat lembut dan dipotong oleh section kertas supaya terasa seperti lapisan, bukan wash dekoratif.

### Aturan kontras (hasil hitung kasar, cek ulang dengan tool kontras)

| Kombinasi | Rasio kira-kira | Boleh dipakai untuk |
|---|---|---|
| `foam` di atas `deep` | sekitar 10:1 | Semua teks |
| `foam` di atas `denim` | sekitar 6:1 | Semua teks |
| `denim` di atas `paper` | sekitar 5:1 | Judul besar dan teks biasa |
| `ink` di atas `paper` | lebih dari 15:1 | Semua teks |
| `foam` di atas `lagoon` | sekitar 3,2:1 | **Hanya teks besar (24 px ke atas)** atau tebal besar |
| `foam` di atas `surface` | rendah | **Jangan** untuk teks. Hanya dekorasi |

Aturan praktis: teks kecil dan paragraf hanya di atas `paper`, `deep`, atau `denim`. Di atas `lagoon` dan `surface` hanya judul besar atau dekorasi.

---

## 4. Tipografi

Poster memadukan tiga karakter huruf. Font di bawah adalah **pengganti yang mirip dan gratis** (Google Fonts). Ganti jika font asli poster diketahui.

| Peran | Karakter di poster | Font usulan | Dipakai untuk |
|---|---|---|---|
| Display | Sans condensed sangat tebal, huruf besar | **Anton** | Judul hero, judul karya di kartu |
| Display kedua | Sans condensed lebih ringan | **Oswald** (400-500) | Sub-judul, nama kreator |
| Script | Tulisan tangan tipis, miring, berlekuk | **Sacramento** atau script tipis sejenis | "Coming soon", sapaan, aksen pendek saja |
| Body | Sans lebar, tebal, putih (tagline) | **Plus Jakarta Sans** (400, 600, 700) | Paragraf, form, tombol, UI admin |

### Skala tipe (mobile-first, `rem`)

| Level | Mobile | Desktop | Font |
|---|---|---|---|
| Hero | 3.5 | 7 | Anton, line-height 0.95 |
| H1 | 2.5 | 4 | Anton |
| H2 | 1.75 | 2.5 | Oswald 500 |
| H3 | 1.25 | 1.5 | Oswald 500 |
| Body | 1 | 1.0625 | Plus Jakarta Sans 400, line-height 1.6 |
| Kecil | 0.875 | 0.875 | Plus Jakarta Sans 500 |

### Aturan

- Panjang baris paragraf maksimal sekitar 65-70 karakter (`max-w-prose`).
- Huruf kapital hanya untuk **judul hero dan judul karya**, mengikuti poster. Label kecil, tombol, dan UI memakai sentence case.
- Script dipakai **sangat jarang** (satu per halaman), karena sulit dibaca. Jangan untuk teks fungsional atau di bawah 28 px.
- Judul hero dua baris: baris pertama `denim`, baris kedua `ink` dengan bobot lebih ringan, meniru kontras "UNDERWATER" dan "ROOM".
- Muat font lewat paket `@fontsource` (self-host) agar tidak ada request ke pihak ketiga. Ini sejalan dengan prinsip privasi dan keamanan di PRD.

---

## 5. Bahasa Visual dan Tekstur

| Elemen | Deskripsi | Cara implementasi |
|---|---|---|
| Sobekan kertas | Tepi tidak rata, memperlihatkan kertas terang di baliknya | SVG `clip-path` atau CSS `mask-image` dengan path bergerigi. Simpan sebagai aset SVG kecil |
| Tekstur kain/kertas biru | Berbutir halus pada `denim` | Noise SVG (`feTurbulence`) tipis dengan opacity 6-10 persen, bukan file gambar besar |
| Cahaya permukaan (caustic) | Pantulan cahaya bergelombang di atas | Gambar tunggal WebP ringan untuk hero, atau pola SVG. Opsional gerak sangat pelan |
| Ombak lukisan | Cat air/akrilik dengan busa putih | Satu ilustrasi dari poster (diekspor WebP/SVG) di pojok bawah hero dan footer |
| Busa | Putih, bertekstur | Bagian dari ilustrasi ombak, tidak dibuat ulang lewat CSS |

Catatan: ilustrasi ombak dan foto air sebaiknya diambil dari **file sumber poster** (bukan hasil screenshot) supaya tajam. Kompres ke WebP, lebar maksimal sekitar 1600 px, di bawah 200 KB per aset.

### Bentuk dan sudut

- Sudut kartu dan tombol: sedikit membulat (`rounded-lg`), konsisten.
- Tepi atas section dan kartu karya boleh bergerigi (sobekan). Elemen form dan admin memakai tepi lurus agar bersih.
- Bayangan: satu gaya saja, lembut, bernuansa biru (misalnya `shadow-[0_8px_24px_rgba(18,63,102,0.25)]`), bukan abu-abu generik.

---

## 6. Layout dan Komponen

### 6.1 Prinsip layout

- Mobile-first, dirancang dari lebar 360 px.
- Konten rata kiri, kecuali hero yang boleh rata tengah.
- Section berganti "kedalaman": hero (`surface`-`lagoon`), galeri di atas kertas, feedback di `denim`, footer `deep`. Pergantian ditandai tepi sobekan atau ombak, bukan garis pemisah.
- Breakpoint Tailwind default (`sm 640`, `md 768`, `lg 1024`). Kontainer maksimal `max-w-6xl`.

### 6.2 Hero

```
┌────────────────────────────┐
│ ~~~ caustic permukaan ~~~  │
│                            │
│   Coming soon !!!  (script)│
│ ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲ │  <- tepi sobekan denim
│   UNDERWATER   (denim)     │
│   ROOM  XI TMB  ?  (ink)   │
│ ╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱ │
│  Menyelam ke dalam,        │
│  menemukan ketenangan      │
│  [ Lihat karya ]           │
│ 🌊 ombak lukisan (kiri)    │
└────────────────────────────┘
```

- Setelah pameran dibuka, "Coming soon !!!" diganti tanggal atau sapaan pendek.
- Satu tombol utama saja: "Lihat karya".

### 6.3 Kartu karya (galeri)

```
┌──────────────────┐
│ ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲ │  <- tepi atas sobek, warna denim
│   [ gambar ]     │
│                  │
│ JUDUL KARYA      │  <- Anton
│ Nama kreator     │  <- Oswald, denim
└──────────────────┘
```

- Mobile 1 kolom, `md` 2 kolom, `lg` 3 kolom.
- Gambar tampil apa adanya (rasio dipertahankan, `object-cover` dengan rasio tetap 4:3). Tidak ada overlay warna yang mengubah tampilan karya.
- Kartu tanpa hover berlebihan. Cukup perubahan bayangan atau naik 2 px, dan fokus keyboard yang jelas.

### 6.4 Detail karya

- Galeri gambar di atas, bisa digeser (swipe) di HP.
- Judul (Anton) dan kreator, lalu deskripsi di kolom `max-w-prose`.
- Field tambahan (tahun, tools, dll) sebagai daftar label dan nilai, hanya yang terisi.
- Tombol **Buka Link**: outline `denim`. Tombol **Download APK**: solid `ink` dengan teks `foam`, ikon unduh, ukuran file di sampingnya.
- Kotak kecil di bawah tombol APK: versi, ukuran, SHA-256 (font mono kecil dan bisa disalin), plus catatan aplikasi belum ditandatangani. Latar `paper`.
- Komentar: kartu `paper`, nama "Anonim" jika kosong, tanpa avatar.

### 6.5 Form feedback

- Latar section `denim`, kartu form `paper` dengan sudut tegas.
- Rating bintang: bintang berukuran minimal 44 px, warna isi `denim`, kosong berupa outline.
- Pilihan ganda: opsi sebagai radio besar yang bisa ditekan seluruh barisnya.
- Pesan setelah kirim: "Terima kasih. Komentar kamu menunggu persetujuan admin."
- Error spesifik dan jelas, tanpa permintaan maaf berlebihan.

### 6.6 Footer

- Latar `deep`, tepi atas berupa ombak (SVG), teks `foam`.
- Isi: tagline, pemilih bahasa, catatan privasi singkat.

### 6.7 Halaman admin

Lebih tenang dan fungsional, bukan panggung dekorasi:

- Latar `paper`, tanpa sobekan dan tekstur. Warna `denim` untuk aksi utama, `deep` untuk header.
- Tabel dan form padat dan mudah dipindai, status moderasi memakai badge berwarna (menunggu = kuning, disetujui = hijau, disembunyikan = abu), selalu disertai teks, tidak hanya warna.
- Mobile tetap bisa dipakai, tabel boleh scroll horizontal di dalam wadahnya.

---

## 7. Gerak (Motion)

- **Satu momen orkestrasi:** saat beranda pertama dibuka, sobekan kertas "terbuka" (clip-path bergeser) dan memperlihatkan judul. Sekitar 800-1000 ms, sekali saja.
- Cahaya permukaan boleh bergerak sangat pelan (loop panjang, perubahan kecil). Boleh dimatikan.
- Interaksi (buka galeri, tombol ditekan, kirim form) memakai transisi singkat 150-250 ms yang menunjukkan perubahan.
- Tidak ada animasi masuk di setiap section dan tidak ada parallax berat.
- Hormati `prefers-reduced-motion`: semua gerak non-interaktif dimatikan, judul langsung tampil.

---

## 8. Salinan Teks (Copy)

**Nada:** tenang, mengajak, singkat. Kalimat aktif, bahasa sehari-hari, tidak berlebihan.

| Konteks | Indonesia | Inggris |
|---|---|---|
| Tagline | Menyelam ke dalam, menemukan ketenangan | Dive in, find your calm |
| Tombol utama | Lihat karya | View works |
| Tombol komentar | Kirim komentar | Send comment |
| Tombol APK | Unduh aplikasi | Download app |
| Setelah kirim | Terima kasih. Komentar kamu menunggu persetujuan admin | Thank you. Your comment is waiting for admin approval |
| Feedback ditutup | Feedback sudah ditutup | Feedback is now closed |
| Belum ada komentar | Belum ada komentar. Jadi yang pertama | No comments yet. Be the first |

Catatan: tagline di poster tertulis "kedalam". Menurut ejaan baku, kata depan ditulis terpisah ("ke dalam"). Untuk website, gunakan "ke dalam" kecuali ingin persis seperti poster.

---

## 9. Tailwind (Tailwind v3)

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#7FD6E3",
        lagoon: "#1F9BB8",
        denim: "#3F62A0",
        deep: "#123F66",
        paper: "#E9EDF0",
        foam: "#FFFFFF",
        ink: "#0A0A0A",
      },
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        heading: ["Oswald", "Arial Narrow", "sans-serif"],
        script: ["Sacramento", "cursive"],
        body: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px rgba(18, 63, 102, 0.25)",
      },
    },
  },
};
```

Contoh penggunaan:

```jsx
<h1 className="font-display text-6xl leading-[0.95] text-denim md:text-8xl">
  UNDERWATER
</h1>
<p className="font-body text-base text-ink max-w-prose">...</p>
```

---

## 10. Aksesibilitas dan Performa

- Kontras mengikuti tabel di bagian 3. Teks di atas `lagoon` dan `surface` dibatasi.
- Fokus keyboard terlihat jelas: ring 2-3 px warna `foam` di latar gelap atau `deep` di latar terang.
- Semua gambar karya punya `alt` (judul dan kreator minimal). Ilustrasi dekoratif (ombak, caustic) memakai `alt=""` atau `aria-hidden`.
- Area tap minimal 44 px.
- Tekstur dibuat dengan SVG atau CSS ringan. Hindari background gambar penuh yang besar.
- Gambar WebP, `loading="lazy"` kecuali gambar di layar pertama. Target Lighthouse mobile 85 ke atas.
- Jangan sampai warna menjadi satu-satunya penanda (rating, status, error).

---

## 11. Do dan Don't

**Do**

- Pakai sobekan kertas sebagai penanda masuk ke konten.
- Biarkan gambar karya tampil bersih dan apa adanya.
- Jaga warna tetap di keluarga biru-teal, dengan `ink` dan `paper` sebagai penyeimbang.
- Pakai script tipis sebagai aksen langka.

**Don't**

- Menambah warna baru di luar palet (oranye, ungu, pink) tanpa alasan.
- Memberi efek glow, gradient plastik, atau glassmorphism.
- Menjejalkan ikon ikan, gelembung, dan karang di setiap section.
- Memakai huruf kapital untuk semua label dan tombol.
- Menaruh paragraf di atas latar `lagoon` atau `surface`.
- Membuat semua elemen bergerak. Satu momen sudah cukup.

---

## 12. Hal yang Perlu Dikonfirmasi

1. Arti "XI TMB" (nama kelas?) dan apakah perlu tampil di website.
2. Font asli poster, dan apakah file sumber (ilustrasi ombak, foto air) tersedia dalam resolusi tinggi.
3. Apakah ada logo sekolah atau kelas yang harus dipasang.
4. Apakah halaman "Coming soon" dibutuhkan sebelum pameran dibuka.
5. Nilai hex final setelah dicek dengan color picker pada file sumber.
