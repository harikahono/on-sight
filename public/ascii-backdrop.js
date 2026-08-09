// on-sight ASCII backdrop — live grayscale ASCII dari ascii-source.jpg
// gaya: particle sway + mouse repel, monokrom biar kelihatan "alat ukur"
(() => {
  const wrap = document.getElementById('ascii-backdrop');
  const canvas = document.getElementById('ascii-canvas');
  const src = document.getElementById('ascii-source');
  const ctx = canvas.getContext('2d');
  if (!wrap || !canvas || !src) return;

  const cfg = {
    fontSize: 10,
    detail: 55,       // 100 = natural, > = makin detail
    contrast: 135,    // % — nilai asli dari embed generator
    brightness: 145,  // % — nilai asli dari embed generator
    mouseRadius: 60,
    intensity: 10,
    persistence: 0.97,
    returnSpeed: 0.45,
    jiggle: 0.4,
    frameSkip: 2,     // render tiap 2 rAF ≈ 30fps — 60fps full render kegedean, bikin lag
  };
  const chars = ' .:-=+*#%@';
  // reduced-motion: render 1x statis, gak ada loop/jiggle/mouse — biar layar tenang
  const motionOK = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mouseX = -9999, mouseY = -9999;
  let parts = [], vel = [], orig = [], raf = 0, tick = 0;

  function canvasSize() {
    const w = wrap.clientWidth || innerWidth;
    const h = wrap.clientHeight || innerHeight;
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
  }

  function adj(v, p) { // brightness/contrast: p = % (100 = no-op)
    const f = p < 100 ? p / 100 * 1.2 : 1 + (p - 100) / 100 * 0.8;
    return Math.max(0, Math.min(255, 128 + f * (v - 128)));
  }

  function render() {
    if (++tick % cfg.frameSkip === 0) {
    canvasSize();
    const w = canvas.width, h = canvas.height;
    const cols = Math.max(20, Math.round((w / 1200) * cfg.detail * 3));
    const rows = Math.max(1, Math.ceil((h / 1200) * cfg.detail * 3));

    const t = document.createElement('canvas');
    t.width = cols; t.height = rows;
    const tc = t.getContext('2d');
    // cover-crop: gambar discale sampe penuh, sisanya kepotong rata tengah
    const nw = src.naturalWidth, nh = src.naturalHeight;
    const s = Math.max(cols / nw, rows / nh);
    const dw = nw * s, dh = nh * s;
    tc.drawImage(src, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
    const img = tc.getImageData(0, 0, cols, rows).data;

    const fx = w / cols, fy = h / rows; // cell persegi: cols & rows dari skala sama
    if (!parts.length) {
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        parts.push({ x: x * fx + fx / 2, y: y * fy + fy / 2 });
        vel.push({ x: 0, y: 0 });
        orig.push({ x: x * fx + fx / 2, y: y * fy + fy / 2 });
      }
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgb(18, 19, 21)'; // dasar solid biar ASCII kerasa full-frame, gak nyatu sama void
    ctx.fillRect(0, 0, w, h);
    ctx.font = cfg.fontSize + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let i = 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const p = (y * cols + x) * 4;
      const lum = (0.299 * adj(img[p], cfg.brightness) + 0.587 * adj(img[p + 1], cfg.brightness) + 0.114 * adj(img[p + 2], cfg.brightness)) / 255;
      const lum2 = Math.max(0, Math.min(1, (128 + cfg.contrast * (lum * 255 - 128) / 100) / 255));
      const ch = chars[Math.min(chars.length - 1, Math.floor(lum2 * chars.length))];

      // physics: jiggle + return spring + mouse repel (statis kalau reduced-motion)
      const pt = parts[i];
      if (motionOK) {
        pt.x += (Math.random() - 0.5) * cfg.jiggle;
        pt.y += (Math.random() - 0.5) * cfg.jiggle;
        vel[i].x *= cfg.persistence;
        vel[i].y *= cfg.persistence;
        const dx = orig[i].x - pt.x, dy = orig[i].y - pt.y;
        vel[i].x += dx * cfg.returnSpeed;
        vel[i].y += dy * cfg.returnSpeed;
        const mdx = pt.x - mouseX, mdy = pt.y - mouseY;
        const md = Math.hypot(mdx, mdy);
        if (md < cfg.mouseRadius && md > 0.01) {
          const f = (cfg.mouseRadius - md) / cfg.mouseRadius * cfg.intensity * 0.08;
          vel[i].x += (mdx / md) * f;
          vel[i].y += (mdy / md) * f;
        }
        pt.x += vel[i].x;
        pt.y += vel[i].y;
      }

      const gray = Math.round(lum2 * 255);
      ctx.fillStyle = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
      ctx.fillText(ch, pt.x, pt.y);
      i++;
    }
    }
    if (motionOK) raf = requestAnimationFrame(render);
  }

  window.addEventListener('resize', () => { parts = []; vel = []; orig = []; });
  window.addEventListener('mousemove', (e) => { if (!motionOK) return; mouseX = e.clientX; mouseY = e.clientY; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(render);
  });

  if (src.complete) render();
  else src.addEventListener('load', render);
})();
