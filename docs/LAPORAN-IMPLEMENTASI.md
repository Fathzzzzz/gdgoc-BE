# Laporan dan tutorial implementasi FilmLog

Tanggal pekerjaan: 5 November 2026. Laporan ini mengikuti pekerjaan yang dilakukan pada starter lokal. Tujuannya menjelaskan file apa yang dibuat dahulu, mengapa dibuat, dan bagaimana memeriksa hasilnya. Status uji provider dicatat di VERIFIKASI.md.

## 1. Memahami keadaan awal
Pertama, saya membaca README, frontend/app.js, frontend/index.html, dataset JSON/SQL, spesifikasi assignment, dan PRD yang diberikan. Backend hanya berisi main.py dan __init__.py yang kosong. Frontend sudah memanggil 10 endpoint tetapi belum mempunyai backend aplikasi.

Saya memeriksa working tree dan riwayat Git sebelum mengubah file. Dengan begitu perubahan pengguna tidak tertimpa dan setiap commit baru dapat dibedakan dari commit starter.

## 2. Menyiapkan database sebelum menulis endpoint
File pertama yang diubah adalah .gitignore: .env, .venv, bytecode dan cache dikecualikan. Rahasia harus terlindungi sebelum mulai mengisi konfigurasi.

Berikutnya saya membuat compose.yaml. Satu service db menggunakan image PostgreSQL 17, named volume untuk persistensi, healthcheck pg_isready, serta port 55432 yang hanya di-bind ke 127.0.0.1. Port berbeda dipilih untuk mengurangi benturan dengan PostgreSQL lokal yang biasa memakai 5432. Volume menyimpan data terpisah dari umur container.

Lalu saya membuat .env.example dan .env lokal. Contoh memuat nama variabel; file lokal berisi password database dan kunci JWT acak. Password DATABASE_URL harus sama dengan POSTGRES_PASSWORD. Mengganti environment pada volume PostgreSQL yang sudah diinisialisasi tidak otomatis mengganti password role; gunakan kredensial volume yang sama atau kelola role secara eksplisit.

Docker Desktop awalnya belum aktif. Saya membukanya, meminta akses yang diperlukan dan menjalankan docker compose up -d --wait. Dependency Python dipasang ke virtual environment backend/.venv yang sudah tersedia. requirements.txt berisi rentang kompatibilitas; requirements.lock.txt membekukan versi lingkungan yang benar-benar diuji.

## 3. Menghubungkan aplikasi dengan database
Saya membuat app/core/config.py terlebih dahulu agar semua bagian memakai satu konfigurasi. Path .env dihitung dari lokasi file, sehingga tidak bergantung pada terminal dibuka di folder mana. Nilai yang dapat diubah meliputi database, JWT, provider AI, timeout dan CORS.

Lalu app/database/session.py mendefinisikan engine SQLAlchemy, Base dan SessionLocal. Sesi dibuka per request dan ditutup setelahnya. pool_pre_ping memeriksa koneksi lama sebelum dipakai kembali.

app/database/models.py mendefinisikan empat tabel. Email unik, watchlist unik per pasangan user-film, review memiliki check rating 1–5. Foreign key menjaga referensi user dan film. Review tidak diberi unique user-film karena MVP menerima tontonan ulang. Array genres dan cast disimpan sebagai JSON agar dapat langsung dikembalikan sebagai array.

Saya menyiapkan backend/alembic.ini, migrations/env.py dan script.py.mako, menulis revision awal secara eksplisit berdasarkan model, kemudian menjalankan alembic upgrade head. Migrasi merekam perubahan tabel; seeding mengisi isinya. Keduanya sengaja dipisahkan. Untuk perubahan selanjutnya, ubah model, buat revision baru dan periksa SQL sebelum upgrade; jangan mengedit revision lama yang sudah dipakai orang lain.

## 4. Mengisi 20 film dari JSON
Saya membuat app/scripts/seed.py. Program membaca data/movies.json, memasukkan seluruh field, dan mempertahankan ID. INSERT memakai ON CONFLICT DO NOTHING pada ID, sehingga pemanggilan ulang tidak menggandakan katalog dan tidak menghapus pengguna, watchlist atau review.

Perintah dari backend:
```sh
.venv/bin/alembic upgrade head
.venv/bin/python -m app.scripts.seed
```
Katalog lama tidak diperbarui otomatis oleh seed ini. Bila dataset resmi diperbarui, perubahan isi perlu ditangani secara sengaja, bukan menimpa diam-diam.

## 5. Membuat keamanan sebelum fitur pribadi
app/core/errors.py menyediakan helper error {message,code}. app/core/security.py menyediakan hashing Argon2, verifikasi password dan pembuatan JWT. JWT memuat sub sebagai ID user, iat dan exp. Password disimpan sebagai hash; respons schema tidak menyertakan password_hash. Password tidak di-trim agar input yang diverifikasi sama persis dengan yang didaftarkan.

app/dependencies.py menyediakan DB dan CurrentUser. CurrentUser mengambil Bearer token, memverifikasi signature/algoritma/expiry dan mencari pengguna di database. Identitas user tidak berasal dari body request. Karena itu mengirim user_id palsu tidak mengubah pemilik data.

JWT MVP tidak mempunyai refresh atau revocation. Logout starter hanya menghapus localStorage. Token yang sudah disalin tetap berlaku sampai expiry; keputusan ini dijelaskan agar batas keamanan dipahami.

## 6. Membuat modul auth lalu katalog
Modul auth dibuat dengan urutan schema → service → router. Schema memvalidasi input, service menyimpan akun atau memverifikasi kredensial, dan router mendefinisikan POST register/login. Email dipangkas dan dinormalisasi ke huruf kecil. Unique constraint menangani dua registrasi email sama. Kredensial salah menghasilkan pesan umum 401.

Modul movies berisi schema objek film, repository untuk query, dan router GET katalog/detail. Query parameter search, genre dan shuffle disediakan sebagai tambahan. Frontend starter tetap melakukan pencarian/genre/shuffle di browser setelah mengambil katalog. Film yang tidak ditemukan menghasilkan 404.

## 7. Watchlist dan ulasan
Watchlist memakai pasangan user.id dari dependency dan movie_id dari input. Tambah memeriksa film, menyimpan entri dan mengandalkan unique constraint database untuk konflik. Hapus mencari berdasarkan user_id sekaligus movie_id, sehingga tidak dapat menghapus entri milik orang lain. Respons pembuatan dibungkus data sesuai perilaku companion; DELETE berhasil mengembalikan 204 tanpa body.

Reviews berada dalam modul reviews tetapi path publiknya /api/watched. Setiap POST membuat catatan baru. Rating wajib integer 1–5 dan ulasan tidak kosong setelah trim. Riwayat hanya untuk pemilik token dan diurutkan terbaru dahulu. Menonton tidak otomatis menghapus watchlist.

Payload companion membawa field tambahan movie_id, opinion, query dan description. Schema menerima alias yang relevan dan mengabaikan field pendamping. Mode strict untuk ID/rating mencegah boolean atau pecahan diterima sebagai integer.

## 8. Menggabungkan aplikasi
main.py membuat FastAPI, mendaftarkan router dan CORS, serta handler error. Validasi input diubah menjadi 400 dengan message yang terbaca frontend, sementara internal error menghasilkan 500 generik. Logger aplikasi mencatat method/path/status/durasi tanpa body, token atau API key. /health hanya menyatakan proses aktif. /docs dan /openapi.json disediakan otomatis untuk mencoba endpoint.

## 9. Menambahkan rekomendasi AI

Klien mengirim `POST /chat/completions` ke endpoint dari `AI_BASE_URL`, dengan `AI_API_KEY` sebagai Bearer token dan `AI_MODEL` sebagai ID model. `AI_TIMEOUT_SECONDS` mengatur waktu tunggu. System prompt memuat aturan dan katalog film. Preferensi pengguna dikirim sebagai pesan terpisah. Provider diminta mengembalikan JSON berisi `movie_id` dan `reasoning`.

Service mengambil ID dataset awal yang tersedia dalam database dan menolak ID di luar katalog. Respons rusak menghasilkan 502, layanan tidak tersedia menghasilkan 503, dan timeout menghasilkan 504. Tes otomatis memakai simulasi provider. Cara menguji endpoint milikmu ada di README.

## 10. Menyesuaikan frontend secukupnya
Tampilan dan fungsi starter dipertahankan. Saya menambahkan escapeHtml untuk data teks yang masuk ke template innerHTML dan safeImageUrl untuk membatasi poster ke HTTP(S). Tujuannya agar ulasan atau alasan AI berisi markup ditampilkan sebagai teks. Pada awalnya server statis dijalankan dari root agar ../data/movies.json dapat diakses. Pemeriksaan akhir menunjukkan cara ini juga berpotensi membuka .env. Saya kemudian membuat scripts/serve_frontend.py dengan allowlist direktori frontend/ dan data/, mengganti server percobaan, dan menguji .env, .git, backend serta traversal menghasilkan 404. Gunakan server khusus pada README, bukan server statis umum dari root.

## 11. Memverifikasi pekerjaan
Pengujian otomatis memakai PostgreSQL sungguhan. Fixture membuka transaksi luar dan savepoint sehingga commit di service tetap dapat di-rollback saat test selesai. Data pengguna aplikasi tidak dibersihkan oleh test; sequence dapat meningkat. Provider disimulasikan secara terpisah.

Cakupan meliputi katalog, input, auth guard, dua akun, duplikasi, pencatatan ulang, CORS serta grounding dan kegagalan provider AI. Hasil aktual dan pemeriksaan tambahan dicatat di VERIFIKASI.md. Database juga diperiksa setelah seed ulang dan container dimulai ulang untuk memeriksa persistensi.

## 12. Commit bertahap dan penggunaan ulang
Commit dilakukan per tahap yang dapat ditinjau: konfigurasi, database, API inti, rekomendasi AI, integrasi frontend, lalu pengujian/laporan. Lihat JURNAL-PEKERJAAN.md dan git log. Commit dilakukan pada saat tahapnya tersedia; pengujian menyeluruh dilakukan sesudah fitur tersambung dan setiap temuan diperbaiki pada tahap validasi.

Untuk mengulang di komputer lain, ikuti README dari penyalinan .env sampai migrasi, seed dan server. Untuk mempelajari kode, ikuti satu request: router → schema/dependency → service atau repository → database → schema respons. Tidak semua modul memerlukan semua lapisan; query review sederhana tetap berada pada router untuk menghindari lapisan tanpa manfaat.

Repository publik, video dan submission belum dikirim otomatis. PANDUAN-VIDEO.md membantu menjelaskan keputusan dan demonstrasi dalam 3–5 menit.
