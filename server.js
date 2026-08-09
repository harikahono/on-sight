#!/usr/bin/env node
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(express.urlencoded({ extended: true }));
const DESIGNS = path.join(__dirname, 'designs');
const PORT = process.env.PORT || 6010;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ---- GET /api/designs — list semua desain ----
app.get('/api/designs', (req, res) => {
  let dirs = [];
  try { dirs = fs.readdirSync(DESIGNS, { withFileTypes: true }); }
  catch { return res.json([]); }

  const out = dirs
    .filter(d => d.isDirectory() && fs.existsSync(path.join(DESIGNS, d.name, 'index.html')))
    .map(d => {
      const dir = path.join(DESIGNS, d.name);
      let m = {};
      try { m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); } catch {}
      const shot = fs.readdirSync(dir).find(f => /^screenshot\.(png|jpe?g|webp)$/i.test(f)) || null;
      return {
        name: m.name || d.name,
        description: m.description || '',
        tags: Array.isArray(m.tags) ? m.tags : [],
        screenshot: shot,
        url: `/designs/${encodeURIComponent(d.name)}/index.html`,
      };
    });
  res.json(out);
});

// ---- POST /api/designs — upload desain baru ----
app.post('/api/designs', upload.fields([
  { name: 'html', maxCount: 1 },
  { name: 'screenshot', maxCount: 1 },
]), (req, res) => {
  try {
    const html = req.files?.html?.[0];
    if (!html) return res.status(400).json({ error: 'File html wajib.' });
    if (!/\.html$/i.test(html.originalname)) return res.status(400).json({ error: 'File harus berekstensi .html.' });

    const name = (req.body.name || '').trim() || 'Untitled';
    const description = (req.body.description || '').trim();
    const tags = (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
    const dir = path.join(DESIGNS, slug);

    if (fs.existsSync(dir)) return res.status(409).json({ error: `Desain "${slug}" udah ada. Pakai nama lain.` });

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html.buffer);

    let screenshot = null;
    const shot = req.files?.screenshot?.[0];
    if (shot) {
      const ext = path.extname(shot.originalname).toLowerCase();
      if (!/\.(png|jpe?g|webp)$/.test(ext)) {
        fs.rmSync(dir, { recursive: true, force: true });
        return res.status(400).json({ error: 'Screenshot harus .png/.jpg/.jpeg/.webp.' });
      }
      fs.writeFileSync(path.join(dir, 'screenshot' + ext), shot.buffer);
      screenshot = 'screenshot' + ext;
    }

    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ name, description, tags }, null, 2));
    res.status(201).json({ name, description, tags, screenshot, url: `/designs/${slug}/index.html` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal simpan desain.' });
  }
});

// ---- PUT /api/designs/:slug — update desain (rename folder + ganti file) ----
app.put('/api/designs/:slug', upload.fields([
  { name: 'html', maxCount: 1 },
  { name: 'screenshot', maxCount: 1 },
]), (req, res) => {
  try {
    const slug = req.params.slug;
    const dir = path.join(DESIGNS, slug);
    if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Desain gak ketemu.' });

    const name = (req.body.name || '').trim() || 'Untitled';
    const description = (req.body.description || '').trim();
    const tags = (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';

    let target = dir;
    if (newSlug !== slug) {
      const newDir = path.join(DESIGNS, newSlug);
      if (fs.existsSync(newDir)) return res.status(409).json({ error: `Desain "${newSlug}" udah ada. Pakai nama lain.` });
      fs.renameSync(dir, newDir);
      target = newDir;
    }

    const html = req.files?.html?.[0];
    if (html) {
      if (!/\.html$/i.test(html.originalname)) return res.status(400).json({ error: 'File harus berekstensi .html.' });
      fs.writeFileSync(path.join(target, 'index.html'), html.buffer);
    }

    let screenshot = null;
    const shot = req.files?.screenshot?.[0];
    if (shot) {
      const ext = path.extname(shot.originalname).toLowerCase();
      if (!/\.(png|jpe?g|webp)$/.test(ext)) return res.status(400).json({ error: 'Screenshot harus .png/.jpg/.jpeg/.webp.' });
      const old = fs.readdirSync(target).find(f => /^screenshot\.(png|jpe?g|webp)$/i.test(f));
      if (old) fs.unlinkSync(path.join(target, old));
      fs.writeFileSync(path.join(target, 'screenshot' + ext), shot.buffer);
      screenshot = 'screenshot' + ext;
    }

    fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify({ name, description, tags }, null, 2));
    screenshot = screenshot || fs.readdirSync(target).find(f => /^screenshot\.(png|jpe?g|webp)$/i.test(f)) || null;
    res.json({ name, description, tags, screenshot, url: `/designs/${newSlug}/index.html` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal update desain.' });
  }
});

// ---- DELETE /api/designs/:slug — hapus desain ----
app.delete('/api/designs/:slug', (req, res) => {
  const slug = req.params.slug;
  const dir = path.resolve(DESIGNS, slug);
  if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: 'Slug invalid.' });
  if (!dir.startsWith(path.resolve(DESIGNS))) return res.status(400).json({ error: 'Path invalid.' });
  if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Desain gak ketemu.' });
  fs.rmSync(dir, { recursive: true, force: true });
  res.json({ ok: true });
});

// ---- Static ----
app.use(express.static(path.join(__dirname, 'public')));
app.use('/designs', express.static(DESIGNS));

// ---- Listen + auto-open browser ----
const server = app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`on-sight → ${url}`);
  if (process.platform === 'win32') exec(`start "" "${url}"`);
  else if (process.platform === 'darwin') exec(`open "${url}"`);
  else exec(`xdg-open "${url}"`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} kepake. Matiin app lain atau set PORT env: pnpm env PORT=xxxx ...`);
    process.exit(1);
  }
  throw e;
});
