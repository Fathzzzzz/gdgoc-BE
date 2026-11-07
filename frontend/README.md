# Frontend FilmLog (React + Vite + Tailwind CSS)

Aplikasi frontend FilmLog, migrasi dari starter HTML/JavaScript biasa ke **React + Vite + Tailwind CSS**. Tetap memakai tema gelap, aksen hijau, kartu poster, dan seluruh fitur yang sama: Discover (pencarian/genre/shuffle), detail film, autentikasi JWT, watchlist, catatan tontonan + rating + ulasan, rekomendasi AI, pengaturan API Base URL, API Inspector, dan toast.

## Persyaratan
- Node.js 18+ (diuji pada Node 26) dan npm.
- Backend FastAPI berjalan terpisah (lihat README root).

## Instalasi
```sh
cd frontend
npm install
```

## Menjalankan (development)
```sh
npm run dev
```
Buka http://localhost:3000. Vite dikonfigurasi `server.port = 3000` (`strictPort`) sehingga cocok dengan origin yang sudah diizinkan CORS backend (`http://localhost:3000`).

## Konfigurasi API Base URL
Prioritas (tertinggi dulu):
1. Pengaturan dalam aplikasi (tombol **Settings** di navbar) — disimpan di `localStorage` sebagai `filmlog_api_url`.
2. Environment build-time `VITE_API_BASE_URL`.
3. Default `http://localhost:8000/api`.

Buat `.env` (tidak masuk Git) jika perlu mengganti default saat build:
```dotenv
VITE_API_BASE_URL=https://api.example.com/api
```
API key AI dan seluruh rahasia backend tetap berada di backend (file `.env` root proyek), tidak pernah di frontend.

## Skrip
| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan Vite di port 3000 |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Pratinjau hasil build |
| `npm run lint` | Pemeriksaan kode (ESLint) |
| `npm test` | Jalankan Vitest sekali |
| `npm run test:watch` | Vitest mode watch |

## Pengujian
```sh
npm test
```
Vitest + Testing Library (jsdom). Seluruh komunikasi HTTP memakai mock `fetch`, sehingga tidak bergantung pada backend, database, atau layanan AI berbayar. Cakupan penting:
- Status tombol Discover mengikuti data watchlist backend setelah dimuat (issue #1).
- Mengubah watchlist tidak membuka kembali modal detail yang sudah ditutup (issue #2).
- Data pengguna rusak di `localStorage` ditangani sehingga aplikasi tetap bisa mulai (issue #3).
- Permintaan lama tidak mengisi kembali data pengguna setelah berganti sesi.
- Token kedaluwarsa (401) mengosongkan sesi.
- Teks dari API dirender sebagai teks inert dan URL poster dibatasi HTTP(S).

## Build & Deployment (terpisah dari backend)
```sh
npm run build
```
Hasil build statis berada di `dist/`, siap di-hosting oleh layanan statis (Netlify, Vercel, Nginx, dsb.) secara terpisah dari backend. Saat deploy:
- Set `VITE_API_BASE_URL` ke alamat backend yang di-deploy.
- Tambahkan origin frontend ke `CORS_ORIGINS` pada konfigurasi backend (`.env` root).
- Backend tidak boleh mengekspos rahasia; kunci AI/config hanya di backend.

Dataset fallback (`src/data/movies.json`) diimpor sebagai modul sehingga ikut ter-bundle di `dist/`, bukan diambil lewat jaringan saat runtime. Saat fallback aktif, Discover menampilkan penanda "data lokal (fallback)".

## Struktur
```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── pages/         # Discover, Watchlist, Watched, AI rekomendasi
    ├── components/    # Navbar, MovieCard, MovieGrid, modal, toast, inspector, dst.
    ├── hooks/         # useEscapeKey, useLockBodyScroll
    ├── context/       # Auth, Movies, Watchlist, Watched, Toast, Api
    ├── services/      # api.js: klien HTTP terpusat + header JWT + konfigurasi
    ├── lib/           # util murni (sanitasi URL, shuffle, dst.)
    ├── data/          # dataset fallback (dibundel)
    ├── styles/        # index.css (Tailwind)
    └── test/          # setup & helper pengujian
```

## Keamanan
- React merender semua teks dari API sebagai teks (tanpa `innerHTML`), sehingga markup ulasan/alasan AI tidak pernah menjadi DOM hidup.
- `safeImageUrl` membatasi `src` poster ke skema HTTP(S).
- Header `Authorization: Bearer <token>` dipasang terpusat di `services/api.js`.
- Logout menghapus token/user/watchlist/watched dari state dan `localStorage`.