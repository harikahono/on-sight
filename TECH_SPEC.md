# TECHNICAL SPECIFICATION

## 1. Tech Stack
- **Package Manager:** pnpm
- **Backend:** Node.js + Express.js + Multer (local server, file system reader, file upload).
- **Frontend:** Vanilla HTML5 + ES6 JavaScript + Vanilla CSS (token-driven, `variables.css` — tanpa framework CSS).

## 2. Folder Structure
```text
/on-sight
├── /designs            # Koleksi desain; tiap folder = satu desain
│   └── /demo           # Contoh desain (index.html + manifest.json)
├── /public             # Frontend assets
│   ├── index.html      # Dashboard UI
│   ├── app.js          # Render grid, Cmd+K search, polling, upload
│   └── styles.css      # Linear app style, pakai token dari variables.css
│   └── variables.css   # Design tokens (colors, spacing, type, shadows)
├── server.js           # Core backend logic (juga entry CLI "onsight")
└── package.json
```

## 3. Core Logic (server.js)

### Format Desain (tiap folder di /designs)
- `index.html` — wajib, satu file HTML lengkap (CSS/JS inline)
- `screenshot.png` — opsional, thumbnail di grid
- `manifest.json` — metadata:
  ```json
  { "name": "Demo Design", "description": "Contoh", "tags": ["hero", "dark"] }
  ```

### Endpoints
- `GET /api/designs`:
  - Membaca isi folder `/designs` dengan `fs.readdirSync`.
  - Hanya return folder yang punya `index.html`.
  - Untuk tiap folder: baca `manifest.json` (fallback: nama folder), cek `screenshot.png`.
- `POST /api/designs` (multipart/form-data via Multer):
  - Field: `html` (file, wajib), `screenshot` (file, opsional), `name`, `description`, `tags` (comma-separated).
  - Menulis ke `/designs/<slug>/index.html` + `screenshot.png` + generate `manifest.json`.
  - Slug dibuat dari `name`; kalau folder slug sudah ada → return 409.

### Static Routing
- `app.use('/', express.static('public'))`
- `app.use('/designs', express.static('designs'))`

### CLI "onsight"
- `package.json` → `"bin": { "onsight": "server.js" }`, `server.js` diawali shebang `#!/usr/bin/env node`.
- Setup sekali: `pnpm link --global`, lalu panggil `onsight` dari terminal mana pun.
- Server listen di port **6010**, auto-open browser ke `http://localhost:6010` (via `child_process`: `start`/`open`/`xdg-open` per platform).

## 4. Security / Sandbox
- Path traversal: semua akses file dibatasi di dalam `/designs` (express.static aman by default; API hanya baca dalam direktori itu).
- Upload: whitelist ekstensi file (`.html`, `.png`, `.jpg`, `.jpeg`, `.webp`), batasi ukuran file, slug disanitasi.
- Karena jalan lokal, tidak ada isu CORS parah.
