# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Project Name:** on-sight
**Role:** AI Coder (Opencode)
**Architect:** Bintang

## 1. Objective
Membangun web app lokal yang berfungsi sebagai "Visual Gallery" atau "Sandbox" untuk menyimpan, mengelola, dan melakukan preview pada koleksi file desain HTML statis secara terisolasi.

## 2. Core Features
- **Input via UI:** Desain ditambahkan lewat tombol "+ Tambah" di dashboard — upload satu file HTML (wajib) + screenshot (opsional) + metadata (nama, deskripsi, tags). Server menulis otomatis ke `/designs/<slug>/` + generate `manifest.json`.
- **Auto-Indexing:** Sistem otomatis mendeteksi folder desain baru di dalam direktori `/designs` tanpa perlu update hardcode (dashboard refresh via polling 3 detik).
- **Dashboard UI:** Halaman utama menampilkan grid dari semua koleksi desain, dengan card berisi screenshot, nama, deskripsi, dan tag.
- **Isolated Preview:** Saat card desain diklik, file HTML terbuka di tab baru (`target="_blank"`) agar tidak mengganggu layout dashboard.
- **Zero Build-Step:** Desain yang dimasukkan murni HTML/CSS/JS tanpa butuh build tools (Webpack/Vite) tambahan di dalam folder desainnya.
- **CLI:** Web app bisa dipanggil dari terminal dengan keyword `onsight` — server jalan + browser terbuka otomatis ke `http://localhost:6010`.

## 3. Out of Scope
- Fitur edit code langsung di browser (bukan CodePen clone).
- Database (semua murni berbasis file system lokal).
- Upload multi-file (css/js terpisah) — v1 hanya satu file HTML dengan semua style inline.
