# AGENTS.md — on-sight

Local web app: visual gallery / sandbox buat koleksi desain HTML statis. Drop atau upload desain → grid dashboard → klik buka preview di tab baru.

## Stack
- pnpm · Node.js + Express + Multer · Vanilla HTML/JS + Vanilla CSS (token-driven, `variables.css`) — NO Tailwind, NO build step, NO database.

## Command
- `pnpm install` — install deps
- `npm link` — daftarin CLI `onsight` ke PATH (sekali setup; `pnpm link --global` error di pnpm v11 Windows)
- `onsight` atau `node server.js` — jalan di `http://localhost:6010`, browser auto-open

## Struktur
```
/designs/<slug>/   # 1 folder = 1 desain: index.html (wajib) + screenshot.png (ops) + manifest.json
/public/           # Dashboard UI (index.html, app.js, styles.css) + variables.css (design tokens) + ascii-backdrop.js + ascii-source.jpg
server.js          # API + static + CLI entry (shebang)
```
- `public/variables.css` — Design tokens — JANGAN hardcode warna/spacing, pakai token ini. Motion juga token: `--ease-out-quick`, `--ease-in-out`, `--duration-press/micro/modal`.
- `public/ascii-backdrop.js` — live ASCII dari `ascii-source.jpg` (particle sway + mouse repel). Kalau `prefers-reduced-motion` → render 1x statis, gak ada rAF loop.

## Aturan inti
- Design system: Linear-style dark ("midnight precision instrument"). Void #08090a canvas, Carbon #0f1011 card, hairline border #23252a, accent acid-lime #e4f222 (SATU elemen acid per view). Inter 400–510, gak ada weight 700+. Radius: card 12px, button 6px, pill 9999px.
- Desain v1 = satu file `index.html` lengkap (CSS/JS inline). Multi-file out of scope.
- Endpoint: `GET /api/designs` (list), `POST /api/designs` (upload multipart: html + screenshot + name/description/tags), `PUT /api/designs/:slug` (edit metadata), `DELETE /api/designs/:slug` (hapus folder).
- Upload: whitelist ekstensi (.html/.png/.jpg/.jpeg/.webp), slug disanitasi, slug bentrok → 409.
- Port: 6010. Auto-open browser pakai `child_process` (start/open/xdg-open per platform).
- Dashboard: polling `/api/designs` 3s buat refresh (bukan WebSocket/SSE). Guard di `refresh()`: JSON signature compare — data sama gak re-render (anti-flicker).

## Keputusan sengaja ditunda (YAGNI)
Multi-file upload · code-edit in-browser · DB · nested folder recursion · sorting · fs.watch → upgrade polling kalau kerasa lambat.
