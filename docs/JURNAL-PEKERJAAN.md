# Jurnal pekerjaan FilmLog

Tanggal: 5 November 2026. Catatan mengikuti urutan pekerjaan aktual, bukan riwayat buatan.

## Tahap 1 — Persiapan
1. Memeriksa repository: backend/app/main.py dan __init__.py kosong; frontend dan 20 film sudah tersedia. Working tree bersih.
2. Memeriksa Docker: daemon belum aktif, lalu membuka Docker Desktop dan meminta akses socket.
3. Membuat .gitignore agar .env, virtual environment, dan cache tidak masuk Git.
4. Membuat compose.yaml: PostgreSQL 17, port lokal 55432, volume persisten dan healthcheck. Database tidak dibuka ke jaringan luar.
5. Membuat .env.example, lalu .env lokal dengan password dan kunci JWT acak. Nilai rahasia tidak dicatat di laporan.
6. Membuat backend/requirements.txt dan pyproject.toml untuk dependency serta konfigurasi pengujian.
7. Memasang dependency di backend/.venv yang telah tersedia.

Keputusan: backend berjalan di host; hanya database yang memakai Docker. PostgreSQL, SQLAlchemy, Alembic dan aturan MVP PRD digunakan sebagai pilihan implementasi. Frontend dipertahankan.

## Tahap 2 — Database
1. Membuat core/config.py untuk membaca .env dari root proyek secara konsisten.
2. Membuat database/session.py untuk engine, Base, dan sesi per request.
3. Membuat database/models.py: users, movies, watchlists, reviews, relasi dan constraint.
4. Menyiapkan alembic.ini, migrations/env.py dan template revision. Migration awal ditulis secara eksplisit berdasarkan model, lalu diperiksa.
5. Membuat scripts/seed.py: membaca JSON, mempertahankan ID, dan ON CONFLICT DO NOTHING agar pengulangan aman.
6. Menjalankan PostgreSQL Docker hingga healthcheck healthy.

Model dikumpulkan dalam database/models.py agar relasi antarfitur mudah dilihat pemula. API dan aturan bisnis tetap dibagi per modul. Array genre/pemeran disimpan sebagai JSON; rating katalog berbeda dari rating pengguna.

## Tahap 3 — Auth dan API inti
1. Membuat core/errors.py dan security.py: pesan terstruktur, Argon2, JWT dengan expiry.
2. Membuat dependencies.py: sesi database dan pengguna dari token, bukan user_id pada body.
3. Membuat modul auth (schema, service, router), lalu movies (schema, repository, router).
4. Membuat watchlist dengan unique constraint sebagai pertahanan duplikasi pada request bersamaan.
5. Membuat reviews untuk pencatatan ulang dan rating integer 1–5.
6. Menghubungkan router di main.py, mengaktifkan CORS serta normalisasi error validasi ke 400/message.

Payload tambahan companion diabaikan; movieId/movie_id dan review/opinion diterima. Respons tidak memuat hash password. Password tidak dipangkas sebelum hashing. Username boleh sama, email dinormalisasi dan unik. Logout mengikuti starter: menghapus sesi browser, bukan mencabut JWT.

## Tahap 4 — Gemini
1. Membuat schema rekomendasi, client HTTP Gemini, service grounding dan router POST /api/movies/recommend.
2. Memisahkan systemInstruction (aturan dan katalog) dari pesan preferensi pengguna.
3. Meminta JSON terstruktur lalu memvalidasi tipe ID, alasan, dan keanggotaan katalog pada backend.
4. Memetakan kegagalan provider menjadi 502/503/504 tanpa mengirim body provider atau API key.
5. API key dibiarkan kosong karena pengguna belum memberikan kredensial. Model default dapat diubah melalui .env; keberadaan konfigurasi bukan bukti integrasi nyata berhasil.

Rujukan implementasi: https://ai.google.dev/api/generate-content dan https://ai.google.dev/gemini-api/docs/structured-output (diperiksa 5 November 2026). Gemini tidak diganti film acak saat gagal.
