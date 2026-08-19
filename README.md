# 📸 Album Koleksi

Web galeri foto untuk ngumpulin dan ngelola album. Upload foto langsung ke server atau ke ImgBB, tersusun rapi dalam grid yang responsif.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)

---

## ✨ Fitur

- **Buat & Kelola Album** — Buat album, edit nama/deskripsi, hapus
- **Upload Foto Lokal** — Simpan file gambar langsung di server
- **Upload ke ImgBB** — Upload gambar ke ImgBB, URL otomatis tersimpan
- **Drag & Drop** — Drag file langsung ke area upload
- **Preview Thumbnail** — Lihat preview sebelum upload
- **Lightbox** — Klik foto untuk lihat fullscreen, navigasi pake keyboard (← → Esc)
- **Responsif** — Tampilan optimal di HP, tablet, dan desktop
- **Animasi Halus** — Transisi dan hover effects pake Framer Motion

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Bahasa | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite via Prisma ORM |
| State | Zustand |
| Animasi | Framer Motion |
| Runtime | Bun (bisa pake Node.js juga) |

---

## 💻 Tes di Laptop

### Prasyarat

Pastikan laptop lu udah punya salah satu runtime ini:

- **Bun** (direkomendasi, lebih cepat):
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- **Node.js** 18+ (kalau nggak punya Bun):
  ```bash
  # pake nvm
  nvm install 20
  ```

### Langkah-langkah

```bash
git clone https://github.com/USERNAME/album-koleksi.git
cd album-koleksi

# 2. Install dependencies
bun install
# atau kalau pake npm: npm install

# 3. Setup environment
cp .env.example .env

# 4. Setup database
bun run db:push

# 5. Jalankan dev server
bun run dev
```

Buka **http://localhost:3000** di browser.

Berhasil kalau lu lihat halaman kosong dengan tombol **"Buat Album Baru"**.

---

## 📦 Build Production

```bash
# Build
bun run build

# Jalankan production server
bun run start
```

Server production jalan di port 3000.

---

## 🚀 Deploy

### Opsi 1: Vercel (Paling Gampang)

> ⚠️ **Penting:** Vercel punya filesystem read-only, jadi **upload lokal nggak bakal bertahan** setelah redeploy. Pakai **ImgBB** sebagai metode upload utama kalau deploy di Vercel.

1. Push kode ke GitHub
2. Buka [vercel.com](https://vercel.com), import repo
3. Di **Environment Variables**, tambah:
   - `DATABASE_URL` → kalau pakai Vercel Postgres / Turso / PlanetScale (SQLite nggak support di Vercel)
   - `IMGBB_API_KEY` → API key ImgBB kamu
4. Klik **Deploy**

> **Rekomendasi:** Kalau mau pake SQLite, deploy ke VPS atau Docker (opsi 2/3).


### Opsi 2: Docker (VPS / Server Sendiri)

```bash
git clone https://github.com/USERNAME/album-koleksi.git
cd album-koleksi

# Build & jalankan dengan Docker Compose
docker compose up -d
```

Sekarang web jalan di **http://IP_SERVER:3000**

**Update kode:**

```bash
git pull
docker compose up -d --build
```


**Data aman** karena pake Docker volumes (upload + database nggak hilang pas rebuild).


### Opsi 3: VPS Manual (Tanpa Docker)

```bash
git clone https://github.com/USERNAME/album-koleksi.git
cd album-koleksi

# Install deps
bun install

# Setup env
cp .env.example .env

# Setup database
bun run db:push

# Build
bun run build

# Jalankan dengan PM2
npm install -g pm2
pm2 start "bun run start" --name album-koleksi
pm2 save
pm2 startup
```


**Reverse proxy pake Nginx:**

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

        # Biar upload file besar nggak timeout
        client_max_body_size 50M;
    }
}
```


Tambah SSL pake Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain.com
```


---

## 🔑 Environment Variables

| Variable | Wajib? | Default | Keterangan |
|----------|--------|---------|------------|
| `DATABASE_URL` | Ya | `file:./db/custom.db` | Koneksi database SQLite |
| `IMGBB_API_KEY` | Tidak* | - | API key ImgBB untuk upload otomatis |

> \*Kalau nggak di-set di env, bisa diisi manual lewat form upload di web. API key bakal disimpan di browser (localStorage).

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
│   └── schema.prisma      # Database schema (Album & Photo)
├── public/
│   └── uploads/           # Foto yang diupload lokal
├── src/
│   ├── app/
│   │   ├── page.tsx       # Halaman utama (semua UI di sini)
│   │   ├── layout.tsx     # Root layout
│   │   ├── globals.css    # Tailwind CSS + theme variables
│   │   └── api/
│   │       ├── albums/
│   │       │   ├── route.ts          # GET (list) & POST (create) album
│   │       │   └── [id]/
│   │       │       ├── route.ts      # PUT (update) & DELETE album
│   │       │       └── photos/
│   │       │           ├── route.ts          # GET & POST foto (lokal)
│   │       │           └── imgbb/route.ts    # POST foto ke ImgBB
│   │       └── photos/
│   │           └── [id]/route.ts  # DELETE foto
│   ├── components/ui/       # shadcn/ui components
│   ├── hooks/               # Custom hooks (toast)
│   └── lib/
│       ├── db.ts            # Prisma client
│       ├── store.ts         # Zustand store
│       └── utils.ts         # Utility functions
├── db/
│   └── custom.db           # SQLite database file (auto-generated)
├── .env.example            # Template environment variables
├── .gitignore
├── Dockerfile              # Docker multi-stage build
├── docker-compose.yml      # Docker Compose config
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 📝 API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/albums` | List semua album + jumlah foto |
| `POST` | `/api/albums` | Buat album baru |
| `PUT` | `/api/albums/:id` | Edit album |
| `DELETE` | `/api/albums/:id` | Hapus album + semua foto |
| `GET` | `/api/albums/:id/photos` | List foto dalam album |
| `POST` | `/api/albums/:id/photos` | Upload foto ke server lokal |
| `POST` | `/api/albums/:id/photos/imgbb` | Upload foto ke ImgBB |
| `DELETE` | `/api/photos/:id` | Hapus satu foto |

---

## 📄 Lisensi

MIT — bebas dipake buat apa aja.
