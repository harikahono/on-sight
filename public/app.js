// on-sight dashboard — render, Cmd+K, polling, upload
(() => {
  const $ = (sel) => document.querySelector(sel);
  const grid = $('#grid');
  const empty = $('#empty');
  const count = $('#grid-count');
  const search = $('#search');
  const modal = $('#modal');
  const form = $('#form-add');
  const formError = $('#form-error');
  const btnSubmit = $('#btn-submit');

  let designs = [];
  let filter = '';
  let editSlug = null;

  // ---------- Render ----------
  function card(d) {
    const slug = d.url.split('/')[2];
    const iconEdit = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
    const iconTrash = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    const actions = `<div class="card-actions">
      <button class="card-btn" data-slug="${slug}" data-act="edit" title="Edit" aria-label="Edit">${iconEdit}</button>
      <button class="card-btn card-btn-danger" data-slug="${slug}" data-act="del" title="Hapus" aria-label="Hapus">${iconTrash}</button>
    </div>`;
    const shot = d.screenshot
      ? `<div class="card-shot"><img src="/designs/${slug}/${d.screenshot}" alt="" loading="lazy">${actions}</div>`
      : `<div class="card-shot card-shot-fallback">${d.name.slice(0, 1).toUpperCase()}${actions}</div>`;
    const tags = d.tags.map(t => `<span class="badge">${escapeHtml(t)}</span>`).join('');
    return `<article class="card" data-url="${d.url}">
      ${shot}
      <div class="card-body">
        <h3 class="card-name" title="${escapeHtml(d.name)}">${escapeHtml(d.name)}</h3>
        ${d.description ? `<p class="card-desc">${escapeHtml(d.description)}</p>` : ''}
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
      </div>
    </article>`;
  }

  function render() {
    const q = filter.toLowerCase();
    const list = designs.filter(d =>
      !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.tags.some(t => t.toLowerCase().includes(q))
    );
    grid.innerHTML = list.map(card).join('');
    empty.hidden = designs.length > 0;
    count.textContent = `${list.length} / ${designs.length}`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Data ----------
  let lastSig = ''; // anti-flicker: polling gak boleh re-render kalau data sama
  async function refresh() {
    try {
      const res = await fetch('/api/designs');
      if (!res.ok) return;
      const data = await res.json();
      const sig = JSON.stringify(data);
      if (sig === lastSig) return; // gak ada perubahan — skip render
      lastSig = sig;
      designs = data;
      render();
    } catch { /* server mati, biarin */ }
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (btn) {
      if (btn.dataset.act === 'edit') openModal(btn.dataset.slug);
      else deleteDesign(btn.dataset.slug);
      return;
    }
    const card = e.target.closest('.card');
    if (card) window.open(card.dataset.url, '_blank');
  });

  // ---------- Hapus ----------
  async function deleteDesign(slug) {
    if (!confirm('Hapus desain ini? Gak bisa di-undo.')) return;
    const res = await fetch('/api/designs/' + slug, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Gagal hapus desain.');
      return;
    }
    await refresh();
  }

  // ---------- Search / Cmd+K ----------
  search.addEventListener('input', () => { filter = search.value.trim(); render(); });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      search.focus();
      search.select();
    }
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  // ---------- Modal ----------
  function openModal(slug) {
    editSlug = slug || null;
    form.reset();
    formError.hidden = true;
    form.querySelectorAll('.drop-file').forEach(el => el.textContent = '');
    $('#modal-title').textContent = slug ? 'Edit Desain' : 'Tambah Desain';
    btnSubmit.textContent = slug ? 'Simpan Perubahan' : 'Simpan Desain';
    form.html.required = !slug; // edit: file opsional, cuma ganti kalau ada
    if (slug) {
      const d = designs.find(x => x.url.split('/')[2] === slug);
      if (d) {
        form.elements.name.value = d.name;
        form.description.value = d.description;
        form.tags.value = d.tags.join(', ');
      }
    }
    modal.hidden = false;
    form.elements.name.focus();
  }
  function closeModal() { modal.hidden = true; }

  $('#btn-add').addEventListener('click', openModal);
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));

  form.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', () => {
      const label = input.closest('.drop');
      label.querySelector('.drop-file').textContent = input.files[0] ? input.files[0].name : '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Menyimpan…';
    formError.hidden = true;

    const fd = new FormData(form);
    try {
      const url = editSlug ? '/api/designs/' + editSlug : '/api/designs';
      const res = await fetch(url, { method: editSlug ? 'PUT' : 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal simpan.');
      closeModal();
      await refresh();
    } catch (err) {
      formError.textContent = err.message;
      formError.hidden = false;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = editSlug ? 'Simpan Perubahan' : 'Simpan Desain';
    }
  });

  // ---------- Polling ----------
  refresh();
  setInterval(refresh, 3000); // ponytail: polling dulu, fs.watch+SSE kalau kerasa berat
})();
