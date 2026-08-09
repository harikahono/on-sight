# on-sight

Visual gallery / sandbox buat koleksi desain HTML statis. Drop atau upload desain → grid dashboard → klik buka preview di tab baru.

> Nama diambil dari lagu "On Sight" — track 1 album Yeezus (2013). Port **6010** = 10 (track 01 dibalik) + 60 (album 06 dibalik).

## Setup (sekali)

```bash
pnpm install
npm link             # daftarin CLI 'onsight' ke PATH (pnpm link --global bermasalah di pnpm v11 Windows)
```

## Pakai

```bash
onsight              # server jalan di http://localhost:6010, browser auto-open
```

Terus di dashboard: **+ Tambah Desain** → isi nama/deskripsi/tags → upload file HTML (wajib) + screenshot (opsional) → card muncul di grid. Klik card → preview di tab baru. Hover card → icon edit (metadata) / hapus. `Ctrl+K` / `Cmd+K` buat fokus search.

Latar belakang dashboard itu ASCII art live dari `public/ascii-source.jpg` (particle sway + mouse repel). Kalau OS kamu set *reduce motion*, backdrop render statis dan semua animasi UI dimatikan — aksesibilitas.

Kalau port 6010 kepake (jarang): `PORT=xxxx onsight` (atau `pnpm env` di PowerShell).

## Format desain (1 folder di `/designs` = 1 desain)

```
/designs/<slug>/
├── index.html       # wajib — satu file HTML lengkap (CSS/JS inline)
├── screenshot.png   # opsional — thumbnail di grid (png/jpg/jpeg/webp)
└── manifest.json    # metadata
```

```json
{ "name": "Demo Landing", "description": "Contoh", "tags": ["demo", "landing"] }
```

Nama folder (slug) auto dibuat dari nama desain pas upload. Folder manual juga dideteksi otomatis.

## Stack

pnpm · Node.js + Express + Multer · Vanilla HTML/JS + Vanilla CSS (`public/variables.css` — token-driven, Linear-style dark) · NO build step, NO database.

Detail lebih lengkap: `PRD.md`, `TECH_SPEC.md`, `DESIGN.md`, `AGENTS.md`.
