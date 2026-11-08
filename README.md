# FilmLog — Movie Watchlist & Review API

Backend tugas GDGoC UGM: FastAPI + SQLAlchemy + Alembic, PostgreSQL dalam Docker. Frontend memakai React + Vite + Tailwind CSS (folder frontend/). Python 3.14.6 digunakan pada pengujian lokal; Docker Desktop harus aktif. Dataset awal: 20 film.

## Menjalankan dari awal
Dari root repository:
```sh
cp .env.example .env
```
Ubah POSTGRES_PASSWORD dan samakan password pada DATABASE_URL. Isi JWT_SECRET_KEY dengan kunci acak minimal 32 karakter (misalnya hasil `python3 -c 'import secrets; print(secrets.token_hex(32))'`). Jangan memakai nilai contoh untuk layanan publik. File .env lokal yang dibuat saat implementasi sudah mempunyai nilai acak.

```sh
docker compose up -d --wait
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.lock.txt
cd backend
.venv/bin/alembic upgrade head
.venv/bin/python -m app.scripts.seed
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Dokumentasi interaktif: http://localhost:8000/docs; OpenAPI: http://localhost:8000/openapi.json; pemeriksaan proses: http://localhost:8000/health (bukan pemeriksaan koneksi database).

Frontend (React + Vite + Tailwind CSS) dijalankan terpisah dari backend. Pada terminal kedua:
```sh
cd frontend
npm install
npm run dev
```
Buka http://localhost:3000. Vite menggunakan port 3000 (strictPort) karena origin ini sudah diizinkan oleh CORS backend. API Base URL default adalah http://localhost:8000/api dan dapat diubah lewat tombol Settings (tersimpan di localStorage). Dataset fallback kini dibundel ke dalam hasil build, sehingga UI fallback tetap tampil walau backend gagal tanpa perlu server statis root. Instalasi, konfigurasi environment, pengujian, build, dan deployment frontend terpisah dijelaskan di frontend/README.md.

## Konfigurasi
Lihat .env.example. DATABASE_URL mengarah ke PostgreSQL host port 55432. JWT memakai algoritma yang dikonfigurasi, expiry default 60 menit. CORS hanya mengizinkan origin frontend yang dikonfigurasi. Rahasia tidak masuk Git.

Untuk rekomendasi film, isi konfigurasi provider OpenAI-compatible di `.env` pada root proyek.

```dotenv
AI_BASE_URL=https://provider.example/v1
AI_API_KEY=isi-dengan-key-provider
AI_MODEL=nama-model-di-provider
AI_TIMEOUT_SECONDS=45
```

Gunakan URL dari provider. FilmLog menambahkan `/chat/completions` ke base URL dan menerima URL yang sudah berakhiran `/chat/completions`. Contoh URL di atas menghasilkan `https://provider.example/v1/chat/completions`. Gunakan ID model persis seperti yang tercantum pada provider, termasuk awalan bila ada.

Backend mengirim key melalui header `Authorization: Bearer ...`. Endpoint provider perlu menerima Chat Completions non-streaming dan mengembalikan teks pada `choices[0].message.content`. System prompt meminta JSON berisi `movie_id` dan `reasoning`. Backend memvalidasi ID film terhadap katalog sebelum mengirim hasil ke frontend. Setelah mengubah `.env`, mulai ulang backend.

## API
| Method | Path | Akses | Input |
|---|---|---|---|
| POST | /api/auth/register | Publik | username, email, password |
| POST | /api/auth/login | Publik | email, password |
| GET | /api/movies | Publik | search, genre, shuffle (query opsional) |
| GET | /api/movies/{id} | Publik | ID di path |
| GET | /api/watchlist | JWT | — |
| POST | /api/watchlist | JWT | movieId |
| DELETE | /api/watchlist/{movieId} | JWT | ID di path |
| GET | /api/watched | JWT | — |
| POST | /api/watched | JWT | movieId, rating, review |
| POST | /api/movies/recommend | Publik | prompt |

JWT dikirim sebagai `Authorization: Bearer <token>`. Login menghasilkan `{token,user}`. Registrasi menghasilkan user tanpa password/hash. Movie mengandung array genres dan cast. Watchlist POST menghasilkan `{data:{movie_id,movie,created_at}}`; daftar menghasilkan array. Review mengandung movie_id, rating, review, created_at dan movie. Rekomendasi menghasilkan `{movie_id,reasoning}`.

Status: register/penambahan 201, pembacaan/login/rekomendasi 200, hapus 204 tanpa body. Error berbentuk `{message,code}`: input 400, auth 401, tidak ditemukan 404, konflik 409, respons rekomendasi tidak valid 502, tidak tersedia 503, timeout 504. Status 403 disediakan sebagai konsep izin, tidak dipaksakan pada rute MVP yang mengakses data pemilik token.

Batas: username 3–50 setelah trim; password 8–128 tanpa trim; review 1–2000 setelah trim; prompt 1–1000; rating integer 1–5. Email dinormalisasi ke huruf kecil dan unik. Username tidak wajib unik. Riwayat boleh mencatat film sama berulang; menonton tidak otomatis menghapus watchlist. Logout menghapus sesi browser; JWT berlaku sampai expiry.

## Contoh request
```sh
curl http://localhost:8000/api/movies
curl -X POST http://localhost:8000/api/auth/register -H 'Content-Type: application/json' -d '{"username":"demo","email":"demo@example.com","password":"examplepass123"}'
curl -X POST http://localhost:8000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"demo@example.com","password":"examplepass123"}'
```
Gunakan tombol Authorize pada /docs untuk endpoint pribadi.

## Pengujian
```sh
cd backend
.venv/bin/pytest -q
```
Migrasi dan seed harus sudah dijalankan. Tests memakai PostgreSQL yang sama dengan transaksi luar dan savepoint yang di-rollback, sehingga data aplikasi tidak dibersihkan; sequence ID dapat meningkat. Jangan menjalankan terhadap database produksi. Tes provider memakai simulasi Chat Completions.

Pengujian frontend (Vitest + Testing Library, memakai mock fetch sehingga tidak bergantung pada backend/AI berbayar):
```sh
cd frontend
npm test      # sekali jalan
npm run lint  # pemeriksaan kode (ESLint)
npm run build # build produksi ke dist/
```

## Struktur proyek
- backend/app/core: konfigurasi, keamanan, error.
- backend/app/database: tabel, koneksi dan sesi.
- backend/app/modules: auth, movies, watchlist, reviews, recommendations.
- backend/app/scripts/seed.py: impor JSON idempoten.
- backend/migrations: riwayat skema Alembic.
- backend/tests: pengujian API dan batas provider.
- frontend/: aplikasi React + Vite + Tailwind (lihat frontend/README.md).
- docs/ERD.md: relasi database.

Menghentikan backend/frontend: Ctrl+C pada terminal masing-masing. Menghentikan database: `docker compose stop`. Memulai lagi: `docker compose up -d --wait`. Volume menjaga data saat container dibuat ulang; jangan menghapus volume jika ingin mempertahankan data.

## Penyerahan
Repository publik dan video 3–5 menit masih perlu disiapkan pengguna. Tidak ada push, deployment publik, atau pengiriman formulir otomatis. Starter: https://github.com/bimoar07/movie-watchlist-starter.
