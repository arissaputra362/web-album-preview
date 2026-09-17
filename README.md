# DriveAlbum 📸

**DriveAlbum** adalah aplikasi galeri foto & video web bergaya *editorial gallery* (terinspirasi dari *Ada design language*) dengan arsitektur **zero-duplicate storage** yang memanfaatkan Google Drive secara langsung sebagai penyedia media.

Semua file foto dan video keluarga Anda tetap tersimpan aman di Google Drive tanpa perlu menduplikasi media ke hosting web atau database pihak ketiga.

---

## ✨ Fitur Utama

- **Zero-Duplicate Storage**: Menyimpan dan mengambil media secara langsung dari folder Google Drive via Google Drive API v3 (Service Account).
- **Subfolder Explorer & Breadcrumb**: Mendeteksi subfolder di Google Drive dan menyediakan navigasi bertingkat (*Root > Subfolder A > Subfolder B*) yang mulus.
- **Pemutar Video & HTTP Range Streaming**: Mendukung pemutaran video HTML5 native dengan *HTTP Range Requests (Status 206 Partial Content)* untuk scrubbing instan tanpa membebani memori server.
- **Proteksi PIN untuk Album Privat**: Mengunci album keluarga sensitif di balik layar *PIN Gate* bergaya editorial dengan keypad numerik. Foto tidak dimuat di server sebelum PIN yang valid dimasukkan.
- **Optimasi Kuota Google Drive API**:
  - *In-Memory File Metadata Cache*: Mengeliminasi panggilan berulang ke `drive.files.get`.
  - *Single-Flight Coalescing*: Menyatukan request paralel yang bersamaan menjadi satu query API.
  - *HTTP Conditional Caching*: Dukungan `ETag` dan respons instan `304 Not Modified`.
  - *Google UserContent CDN Offloading*: Mengalirkan gambar dengan skala resolusi tinggi (`=s1600`) tanpa menyedot kuota Google Drive v3 API.
  - *In-Memory Rate Limiter*: Melindungi server dari *request bombing* dan *scraping* (max 150 req/menit per IP).
- **Admin CMS Dashboard (`/admin/dashboard`)**:
  - Tambah dan edit album (ubah judul, deskripsi, Google Drive Folder ID, cover, visibilitas publik/privat, dan setel PIN).
  - Cek sinkronisasi live dengan Google Drive.
  - Tombol Logout dengan verifikasi session cookie server-side.
- **Sistem Autentikasi & Database Seeder Mandiri**:
  - Password di-hash menggunakan salt acak + algoritma kriptografi *scrypt* (Node.js native).
  - Dedicated `UserSeeder` dan `AlbumSeeder` untuk inisialisasi data akun dan demo album.
- **Desain Editorial Ada**: Warm Canvas (`#F9F9F9`), Deep Charcoal (`#0A0B0C`), Forest Green CTA (`#00543D`), Hairline Borders, dan Skeleton Shimmer Loading untuk mencegah tampilan halaman kosong saat pertama dibuka.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Media Provider**: [Google Drive API v3](https://developers.google.com/drive/api) via `googleapis` (Service Account JWT)
- **Database / ORM**: [Drizzle ORM](https://orm.drizzle.team/) (Dual-mode: Neon Serverless PostgreSQL + JSON File Local Fallback)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Memulai Proyek (Local Development)

### 1. Prasyarat
- **Node.js**: Versi 20.x atau lebih baru
- **npm** atau **pnpm**

### 2. Instalasi Dependensi
```bash
git clone <url-repository-anda>
cd family_album
npm install
```

### 3. Konfigurasi Environment (`.env.local`)
Buat file `.env.local` di root folder proyek:

```env
# Optional: Neon / PostgreSQL Connection String (Biarkan kosong jika ingin memakai local JSON store)
DATABASE_URL=""

# NextAuth & Admin Session Secret
NEXTAUTH_SECRET="buat_string_acak_keamanan_anda_di_sini"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Override kredensial admin (default dari UserSeeder)
ADMIN_EMAIL="admin@drivealbum.local"
ADMIN_PASSWORD="admin123"

# Google Service Account (Pilih salah satu cara)
# Cara 1: Letakkan file `service-account.json` di root folder proyek, ATAU
# Cara 2: Salin seluruh teks JSON service account ke variabel di bawah:
# GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account", ...}'
```

### 4. Menjalankan Database Seeder
Inisialisasi akun admin dan album demo awal dengan seeder:

```bash
# Menjalankan seluruh seeder (User Admin + Demo Album)
npm run db:seed

# ATAU hanya men-seed user admin:
npm run db:seed:users
```

**Kredensial Default:**
- **Email**: `admin@drivealbum.local`
- **Password**: `admin123`

> Untuk menambah atau mengubah user admin permanen, Anda bisa langsung mengedit array `INITIAL_USERS` pada file [`src/db/seeders/UserSeeder.ts`](src/db/seeders/UserSeeder.ts).

### 5. Menjalankan Server Lokal
```bash
npm run dev
```

Buka di browser:
- **Galeri Beranda**: `http://localhost:3000` (atau port yang tertera di terminal)
- **Portal Login Admin**: `http://localhost:3000/admin/login`
- **Dashboard Admin**: `http://localhost:3000/admin/dashboard`

---

## 📁 Menghubungkan Google Drive Folder Anda

1. Dapatkan email **Google Service Account** Anda dari file `service-account.json` (misal: `drivealbum-bot@...iam.gserviceaccount.com`).
2. Buka folder foto Anda di [Google Drive](https://drive.google.com/).
3. Klik kanan folder $\to$ pilih **Bagikan (Share)** $\to$ tempelkan email Service Account di atas $\to$ jadikan **Viewer** $\to$ simpan.
4. Salin **Folder ID** dari address bar browser Anda:
   - Contoh URL: `https://drive.google.com/drive/folders/1AeCagEZ3b5ku4WiiebyqAgFkDvZ26zfe`
   - Folder ID-nya adalah: `1AeCagEZ3b5ku4WiiebyqAgFkDvZ26zfe`
5. Buka dashboard admin di web, klik **Tambah Album Baru**, lalu masukkan Folder ID tersebut.
6. Klik ikon refresh (**Cek Sinkronisasi**) untuk memastikan foto dan video langsung terbaca.

---

## ☁️ Panduan Deployment 100% Free (Vercel + Neon.tech)

Proyek ini dirancang agar dapat di-host secara gratis selamanya menggunakan kombinasi **Vercel Hobby** dan **Neon Serverless Postgres**:

### A. Setup Database Gratis di Neon.tech
1. Buat akun gratis di [Neon.tech](https://neon.tech/).
2. Buat database baru (misal: `drivealbum`).
3. Salin connection string `DATABASE_URL` (format: `postgresql://user:password@ep-...neon.tech/neondb?sslmode=require`).

### B. Deploy ke Vercel
1. Import repository GitHub Anda ke [Vercel](https://vercel.com/).
2. Di menu **Environment Variables**, tambahkan:
   - `DATABASE_URL` : (Connection string dari Neon)
   - `NEXTAUTH_SECRET` : (String acak rahasia)
   - `NEXTAUTH_URL` : (URL Vercel Anda, misal `https://drivealbum.vercel.app`)
   - `GOOGLE_SERVICE_ACCOUNT_KEY` : (Buka file `service-account.json`, copy seluruh teks JSON-nya lalu paste di sini)
3. Jalankan **Deploy**! Website galeri Anda akan langsung online dengan HTTPS gratis.

---

## 📂 Struktur Direktori Proyek

```text
family_album/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/page.tsx   # Admin CMS Dashboard
│   │   │   └── login/page.tsx       # Halaman Login Admin
│   │   ├── album/[slug]/
│   │   │   ├── page.tsx             # Detail Album & Explorer
│   │   │   └── loading.tsx          # Skeleton Shimmer Loader
│   │   ├── api/
│   │   │   ├── albums/              # CRUD Album API
│   │   │   ├── auth/                # Login, Logout, Me API
│   │   │   └── drive/               # Streaming Media, Image & Sync API
│   │   ├── layout.tsx               # Root Layout & Ada Navbar
│   │   └── page.tsx                 # Beranda Editorial Gallery
│   ├── components/
│   │   ├── gallery/                 # MasonryGallery, Lightbox, PinGate, AlbumExplorer
│   │   └── layout/                  # Navbar, Footer
│   ├── db/
│   │   ├── schema.ts                # Drizzle schema (albums, users)
│   │   ├── index.ts                 # Database client & local JSON fallback
│   │   ├── seed.ts                  # Master CLI Seeder
│   │   └── seeders/
│   │       ├── UserSeeder.ts        # Seeder User Admin & Hashing
│   │       └── AlbumSeeder.ts       # Seeder Demo Album
│   └── lib/
│       ├── crypto.ts                # scrypt hashing & timingSafeEqual
│       ├── drive.ts                 # Google Drive v3 client & metadata cache
│       ├── rate-limiter.ts          # In-memory sliding window rate limiter
│       └── auth.ts                  # NextAuth options
├── .local-db.json                   # Local development fallback database
├── package.json
└── README.md
```

---

## 📜 Lisensi

Proyek ini dibuat untuk keperluan pribadi dan keluarga. Anda bebas memodifikasi dan mengembangkan lebih lanjut sesuai kebutuhan Anda.
