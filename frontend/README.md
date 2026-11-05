# Frontend companion FilmLog

Tampilan starter HTML, Tailwind CDN, Lucide dan JavaScript dipertahankan. Tidak memerlukan build npm. Jalankan dari root repository:

```sh
python3 scripts/serve_frontend.py
```

Buka http://localhost:3000/frontend/. API Base URL: http://localhost:8000/api (bisa diubah lewat Settings).

Server khusus hanya mengekspos frontend/ dan data/, agar fallback dataset berfungsi tanpa membuka .env, .git atau backend. Hindari server statis umum pada root repository yang memuat rahasia. Backend harus mengizinkan origin frontend lewat CORS.

Fitur: Discover/filter/shuffle, detail, login/register, watchlist, review, rekomendasi Gemini dan API Inspector. Token disimpan di localStorage. Fallback film ketika backend gagal bukan bukti API berhasil. Teks dari API di-escape sebelum masuk template HTML dan URL poster dibatasi HTTP(S).
