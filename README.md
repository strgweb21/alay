# 📸 Album Koleksi

Web galeri foto & video untuk ngumpulin dan ngelola album. Upload foto ke ImgBB, embed video YouTube/Vimeo, tersusun rapi dengan berbagai mode tampilan.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)

---

## ✨ Fitur

- **Buat & Kelola Album** — Buat album, edit nama/deskripsi/kategori, hapus
- **Upload Foto ke ImgBB** — Gambar diupload ke ImgBB, URL original quality otomatis tersimpan
- **Embed Video** — Paste link YouTube/Vimeo, otomatis dikonversi ke embed
- **Drag & Drop Upload** — Drag file langsung ke area upload
- **3 Mode Tampilan** — Grid (2-6 kolom), Scroll Vertikal, Scroll Horizontal
- **Responsive** — Tampilan optimal di HP, tablet, dan desktop
- **Lightbox** — Klik foto/video untuk lihat fullscreen, navigasi keyboard (← → Esc)
- **Search & Filter** — Cari album berdasarkan judul, filter berdasarkan kategori
- **Animasi Halus** — Transisi dan hover effects pake Framer Motion

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Bahasa | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL (Supabase) / SQLite (lokal) via Prisma 6 |
| State | Zustand |
| Animasi | Framer Motion |
| Runtime | Bun / Node.js |
| Deploy | Vercel / Docker / VPS |

---

## 🚀 Deploy ke Vercel + Supabase (Paling Direkomendasi)

Ini cara paling gampang buat deploy. Gratis kedua-duanya.

### Step 1: Buat Project Supabase

1. Buka [https://supabase.com](https://supabase.com), sign up / login
2. Klik **"New Project"**
3. Isi:
   - **Name**: `album-koleksi` (bebas)
   - **Database Password**: **PENTING — simpan baik-baik**, nanti dipakai di connection string
   - **Region**: pilih yang paling deket (misalnya **Southeast Asia (Singapore)**)
4. Klik **"Create new project"**, tunggu sampai selesai (~2 menit)

### Step 2: Dapet Connection String

1. Di dashboard Supabase, buka menu **Settings** → **Database**
2. Scroll ke bagian **"Connection string"**
3. Pilih **"Transaction pooler"** (ini yang dipake di Vercel)
4. Copy connection string yang formatnya:
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
5. **Tambahin `?pgbouncer=true` di akhir** URL-nya, jadi:
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   > `?pgbouncer=true` wajib supaya Prisma kompatibel dengan Supabase connection pooler.

### Step 3: Push Schema ke Supabase

Di laptop kamu:

```bash
git clone https://github.com/strgweb21/alay.git
cd album-koleksi
bun install

# Pastikan schema yang aktif adalah PostgreSQL
bun run db:use:postgresql

# Set DATABASE_URL ke connection string Supabase (Transaction pooler + pgbouncer)
# Bisa lewat .env atau langsung:
export DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Generate Prisma client + buat tabel di Supabase
bun run db:generate
bun run db:push
```

Kalau berhasil, kamu bakal lihat:
```
🚀 Your database is now in sync with your Prisma schema.
```

> **Verifikasi**: Buka Supabase dashboard → **Table Editor**, kamu bakal lihat tabel `Album`, `Photo`, dan `Video`.

### Step 4: Push ke GitHub

```bash
git add .
git commit -m "ready for vercel + supabase deploy"
git push origin main
```

### Step 5: Deploy ke Vercel

1. Buka [https://vercel.com](https://vercel.com), sign up / login pake GitHub
2. Klik **"Add New"** → **"Project"**
3. Pilih repo `album-koleksi` kamu, klik **Import**
4. Di halaman **Configure Project**:
   - **Framework Preset**: Next.js (otomatis terdeteksi)
   - **Build Command**: `npm run build` (biarkan default)
5. Klik **"Environment Variables"**, tambah:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` |
   | `IMGBB_API_KEY` | *(opsional, bisa diisi lewat web)* |

6. Klik **"Deploy"**

Tunggu ~1-2 menit. Selesai! 🎉

### Step 6: (Opsional) Custom Domain

1. Di Vercel dashboard project, buka **Settings** → **Domains**
2. Tambah domain kamu
3. Update DNS records sesuai instruksi Vercel
4. SSL otomatis

---

## 💻 Tes di Laptop (Lokal)

Kamu punya 2 opsi: pake SQLite (gak perlu internet) atau pake Supabase langsung.

### Opsi A: SQLite (Offline, Tanpa Supabase)

```bash
git clone https://github.com/USERNAME/album-koleksi.git
cd album-koleksi
bun install

# Switch schema ke SQLite
cp prisma/schema.sqlite.prisma prisma/schema.prisma

# Setup .env
cp .env.example .env
# Edit .env, uncomment baris DATABASE_URL SQLite:
# DATABASE_URL="file:./db/custom.db"

# Buat database
bun run db:push

# Jalankan
bun run dev
```

Buka **http://localhost:3000**

> ⚠️ Catatan: Kalau mau ganti ke Supabase nanti, jalankan `bun run db:use:postgresql` lalu update DATABASE_URL di .env.

### Opsi B: Supabase (Data Online)

Sama seperti Step 1-3 di atas, tapi setelah `db:push` langsung jalankan `bun run dev`.

```bash
cp .env.example .env
# Edit .env, isi DATABASE_URL dengan connection string Supabase

bun run db:generate
bun run db:push
bun run dev
```

---

## 📦 Build Production (VPS / Docker)

```bash
# Pastikan schema PostgreSQL aktif
bun run db:use:postgresql

# Build
bun run build

# Jalankan
bun run start
```

---

## 🐳 Docker (VPS)

```bash
git clone https://github.com/USERNAME/album-koleksi.git
cd album-koleksi
docker compose up -d
```

Update kode:

```bash
git pull
docker compose up -d --build
```

### VPS Manual (Tanpa Docker)

```bash
git clone https://github.com/USERNAME/album-koleksi.git
cd album-koleksi
bun install
cp .env.example .env
# Edit .env, isi DATABASE_URL Supabase
bun run db:generate
bun run db:push
bun run build

# Jalankan dengan PM2
npm install -g pm2
pm2 start "bun run start" --name album-koleksi
pm2 save
pm2 startup
```

Reverse proxy Nginx:

```nginx
server {
    listen 80;
    server_name domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
```

SSL gratis pake Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain.com
```

---

## 🔑 Environment Variables

| Variable | Wajib? | Default | Keterangan |
|----------|--------|---------|------------|
| `DATABASE_URL` | Ya | - | Connection string database (SQLite atau Supabase PostgreSQL) |
| `IMGBB_API_KEY` | Tidak* | - | API key ImgBB untuk upload otomatis |

> \*Kalau nggak di-set di env, bisa diisi manual lewat form upload di web. API key disimpan di browser (localStorage).

### Contoh DATABASE_URL

```
# SQLite (lokal)
DATABASE_URL="file:./db/custom.db"

# Supabase (Vercel/Production)
DATABASE_URL="postgresql://postgres.abc123:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## 🌐 Cara Dapet ImgBB API Key

1. Buka [https://api.imgbb.com/](https://api.imgbb.com/)
2. Sign up (gratis)
3. Setelah login, API key langsung muncul di dashboard
4. Copy API key, paste di:
   - File `.env` → `IMGBB_API_KEY=your_key_here`
   - **Atau** isi langsung di form upload di web

---

## 📁 Struktur Folder

```
album-koleksi/
├── prisma/
│   ├── schema.prisma              # Schema aktif (default: PostgreSQL)
│   ├── schema.postgresql.prisma   # Schema untuk Supabase/PostgreSQL
│   └── schema.sqlite.prisma       # Schema untuk SQLite (lokal)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Halaman utama (semua UI di sini)
│   │   ├── layout.tsx             # Root layout
│   │   ├── globals.css            # Tailwind CSS + theme variables
│   │   └── api/
│   │       ├── albums/
│   │       │   ├── route.ts              # GET (list) & POST (create) album
│   │       │   └── [id]/
│   │       │       ├── route.ts          # PUT (update) & DELETE album
│   │       │       ├── photos/
│   │       │       │   ├── route.ts      # GET foto dalam album
│   │       │       │   └── imgbb/route.ts # POST upload ke ImgBB
│   │       │       └── videos/
│   │       │           ├── route.ts      # GET & POST video
│   │       │           └── [id]/route.ts  # DELETE video
│   │       └── categories/
│   │           └── route.ts              # GET kategori unik
│   ├── components/ui/              # shadcn/ui components
│   └── lib/
│       ├── db.ts                   # Prisma client (singleton)
│       ├── store.ts                # Zustand store
│       └── utils.ts                # Utility functions
├── .env.example                   # Template environment variables
├── Dockerfile                     # Docker multi-stage build
├── docker-compose.yml             # Docker Compose config
├── next.config.ts
└── package.json
```

---

## 📝 API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/albums` | List semua album + jumlah item (support `?search=` & `?category=`) |
| `POST` | `/api/albums` | Buat album baru |
| `PUT` | `/api/albums/:id` | Edit album |
| `DELETE` | `/api/albums/:id` | Hapus album + semua foto & video |
| `GET` | `/api/albums/:id/photos` | List foto dalam album |
| `POST` | `/api/albums/:id/photos/imgbb` | Upload foto ke ImgBB |
| `GET` | `/api/albums/:id/videos` | List video dalam album |
| `POST` | `/api/albums/:id/videos` | Tambah video (YouTube/Vimeo embed) |
| `DELETE` | `/api/videos/:id` | Hapus video |
| `GET` | `/api/categories` | List kategori unik |

---

## 🔀 Ganti Database (SQLite ↔ PostgreSQL)

```bash
# Pindah ke SQLite
bun run db:use:sqlite
# Edit .env: DATABASE_URL="file:./db/custom.db"
bun run db:generate && bun run db:push

# Pindah ke PostgreSQL (Supabase)
bun run db:use:postgresql
# Edit .env: DATABASE_URL="postgresql://...?pgbouncer=true"
bun run db:generate && bun run db:push
```

---

## 📄 Lisensi

MIT — bebas dipake buat apa aja.
