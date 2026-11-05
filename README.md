# FilmLog — Movie Watchlist & Review API

Backend tugas GDGoC UGM: FastAPI + SQLAlchemy + Alembic, PostgreSQL dalam Docker. Frontend companion starter tetap digunakan. Python 3.14.6 digunakan pada pengujian lokal; Docker Desktop harus aktif. Dataset awal: 20 film.

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
Pada terminal kedua, dari root repository:
```sh
python3 scripts/serve_frontend.py
```
Buka http://localhost:3000/frontend/ dan atur API Base URL ke http://localhost:8000/api. Dokumentasi interaktif: http://localhost:8000/docs; OpenAPI: http://localhost:8000/openapi.json; pemeriksaan proses: http://localhost:8000/health (bukan pemeriksaan koneksi database).

Jangan menjalankan server statis dari dalam frontend/ jika ingin fallback dataset berfungsi. UI fallback dapat tampil walau backend gagal; periksa API Inspector dan respons endpoint.

## Konfigurasi
Lihat .env.example. DATABASE_URL mengarah ke PostgreSQL host port 55432. JWT memakai algoritma yang dikonfigurasi, expiry default 60 menit. CORS hanya mengizinkan origin frontend yang dikonfigurasi. Rahasia tidak masuk Git.

Isi `GEMINI_API_KEY` dan `GEMINI_MODEL` pada `.env` lalu mulai ulang backend. Gunakan nama model yang tersedia pada akun Google. Untuk Gemini 3, permintaan rekomendasi memakai thinking level `LOW` dan mengikuti format permintaan tanpa parameter sampling yang dihapus. Timeout respons default 45 detik. Backend mencoba menyambung kembali hingga dua kali jika koneksi awal gagal. Tanpa kunci, endpoint mengembalikan 503.

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

Status: register/penambahan 201, pembacaan/login/rekomendasi 200, hapus 204 tanpa body. Error berbentuk `{message,code}`: input 400, auth 401, tidak ditemukan 404, konflik 409, Gemini tidak valid 502, tidak tersedia 503, timeout 504. Status 403 disediakan sebagai konsep izin, tidak dipaksakan pada rute MVP yang mengakses data pemilik token.

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
Migrasi dan seed harus sudah dijalankan. Tests memakai PostgreSQL yang sama dengan transaksi luar dan savepoint yang di-rollback, sehingga data aplikasi tidak dibersihkan; sequence ID dapat meningkat. Jangan menjalankan terhadap database produksi. Test provider memakai test double, bukan panggilan Gemini berbayar. Hasil dan keterbatasan: docs/VERIFIKASI.md.

## Struktur dan laporan
- backend/app/core: konfigurasi, keamanan, error.
- backend/app/database: tabel, koneksi dan sesi.
- backend/app/modules: auth, movies, watchlist, reviews, recommendations.
- backend/app/scripts/seed.py: impor JSON idempoten.
- backend/migrations: riwayat skema Alembic.
- backend/tests: pengujian API dan batas provider.
- docs/LAPORAN-IMPLEMENTASI.md: tutorial dari pekerjaan aktual.
- docs/JURNAL-PEKERJAAN.md: urutan tahap dan commit.
- docs/ERD.md: relasi database.

Menghentikan backend/frontend: Ctrl+C pada terminal masing-masing. Menghentikan database: `docker compose stop`. Memulai lagi: `docker compose up -d --wait`. Volume menjaga data saat container dibuat ulang; jangan menghapus volume jika ingin mempertahankan data.

## Penyerahan
Repository publik dan video 3–5 menit masih perlu disiapkan pengguna. docs/PANDUAN-VIDEO.md memuat susunan demonstrasi. Tidak ada push, deployment publik, atau pengiriman formulir otomatis. Starter: https://github.com/bimoar07/movie-watchlist-starter.
