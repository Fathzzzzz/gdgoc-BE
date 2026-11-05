# ERD FilmLog
```mermaid
erDiagram
    USERS ||--o{ WATCHLISTS : owns
    MOVIES ||--o{ WATCHLISTS : listed
    USERS ||--o{ REVIEWS : writes
    MOVIES ||--o{ REVIEWS : reviewed
    USERS {
        integer id PK
        varchar email UK
        varchar username
        text password_hash
        timestamptz created_at
    }
    MOVIES {
        integer id PK
        varchar title
        integer year
        varchar director
        json genres
        float rating
        varchar duration
        text synopsis
        text poster_url
        json cast
    }
    WATCHLISTS {
        integer id PK
        integer user_id FK
        integer movie_id FK
        timestamptz created_at
    }
    REVIEWS {
        integer id PK
        integer user_id FK
        integer movie_id FK
        integer rating
        text review
        timestamptz created_at
    }
```
Watchlists unique (user_id,movie_id); indeks ini juga mendukung lookup per pemilik. Reviews memiliki indeks (user_id,created_at), check rating 1–5, dan boleh berulang. Movie ID eksplisit mengikuti dataset, tidak menggunakan sequence. Hapus user menghapus catatan miliknya lewat FK cascade; penghapusan film yang masih direferensikan ditolak. Endpoint penghapusan user/film tidak disediakan pada MVP.
