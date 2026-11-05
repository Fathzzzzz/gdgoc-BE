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
