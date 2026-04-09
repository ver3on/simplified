// ─── State ───────────────────────────────────────────────────────────────────
let dragSrcId = null;
let dragSrcTable = null;
let currentData = {};
let deleteCallback = null;
let editingSample = null;
let editingArtist = null;
let editingTestimonial = null;
let ratesData = null;

// ─── SVG icons ────────────────────────────────────────────────────────────────
const iconEdit = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>`;
const iconDelete = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

// ─── API helper ───────────────────────────────────────────────────────────────
async function api(action, data = {}) {
  const pwd = document.getElementById('pw-input').value;
  const res = await fetch('/.netlify/functions/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pwd, action, ...data })
  });
  if (!res.ok) throw new Error('API error ' + res.status);
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function login() {
  const btn = document.getElementById('login-btn');
  btn.textContent = '...';
  btn.disabled = true;
  try {
    const res = await fetch('/.netlify/functions/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('pw-input').value })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-screen').style.display = 'block';
      loadAllData();
    } else {
      const err = document.getElementById('login-error');
      err.textContent = 'Incorrect password';
      err.style.display = 'block';
      setTimeout(() => { err.style.display = 'none'; }, 2500);
    }
  } catch(e) {
    const err = document.getElementById('login-error');
    err.textContent = 'Connection error — try again';
    err.style.display = 'block';
    setTimeout(() => { err.style.display = 'none'; }, 2500);
  }
  btn.textContent = 'Enter';
  btn.disabled = false;
}

function togglePassword() {
  const input = document.getElementById('pw-input');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function logout() {
  document.getElementById('admin-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('pw-input').value = '';
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function closeAllDrops() {
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
}

function toggleDropdown(id, pill) {
  const drop = document.getElementById(id);
  const isOpen = drop.classList.contains('open');
  closeAllDrops();
  if (!isOpen) { drop.classList.add('open'); pill.classList.add('active'); }
}

function showTab(name, pill) {
  closeAllDrops();
  if (pill) pill.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
}

function toggleAccordion(id) {
  const body = document.getElementById(id);
  if (body) body.classList.toggle('open');
}

function toggleCard(id) {
  document.getElementById(id).classList.toggle('collapsed');
}

function selectSub(name, parentPillId, e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const pill = document.getElementById(parentPillId);
  showTab(name, pill);
}

function selectSubScroll(tabName, parentPillId, scrollToId, accordionId, e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const pill = document.getElementById(parentPillId);
  showTab(tabName, pill);
  setTimeout(() => {
    if (accordionId) {
      const acc = document.getElementById(accordionId);
      if (acc && !acc.classList.contains('open')) acc.classList.add('open');
    }
    const el = document.getElementById(scrollToId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

document.addEventListener('click', e => {
  if (!e.target.closest('.nav-pill') && !e.target.closest('.nav-dropdown')) closeAllDrops();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showDeleteModal(title, desc, onConfirm) {
  document.getElementById('delete-title').textContent = title;
  document.getElementById('delete-desc').textContent = desc;
  document.getElementById('delete-modal').classList.add('active');
  deleteCallback = onConfirm;
}
function cancelDelete() {
  document.getElementById('delete-modal').classList.remove('active');
  deleteCallback = null;
}
function confirmDelete() { if (deleteCallback) deleteCallback(); cancelDelete(); }

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatRelativeTime(iso) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
  return formatDate(iso);
}

function previewThumb(inputId, previewId) {
  const val = document.getElementById(inputId).value;
  const preview = document.getElementById(previewId);
  const match = val.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
  if (match) {
    preview.innerHTML = `<img src="https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg" onerror="this.parentElement.textContent='Could not load thumbnail'">`;
  } else {
    preview.textContent = 'Paste link to preview';
  }
}

// ─── Overview ─────────────────────────────────────────────────────────────────
async function loadOverview() {
  try {
    const [stats, activity, settings] = await Promise.all([
      api('get-stats'),
      api('get-activity', { limit: 10 }),
      api('get-settings')
    ]);
    document.getElementById('stat-visits').textContent = stats.monthlyVisits || 0;
    document.getElementById('stat-page').textContent = stats.topPage || '—';
    document.getElementById('stat-click').textContent = stats.topClick || '—';

    const actList = document.getElementById('activity-list');
    actList.innerHTML = (activity && activity.length)
      ? activity.map(a => `<div class="activity-item"><span class="activity-time">${formatRelativeTime(a.created_at)}</span><span class="activity-text">${escapeHtml(a.action)}</span></div>`).join('')
      : '<div class="empty-trash">No recent activity</div>';

    const testiCount = (currentData.testimonials || []).filter(t => !t.deleted && !t.draft).length;
    const testiVisible = settings && settings.find(s => s.key === 'testimonials_visible')?.value === 'true';
    const rem = document.getElementById('testi-reminder');
    if (testiCount > 0 && !testiVisible) {
      rem.classList.add('visible');
      document.getElementById('testi-reminder-text').textContent = `${testiCount} testimonial${testiCount > 1 ? 's' : ''} saved — section hidden`;
    } else { rem.classList.remove('visible'); }
  } catch(e) { console.error('loadOverview', e); }
}

// ─── Samples ──────────────────────────────────────────────────────────────────
async function loadSamples() {
  try {
    const [samples, trash] = await Promise.all([
      api('get-samples'),
      api('get-trash', { table: 'samples' })
    ]);
    currentData.samples = samples;

    const list = document.getElementById('samples-list');
    const active = (samples || []).filter(s => !s.deleted).sort((a,b) => a.sort_order - b.sort_order);
    list.innerHTML = active.length
      ? active.map(s => `
        <div class="entry-item" data-id="${s.id}" draggable="true" ondragstart="dragStart(event,'${s.id}','samples')" ondragover="dragOver(event)" ondrop="dragDrop(event,'samples')" style="cursor:grab;">
          <div class="entry-item-left">
            <div class="entry-item-type">${escapeHtml(s.type || 'Sample')}</div>
            <div class="entry-item-title">${escapeHtml(s.title)}</div>
          </div>
          ${s.draft ? '<span class="entry-draft">Draft</span>' : ''}
          <div class="entry-actions">
            ${s.draft ? `<button class="entry-btn-sm" onclick="publishSample('${s.id}')">Publish</button>` : ''}
            <button class="entry-btn-sm" onclick="editSample('${s.id}')">${iconEdit}</button>
            <button class="entry-btn-sm danger" onclick="deleteSample('${s.id}')">${iconDelete}</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No samples yet</div>';

    document.getElementById('samples-trash').innerHTML = (trash && trash.length)
      ? trash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data && t.data.title)}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','samples')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) {
    document.getElementById('samples-list').innerHTML = '<div class="loading-state">Error loading</div>';
    console.error('loadSamples', e);
  }
}

function newSample() {
  editingSample = null;
  document.getElementById('card-samples').classList.remove('collapsed');
  document.getElementById('sample-form-title').textContent = 'Add Sample';
  ['s-type','s-title','s-episode','s-link','s-thumb-url'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('s-thumb').textContent = 'Paste link to preview';
  document.getElementById('sample-form').classList.add('open');
  document.getElementById('btn-sample').style.display = 'none';
}

function cancelEditSample() {
  editingSample = null;
  document.getElementById('sample-form').classList.remove('open');
  document.getElementById('btn-sample').style.display = 'block';
}

function editSample(id) {
  const s = (currentData.samples || []).find(x => x.id === id);
  if (!s) return;
  editingSample = id;
  document.getElementById('sample-form-title').textContent = 'Edit Sample';
  document.getElementById('s-type').value = s.type || '';
  document.getElementById('s-title').value = s.title || '';
  document.getElementById('s-episode').value = s.episode || '';
  document.getElementById('s-link').value = s.link || '';
  const sThumbUrl = document.getElementById('s-thumb-url'); if (sThumbUrl) sThumbUrl.value = s.thumb || '';
  previewThumb('s-link', 's-thumb');
  document.getElementById('sample-form').classList.add('open');
  document.getElementById('btn-sample').style.display = 'none';
}

async function saveSample(draft = false) {
  const data = {
    type: document.getElementById('s-type').value,
    title: document.getElementById('s-title').value,
    episode: document.getElementById('s-episode').value,
    link: document.getElementById('s-link').value,
    thumb: document.getElementById('s-thumb-url')?.value || null,
    draft
  };
  try {
    if (editingSample) {
      await api('update-sample', { id: editingSample, data });
    } else {
      await api('save-sample', { data });
    }
    cancelEditSample();
    loadSamples();
    loadOverview();
  } catch(e) { alert('Error saving'); }
}

async function publishSample(id) {
  try { await api('update-sample', { id, data: { draft: false } }); loadSamples(); }
  catch(e) { alert('Error publishing'); }
}

function deleteSample(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-sample', { id }).then(() => { loadSamples(); loadTrash(); loadOverview(); });
  });
}

// ─── Artists ──────────────────────────────────────────────────────────────────
async function loadArtists() {
  try {
    const [artists, trash] = await Promise.all([
      api('get-artist-samples'),
      api('get-trash', { table: 'artist_samples' })
    ]);
    currentData.artists = artists;

    const list = document.getElementById('artist-list');
    const active = (artists || []).filter(a => !a.deleted).sort((a,b) => a.sort_order - b.sort_order);
    list.innerHTML = active.length
      ? active.map(a => `
        <div class="entry-item" data-id="${a.id}" draggable="true" ondragstart="dragStart(event,'${a.id}','artist_samples')" ondragover="dragOver(event)" ondrop="dragDrop(event,'artist_samples')" style="cursor:grab;">
          <div class="entry-item-left">
            <div class="entry-item-type">${escapeHtml(a.type || 'Feature')}</div>
            <div class="entry-item-title">${escapeHtml(a.title)}</div>
          </div>
          ${a.draft ? '<span class="entry-draft">Draft</span>' : ''}
          <div class="entry-actions">
            ${a.draft ? `<button class="entry-btn-sm" onclick="publishArtist('${a.id}')">Publish</button>` : ''}
            <button class="entry-btn-sm" onclick="editArtist('${a.id}')">${iconEdit}</button>
            <button class="entry-btn-sm danger" onclick="deleteArtist('${a.id}')">${iconDelete}</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No features yet</div>';

    document.getElementById('artist-trash').innerHTML = (trash && trash.length)
      ? trash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data && t.data.title)}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','artist_samples')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) {
    document.getElementById('artist-list').innerHTML = '<div class="loading-state">Error loading</div>';
    console.error('loadArtists', e);
  }
}

function newArtist() {
  editingArtist = null;
  document.getElementById('card-artists').classList.remove('collapsed');
  document.getElementById('artist-form-title').textContent = 'Add Feature';
  ['a-type','a-title','a-episode','a-link','a-thumb-url'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('a-thumb').textContent = 'Paste link to preview';
  document.getElementById('artist-form').classList.add('open');
  document.getElementById('btn-artist').style.display = 'none';
}

function cancelEditArtist() {
  editingArtist = null;
  document.getElementById('artist-form').classList.remove('open');
  document.getElementById('btn-artist').style.display = 'block';
}

function editArtist(id) {
  const a = (currentData.artists || []).find(x => x.id === id);
  if (!a) return;
  editingArtist = id;
  document.getElementById('artist-form-title').textContent = 'Edit Feature';
  document.getElementById('a-type').value = a.type || '';
  document.getElementById('a-title').value = a.title || '';
  document.getElementById('a-episode').value = a.episode || '';
  document.getElementById('a-link').value = a.link || '';
  const aThumbUrl = document.getElementById('a-thumb-url'); if (aThumbUrl) aThumbUrl.value = a.thumb || '';
  previewThumb('a-link', 'a-thumb');
  document.getElementById('artist-form').classList.add('open');
  document.getElementById('btn-artist').style.display = 'none';
}

async function saveArtist(draft = false) {
  const data = {
    type: document.getElementById('a-type').value,
    title: document.getElementById('a-title').value,
    episode: document.getElementById('a-episode').value,
    link: document.getElementById('a-link').value,
    thumb: document.getElementById('a-thumb-url')?.value || null,
    draft
  };
  try {
    if (editingArtist) {
      await api('update-artist-sample', { id: editingArtist, data });
    } else {
      await api('save-artist-sample', { data });
    }
    cancelEditArtist();
    loadArtists();
  } catch(e) { alert('Error saving'); }
}

async function publishArtist(id) {
  try { await api('update-artist-sample', { id, data: { draft: false } }); loadArtists(); }
  catch(e) { alert('Error publishing'); }
}

function deleteArtist(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-artist-sample', { id }).then(() => { loadArtists(); loadTrash(); });
  });
}

// ─── Trash ────────────────────────────────────────────────────────────────────
async function loadTrash() {
  try {
    const [sTrash, aTrash, tTrash, thTrash, gdTrash] = await Promise.all([
      api('get-trash', { table: 'samples' }),
      api('get-trash', { table: 'artist_samples' }),
      api('get-trash', { table: 'testimonials' }),
      api('get-trash', { table: 'thumbnails' }),
      api('get-trash', { table: 'graphic_designs' })
    ]);

    document.getElementById('samples-trash').innerHTML = (sTrash && sTrash.length)
      ? sTrash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data && t.data.title)}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','samples')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';

    document.getElementById('artist-trash').innerHTML = (aTrash && aTrash.length)
      ? aTrash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data && t.data.title)}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','artist_samples')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';

    document.getElementById('testimonials-trash').innerHTML = (tTrash && tTrash.length)
      ? tTrash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">@${escapeHtml(t.data && t.data.name)}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','testimonials')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
     document.getElementById('thumbnails-trash').innerHTML = (thTrash && thTrash.length)
      ? thTrash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data && t.data.title)}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','thumbnails')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';

    document.getElementById('graphic-trash').innerHTML = (gdTrash && gdTrash.length)
      ? gdTrash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">Graphic Design</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','graphic_designs')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) { console.error('loadTrash', e); }
}

async function restoreItem(trashId, table) {
  try {
    await api('restore-from-trash', { trashId, table });
    loadSamples(); loadArtists(); loadTestimonials(); loadThumbs(); loadGraphics(); loadWorks(); loadTrash();
  } catch(e) { alert('Error restoring'); }
}

async function permanentDelete(trashId) {
  showDeleteModal('Permanently delete?', 'This cannot be undone.', () => {
    api('permanent-delete', { trashId }).then(() => {
      loadSamples(); loadArtists(); loadTestimonials(); loadThumbs(); loadGraphics(); loadWorks(); loadTrash();
    });
  });
}

// ─── Rates ────────────────────────────────────────────────────────────────────
async function loadRates() {
  try {
    const rates = await api('get-rates');
    ratesData = rates;
    const container = document.getElementById('rates-container');
    const services = (rates && rates.services) ? rates.services : [];
    if (!services.length) {
      container.innerHTML = '<div class="loading-state">No rate data — save rates from your rates-data.js first</div>';
      return;
    }
    container.innerHTML = services.map((svc, idx) => `
      <div class="rates-service">
        <div class="rates-service-header">
          <div class="rates-service-name">${escapeHtml(svc.title)}</div>
        </div>
        ${(svc.tiers || []).map((tier, tidx) => `
          <div class="rates-tier">
            <div class="rates-tier-name">${escapeHtml(tier.name)}</div>
            <input type="text" id="rate-${idx}-${tidx}" value="${escapeHtml(String(tier.price ?? ''))}" onchange="updateRate(${idx},${tidx},this.value)">
            <span class="rates-tier-unit">${escapeHtml(tier.unit || '')}</span>
          </div>`).join('')}
      </div>`).join('');
  } catch(e) {
    document.getElementById('rates-container').innerHTML = '<div class="loading-state">Error loading rates</div>';
    console.error('loadRates', e);
  }
}

function updateRate(svcIdx, tierIdx, value) {
  if (ratesData && ratesData.services) ratesData.services[svcIdx].tiers[tierIdx].price = value;
}

async function saveRates() {
  try { await api('save-rates', { data: ratesData }); alert('Rates saved'); }
  catch(e) { alert('Error saving rates'); }
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
async function loadTestimonials() {
  try {
    const testimonials = await api('get-testimonials');
    currentData.testimonials = testimonials;

    const list = document.getElementById('testimonials-list');
    const active = (testimonials || []).filter(t => !t.deleted);
    list.innerHTML = active.length
      ? active.map(t => `
        <div class="testimonial-item">
          <div class="testimonial-quote">"${escapeHtml(t.quote)}"</div>
          <div class="testimonial-meta">
            <div>
              <div class="testimonial-name">@${escapeHtml(t.name)}</div>
              <div class="testimonial-ctx">${escapeHtml(t.context || '')}</div>
            </div>
            <div class="entry-actions">
              ${t.draft ? '<span class="entry-draft">Draft</span>' : ''}
              <button class="entry-btn-sm" onclick="editTestimonial('${t.id}')">${iconEdit}</button>
              <button class="entry-btn-sm danger" onclick="deleteTestimonial('${t.id}')">${iconDelete}</button>
            </div>
          </div>
        </div>`).join('')
      : '<div class="empty-trash" style="padding:40px;">No testimonials yet</div>';

    loadTrash();

    try {
      const settings = await api('get-settings');
      const visible = settings && settings.find(s => s.key === 'testimonials_visible')?.value === 'true';
      const savedCount = (testimonials || []).filter(t => !t.deleted && !t.draft).length;
      const banner = document.getElementById('testi-visible-reminder');
      banner.style.display = (savedCount > 0 && !visible) ? 'flex' : 'none';
      if (savedCount > 0 && !visible) {
        document.getElementById('testi-visible-text').textContent = `${savedCount} testimonial${savedCount > 1 ? 's' : ''} saved — section hidden`;
      }
    } catch(e) {}
  } catch(e) {
    document.getElementById('testimonials-list').innerHTML = '<div class="loading-state">Error loading</div>';
    console.error('loadTestimonials', e);
  }
}

function newTestimonial() {
  editingTestimonial = null;
  document.getElementById('testi-form-title').textContent = 'Add Testimonial';
  ['t-quote','t-name','t-ctx'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('testi-form').classList.add('open');
  document.getElementById('btn-testi').style.display = 'none';
}

function cancelEditTestimonial() {
  editingTestimonial = null;
  document.getElementById('testi-form').classList.remove('open');
  document.getElementById('btn-testi').style.display = 'block';
}

function editTestimonial(id) {
  const t = (currentData.testimonials || []).find(x => x.id === id);
  if (!t) return;
  editingTestimonial = id;
  document.getElementById('testi-form-title').textContent = 'Edit Testimonial';
  document.getElementById('t-quote').value = t.quote || '';
  document.getElementById('t-name').value = t.name || '';
  document.getElementById('t-ctx').value = t.context || '';
  document.getElementById('testi-form').classList.add('open');
  document.getElementById('btn-testi').style.display = 'none';
}

async function saveTestimonial(draft = false) {
  const data = {
    quote: document.getElementById('t-quote').value,
    name: document.getElementById('t-name').value,
    context: document.getElementById('t-ctx').value,
    draft
  };
  try {
    if (editingTestimonial) {
      await api('update-testimonial', { id: editingTestimonial, data });
    } else {
      await api('save-testimonial', { data });
    }
    cancelEditTestimonial();
    loadTestimonials();
    loadOverview();
  } catch(e) { alert('Error saving'); }
}

function deleteTestimonial(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-testimonial', { id }).then(() => { loadTestimonials(); loadTrash(); });
  });
}

// ─── Visitor Log ──────────────────────────────────────────────────────────────
async function loadVisitors() {
  try {
    const visitors = await api('get-visitors');
    const tbody = document.getElementById('visitors-tbody');
    tbody.innerHTML = (visitors && visitors.length)
      ? visitors.map((v, i) => `
        <tr>
          <td style="color:var(--muted)">#${visitors.length - i}</td>
          <td>${v.country || 'Unknown'}</td>
          <td class="log-pages">${formatDate(v.visited_at)}</td>
          <td>${v.duration || '—'}</td>
          <td class="log-pages">${(v.pages || []).join(' → ')}</td>
          <td class="log-links">${(v.clicked || []).join(', ') || '—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="loading-state">No visits yet</td></tr>';
  } catch(e) {
    document.getElementById('visitors-tbody').innerHTML = '<tr><td colspan="6" class="loading-state">Error loading</td></tr>';
  }
}

function exportVisitors() {
  api('get-visitors').then(visitors => {
    const csv = [
      ['Visit #','Country','Date','Duration','Pages','Clicked'].join(','),
      ...(visitors || []).map((v, i) => [
        visitors.length - i, v.country, v.visited_at, v.duration || '',
        (v.pages || []).join(';'), (v.clicked || []).join(';')
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  });
}

// ─── Pitch Tracker ────────────────────────────────────────────────────────────
async function loadPitches() {
  try {
    const pitches = await api('get-pitches');
    const list = document.getElementById('pitches-list');
    if (!pitches || !pitches.length) {
        list.innerHTML = '<div class="empty-trash">No pitches yet</div>';
        return;
    }
    const active = pitches.filter(p => p.status !== 'archived');
    const archived = pitches.filter(p => p.status === 'archived');
    list.innerHTML = (active.length ? active : []).map(p => {
    const daysAgo = Math.floor((Date.now() - new Date(p.created_at)) / 86400000);
      return `
        <div class="pitch-item">
          <div class="pitch-top">
            <div>
              <div class="pitch-name">@${escapeHtml(p.handle)}</div>
              <div class="pitch-platform">${escapeHtml(p.platform)} · ${formatDate(p.created_at)}</div>
            </div>
            <div class="pitch-date">${daysAgo === 0 ? 'Today' : daysAgo + ' days ago'}</div>
          </div>
          <div class="ref-link-box">
            <span>https://1nq3qr9l-8888.asse.devtunnels.ms/?r=${escapeHtml(p.ref_code)}</span>
            <span style="color:var(--accent);cursor:pointer;" onclick="navigator.clipboard.writeText('https://1nq3qr9l-8888.asse.devtunnels.ms/?r=${escapeHtml(p.ref_code)}')">Copy</span>
          </div>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="pitch-status ${p.status}" style="margin-top:0;">${p.status.replace('_',' ')}</span>
            <select onchange="updatePitchStatus('${p.id}',this.value)" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:4px 8px;color:var(--text);font-size:0.6rem;letter-spacing:0.06em;text-transform:uppercase;height:22px;cursor:pointer;">
              <option value="pending"${p.status==='pending'?' selected':''}>Pending</option>
              <option value="opened"${p.status==='opened'?' selected':''}>Opened</option>
              <option value="replied"${p.status==='replied'?' selected':''}>Replied</option>
              <option value="booked"${p.status==='booked'?' selected':''}>Booked</option>
              <option value="passed"${p.status==='passed'?' selected':''}>Passed</option>
              <option value="archived"${p.status==='archived'?' selected':''}>Archived</option>
            </select>
            <button class="entry-btn-sm" onclick="archivePitch('${p.id}')" style="margin-left:auto;">Archive</button>
            <button class="entry-btn-sm danger" onclick="deletePitch('${p.id}')">Delete</button>
          </div>
        </div>`;
    }).join('');

  if (archived.length) {
    list.innerHTML += `
      <div style="margin-top:10px;">
        <button class="entry-btn-sm" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.textContent=this.textContent.includes('Show')?'Hide Archived (${archived.length})':'Show Archived (${archived.length})'">Show Archived (${archived.length})</button>
        <div style="display:none;margin-top:6px;">
          ${archived.map(p => `
            <div class="pitch-item" style="opacity:0.5;">
              <div class="pitch-top">
                <div>
                  <div class="pitch-name">@${escapeHtml(p.handle)}</div>
                  <div class="pitch-platform">${escapeHtml(p.platform)} · ${formatDate(p.created_at)}</div>
                </div>
                <span class="pitch-status" style="background:rgba(122,117,112,0.1);color:var(--muted);border:1px solid var(--border);">archived</span>
              </div>
              <div class="ref-link-box">
                <span>https://1nq3qr9l-8888.asse.devtunnels.ms/?r=${escapeHtml(p.ref_code)}</span>
              </div>
              <div style="margin-top:6px;display:flex;gap:6px;">
                <button class="entry-btn-sm" onclick="updatePitchStatus('${p.id}','pending')">Unarchive</button>
                <button class="entry-btn-sm danger" onclick="deletePitch('${p.id}')">Delete</button>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  } catch(e) {
    document.getElementById('pitches-list').innerHTML = '<div class="empty-trash">No pitches yet</div>';
    console.error('loadPitches', e);
  }
}

async function generatePitch() {
  const handle = document.getElementById('p-handle').value.trim();
  const platform = document.getElementById('p-platform').value;
  if (!handle) return alert('Enter a handle');
  const refCode = Math.random().toString(36).substring(2, 6);
  try {
    await api('save-pitch', { data: { handle, platform, ref_code: refCode, status: 'pending' } });
    document.getElementById('p-link').textContent = `https://1nq3qr9l-8888.asse.devtunnels.ms/?r=${refCode}`;
    document.getElementById('p-result').style.display = 'flex';
    loadPitches();
  } catch(e) { alert('Error creating pitch'); }
}

async function updatePitchStatus(id, status) {
  try { await api('update-pitch', { id, data: { status } }); loadPitches(); }
  catch(e) { alert('Error updating'); }
}

async function archivePitch(id) {
  try { await api('update-pitch', { id, data: { status: 'archived' } }); loadPitches(); }
  catch(e) { alert('Error archiving'); }
}

function deletePitch(id) {
  showDeleteModal('Delete pitch?', 'This will permanently remove the pitch log.', () => {
    api('delete-pitch', { id }).then(() => loadPitches()).catch(() => alert('Error deleting'));
  });
}

function copyPitch() {
  navigator.clipboard.writeText(document.getElementById('p-link').textContent);
}

// ─── Toggles ──────────────────────────────────────────────────────────────────
async function loadToggles() {
  try {
    const settings = await api('get-settings');
    const avail = settings && settings.find(s => s.key === 'availability')?.value === 'available';
    const testi = settings && settings.find(s => s.key === 'testimonials_visible')?.value === 'true';

    document.getElementById('tog-avail').checked = avail;
    document.getElementById('status-avail').textContent = avail ? 'On' : 'Off';
    document.getElementById('status-avail').className = 'toggle-status ' + (avail ? 'on' : 'off');

    document.getElementById('tog-testi').checked = testi;
    document.getElementById('status-testi').textContent = testi ? 'On' : 'Off';
    document.getElementById('status-testi').className = 'toggle-status ' + (testi ? 'on' : 'off');
  } catch(e) { console.error('loadToggles', e); }
}

async function updateToggle(key, checkbox) {
  const value = key === 'availability'
    ? (checkbox.checked ? 'available' : 'unavailable')
    : (checkbox.checked ? 'true' : 'false');
  const statusId = key === 'availability' ? 'status-avail' : 'status-testi';
  document.getElementById(statusId).textContent = checkbox.checked ? 'On' : 'Off';
  document.getElementById(statusId).className = 'toggle-status ' + (checkbox.checked ? 'on' : 'off');
  try {
    await api('save-setting', { key, value });
    if (key === 'testimonials_visible') loadTestimonials();
  } catch(e) {
    checkbox.checked = !checkbox.checked;
    document.getElementById(statusId).textContent = checkbox.checked ? 'On' : 'Off';
    document.getElementById(statusId).className = 'toggle-status ' + (checkbox.checked ? 'on' : 'off');
    alert('Error saving setting');
  }
}

// ─── Notes ────────────────────────────────────────────────────────────────────
async function loadNotes() {
  try {
    const notes = await api('get-notes');
    const container = document.getElementById('notes-list');
    if (!notes || !notes.length) { container.innerHTML = ''; return; }
    container.innerHTML = notes.map(n => `
      <div class="note-card" id="note-${n.id}">
        <div class="note-card-text">${escapeHtml(n.text)}</div>
        <div class="note-card-meta">
          <span>${formatRelativeTime(n.created_at)}</span>
          <button class="note-card-delete" onclick="deleteNote('${n.id}')">Delete</button>
        </div>
      </div>`).join('');
  } catch(e) {}
}

async function saveNotes() {
  const content = document.getElementById('notes-content').value.trim();
  if (!content) return;
  try {
    await api('save-notes', { content });
    document.getElementById('notes-content').value = '';
    loadNotes();
  } catch(e) { alert('Error saving'); }
}

async function deleteNote(id) {
  try {
    await api('delete-note', { id });
    loadNotes();
  } catch(e) { alert('Error deleting'); }
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
async function clearActivity() {
  showDeleteModal('Clear activity log?', 'This permanently deletes all activity entries. Cannot be undone.', async () => {
    try {
      await api('clear-activity');
      loadFullActivity();
      loadOverview();
    } catch(e) { alert('Error clearing activity'); }
  });
}

async function loadFullActivity() {
  try {
    const activity = await api('get-activity', { limit: 50 });
    const container = document.getElementById('full-activity-list');
    container.innerHTML = (activity && activity.length)
      ? activity.map(a => `
        <div class="activity-item">
          <span class="activity-time">${formatRelativeTime(a.created_at)}</span>
          <span class="activity-text">${escapeHtml(a.action)}${a.details ? ` — ${escapeHtml(a.details)}` : ''}</span>
        </div>`).join('')
      : '<div class="empty-trash">No activity yet</div>';
  } catch(e) {}
}

// ─── Export backup ────────────────────────────────────────────────────────────
async function exportBackup() {
  try {
    const [samples, artists, testimonials, rates, notes] = await Promise.all([
      api('get-samples'), api('get-artist-samples'), api('get-testimonials'),
      api('get-rates'), api('get-notes')
    ]);
    const backup = {
      exported_at: new Date().toISOString(),
      samples: (samples || []).filter(s => !s.deleted),
      artist_samples: (artists || []).filter(a => !a.deleted),
      testimonials: (testimonials || []).filter(t => !t.deleted),
      rates, notes
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  } catch(e) { alert('Error exporting'); }
}

// ─── Thumbnails ───────────────────────────────────────────────────────────────
let editingThumb = null;

async function loadThumbs() {
  try {
    const [thumbs, trash] = await Promise.all([
      api('get-thumbnails'),
      api('get-trash', { table: 'thumbnails' })
    ]);
    currentData.thumbs = thumbs;

    const list = document.getElementById('thumb-list');
    const active = (thumbs || []).filter(t => !t.deleted).sort((a,b) => a.sort_order - b.sort_order);
    list.innerHTML = active.length
      ? active.map(t => `
        <div class="entry-item" data-id="${t.id}" draggable="true" ondragstart="dragStart(event,'${t.id}','thumbnails')" ondragover="dragOver(event)" ondrop="dragDrop(event,'thumbnails')" style="cursor:grab;">
          <div class="entry-item-left">
            <div class="entry-item-type">Thumbnail</div>
            <div class="entry-item-title">${escapeHtml(t.title)}</div>
          </div>
          ${t.draft ? '<span class="entry-draft">Draft</span>' : ''}
          <div class="entry-actions">
            ${t.draft ? `<button class="entry-btn-sm" onclick="publishThumb('${t.id}')">Publish</button>` : ''}
            <button class="entry-btn-sm" onclick="editThumb('${t.id}')">${iconEdit}</button>
            <button class="entry-btn-sm danger" onclick="deleteThumb('${t.id}')">${iconDelete}</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No thumbnails yet</div>';

    document.getElementById('thumbnails-trash').innerHTML = (trash && trash.length)
      ? trash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data && t.data.title)}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','thumbnails')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) {
    document.getElementById('thumb-list').innerHTML = '<div class="loading-state">Error loading</div>';
    console.error('loadThumbs', e);
  }
}

function newThumb() {
  editingThumb = null;
  document.getElementById('card-thumbs').classList.remove('collapsed');
  document.getElementById('thumb-form-title').textContent = 'Add Thumbnail';
  ['th-title','th-link','th-thumb-url'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('th-thumb').textContent = 'Upload image to preview';
  document.getElementById('thumb-form').classList.add('open');
  document.getElementById('btn-thumb').style.display = 'none';
}

function cancelEditThumb() {
  editingThumb = null;
  document.getElementById('thumb-form').classList.remove('open');
  document.getElementById('btn-thumb').style.display = 'block';
}

function editThumb(id) {
  const t = (currentData.thumbs || []).find(x => x.id === id);
  if (!t) return;
  editingThumb = id;
  document.getElementById('thumb-form-title').textContent = 'Edit Thumbnail';
  document.getElementById('th-title').value = t.title || '';
  const thLink = document.getElementById('th-link'); if (thLink) thLink.value = t.link || '';
  const thumbUrl = document.getElementById('th-thumb-url');
  if (thumbUrl) thumbUrl.value = t.thumb || '';
  if (t.thumb) document.getElementById('th-thumb').innerHTML = `<img src="${t.thumb}" onerror="this.parentElement.textContent='Could not load'">`;
  document.getElementById('thumb-form').classList.add('open');
  document.getElementById('btn-thumb').style.display = 'none';
}

async function saveThumb(draft = false) {
  const data = {
    title: document.getElementById('th-title').value,
    link: document.getElementById('th-link')?.value || null,
    thumb: document.getElementById('th-thumb-url')?.value || null,
    draft
  };
  try {
    if (editingThumb) {
      await api('update-thumbnail', { id: editingThumb, data });
    } else {
      await api('save-thumbnail', { data });
    }
    cancelEditThumb();
    loadThumbs();
  } catch(e) { alert('Error saving'); }
}

async function publishThumb(id) {
  try { await api('update-thumbnail', { id, data: { draft: false } }); loadThumbs(); }
  catch(e) { alert('Error publishing'); }
}

function deleteThumb(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-thumbnail', { id }).then(() => { loadThumbs(); loadTrash(); });
  });
}

// ─── Drag to Reorder ─────────────────────────────────────────────────────────
function dragStart(e, id, table) {
  dragSrcId = id;
  dragSrcTable = table;
  e.dataTransfer.effectAllowed = 'move';
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.style.borderColor = 'var(--accent)';
}

async function dragDrop(e, table) {
  e.preventDefault();
  e.currentTarget.style.borderColor = '';
  const targetId = e.currentTarget.dataset.id;
  if (!dragSrcId || dragSrcId === targetId || dragSrcTable !== table) return;

  const listKey = table === 'samples' ? 'samples' : table === 'artist_samples' ? 'artists' : table === 'thumbnails' ? 'thumbs' : table === 'works' ? 'works' : 'graphics';
  const items = [...(currentData[listKey] || [])].filter(x => !x.deleted).sort((a,b) => a.sort_order - b.sort_order);
  const srcIdx = items.findIndex(x => x.id === dragSrcId);
  const tgtIdx = items.findIndex(x => x.id === targetId);
  if (srcIdx === -1 || tgtIdx === -1) return;

  const reordered = [...items];
  const [moved] = reordered.splice(srcIdx, 1);
  reordered.splice(tgtIdx, 0, moved);

  await Promise.all(reordered.map((item, i) =>
    api(table === 'samples' ? 'update-sample' : table === 'artist_samples' ? 'update-artist-sample' : table === 'thumbnails' ? 'update-thumbnail' : table === 'works' ? 'update-work' : 'update-graphic-design', {
      id: item.id, data: { sort_order: i + 1 }
    })
  ));

  if (table === 'samples') loadSamples();
  else if (table === 'artist_samples') loadArtists();
  else if (table === 'thumbnails') loadThumbs();
  else if (table === 'works') loadWorks();
  else if (table === 'graphic_designs') loadGraphics();
}

// ─── Thumbnail Upload ─────────────────────────────────────────────────────────
const SUPABASE_URL = document.querySelector('meta[name="sb-url"]')?.content || '';
const SUPABASE_ANON = document.querySelector('meta[name="sb-anon"]')?.content || '';

async function uploadThumb(input, urlFieldId, previewId, bucket = 'thumbnails') {
  const file = input.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop();
  const filename = `thumb-${Date.now()}.${ext}`;
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await api('upload-thumb', { filename, fileBase64: base64, mimeType: file.type, bucket });
    document.getElementById(urlFieldId) && (document.getElementById(urlFieldId).value = res.publicUrl);
    document.getElementById(previewId).innerHTML = `<img src="${res.publicUrl}" onerror="this.parentElement.textContent='Could not load thumbnail'">`;
  } catch(e) {
    alert('Upload failed — check Supabase storage is set up');
    console.error(e);
  }
}

function syncThumbPreview(urlFieldId, previewId) {
  const val = document.getElementById(urlFieldId).value;
  const preview = document.getElementById(previewId);
  if (val) {
    preview.innerHTML = `<img src="${val}" onerror="this.parentElement.textContent='Could not load'">`;
  } else {
    preview.textContent = 'Paste link to preview';
  }
}

// ─── Works ────────────────────────────────────────────────────────────────────
async function loadWorks() {
  try {
    const [works, trash] = await Promise.all([
      api('get-works'),
      api('get-trash', { table: 'works' })
    ]);
    currentData.works = works;

    const list = document.getElementById('works-list');
    const active = (works || []).filter(w => !w.deleted).sort((a,b) => a.sort_order - b.sort_order);
    list.innerHTML = active.length
      ? active.map(w => `
        <div class="entry-item" data-id="${w.id}" draggable="true" ondragstart="dragStart(event,'${w.id}','works')" ondragover="dragOver(event)" ondrop="dragDrop(event,'works')" style="cursor:grab;">
          <div class="entry-item-left">
            <div class="entry-item-type">${escapeHtml(w.type || 'Work')}</div>
            <div class="entry-item-title">${escapeHtml(w.title || '(no title)')}${w.image ? '' : ' · no image'}</div>
          </div>
          ${w.draft ? '<span class="entry-draft">Draft</span>' : ''}
          <div class="entry-actions">
            ${w.draft ? `<button class="entry-btn-sm" onclick="publishWork('${w.id}')">Publish</button>` : ''}
            <button class="entry-btn-sm" onclick="editWork('${w.id}')">${iconEdit}</button>
            <button class="entry-btn-sm danger" onclick="deleteWork('${w.id}')">${iconDelete}</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No works yet</div>';

    document.getElementById('works-trash').innerHTML = (trash && trash.length)
      ? trash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data && t.data.title)}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','works')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) {
    document.getElementById('works-list').innerHTML = '<div class="loading-state">Error loading</div>';
    console.error('loadWorks', e);
  }
}

function newWork() {
  editingWork = null;
  document.getElementById('card-works').classList.remove('collapsed');
  document.getElementById('work-form-title').textContent = 'Add Work';
  ['w-type','w-title','w-desc','w-link','w-image-url'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('w-image-preview').textContent = 'Upload image to preview';
  document.getElementById('work-form').classList.add('open');
  document.getElementById('btn-work').style.display = 'none';
}

function cancelEditWork() {
  editingWork = null;
  document.getElementById('work-form').classList.remove('open');
  document.getElementById('btn-work').style.display = 'block';
}

function editWork(id) {
  const w = (currentData.works || []).find(x => x.id === id);
  if (!w) return;
  editingWork = id;
  document.getElementById('work-form-title').textContent = 'Edit Work';
  document.getElementById('w-type').value = w.type || '';
  document.getElementById('w-title').value = w.title || '';
  document.getElementById('w-desc').value = w.description || '';
  document.getElementById('w-link').value = w.link || '';
  const urlEl = document.getElementById('w-image-url'); if (urlEl) urlEl.value = w.image || '';
  if (w.image) document.getElementById('w-image-preview').innerHTML = `<img src="${w.image}" onerror="this.parentElement.textContent='Could not load'">`;
  document.getElementById('work-form').classList.add('open');
  document.getElementById('btn-work').style.display = 'none';
}

async function saveWork(draft = false) {
  const data = {
    type: document.getElementById('w-type').value || null,
    title: document.getElementById('w-title').value || null,
    description: document.getElementById('w-desc').value || null,
    link: document.getElementById('w-link').value || null,
    image: document.getElementById('w-image-url')?.value || null,
    draft
  };
  try {
    if (editingWork) {
      await api('update-work', { id: editingWork, data });
    } else {
      await api('save-work', { data });
    }
    cancelEditWork();
    loadWorks();
  } catch(e) { alert('Error saving'); }
}

async function publishWork(id) {
  try { await api('update-work', { id, data: { draft: false } }); loadWorks(); }
  catch(e) { alert('Error publishing'); }
}

function deleteWork(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-work', { id }).then(() => { loadWorks(); loadTrash(); });
  });
}

let editingWork = null;

// ─── Graphic Designs ──────────────────────────────────────────────────────────
let editingGraphic = null;


async function loadGraphics() {
  try {
    const [graphics, trash] = await Promise.all([
      api('get-graphic-designs'),
      api('get-trash', { table: 'graphic_designs' })
    ]);
    currentData.graphics = graphics;

    const list = document.getElementById('graphic-list');
    const active = (graphics || []).filter(g => !g.deleted).sort((a,b) => a.sort_order - b.sort_order);
    list.innerHTML = active.length
      ? active.map(g => `
        <div class="entry-item" data-id="${g.id}" draggable="true" ondragstart="dragStart(event,'${g.id}','graphic_designs')" ondragover="dragOver(event)" ondrop="dragDrop(event,'graphic_designs')" style="cursor:grab;">
          <div class="entry-item-left">
            <div class="entry-item-type">Graphic Design</div>
            <div class="entry-item-title">${escapeHtml(g.title || '(no title)')}${g.thumb ? '' : ' · no image'}</div>
          </div>
          ${g.draft ? '<span class="entry-draft">Draft</span>' : ''}
          <div class="entry-actions">
            ${g.draft ? `<button class="entry-btn-sm" onclick="publishGraphic('${g.id}')">Publish</button>` : ''}
            <button class="entry-btn-sm" onclick="editGraphic('${g.id}')">${iconEdit}</button>
            <button class="entry-btn-sm danger" onclick="deleteGraphic('${g.id}')">${iconDelete}</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No graphic designs yet</div>';

    document.getElementById('graphic-trash').innerHTML = (trash && trash.length)
      ? trash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">Graphic Design</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','graphic_designs')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) {
    document.getElementById('graphic-list').innerHTML = '<div class="loading-state">Error loading</div>';
    console.error('loadGraphics', e);
  }
}

function newGraphic() {
  editingGraphic = null;
  document.getElementById('card-graphic').classList.remove('collapsed');
  document.getElementById('graphic-form-title').textContent = 'Add Graphic Design';
  document.getElementById('gd-title').value = '';
  const urlEl = document.getElementById('gd-thumb-url'); if (urlEl) urlEl.value = '';
  document.getElementById('gd-thumb').textContent = 'Upload image to preview';
  document.getElementById('graphic-form').classList.add('open');
  document.getElementById('btn-graphic').style.display = 'none';
}

function cancelEditGraphic() {
  editingGraphic = null;
  document.getElementById('graphic-form').classList.remove('open');
  document.getElementById('btn-graphic').style.display = 'block';
}

function editGraphic(id) {
  const g = (currentData.graphics || []).find(x => x.id === id);
  if (!g) return;
  editingGraphic = id;
  document.getElementById('graphic-form-title').textContent = 'Edit Graphic Design';
  document.getElementById('gd-title').value = g.title || '';
  const urlEl = document.getElementById('gd-thumb-url'); if (urlEl) urlEl.value = g.thumb || '';
  if (g.thumb) document.getElementById('gd-thumb').innerHTML = `<img src="${g.thumb}" onerror="this.parentElement.textContent='Could not load'">`;
  document.getElementById('graphic-form').classList.add('open');
  document.getElementById('btn-graphic').style.display = 'none';
}

async function saveGraphic(draft = false) {
  const data = {
    title: document.getElementById('gd-title').value || null,
    thumb: document.getElementById('gd-thumb-url')?.value || null,
    draft
  };
  try {
    if (editingGraphic) {
      await api('update-graphic-design', { id: editingGraphic, data });
    } else {
      await api('save-graphic-design', { data });
    }
    cancelEditGraphic();
    loadGraphics();
  } catch(e) { alert('Error saving'); }
}

async function publishGraphic(id) {
  try { await api('update-graphic-design', { id, data: { draft: false } }); loadGraphics(); }
  catch(e) { alert('Error publishing'); }
}

function deleteGraphic(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-graphic-design', { id }).then(() => { loadGraphics(); loadTrash(); });
  });
}

async function deleteAllTrash() {
  showDeleteModal('Empty all trash?', 'This permanently deletes everything in trash. Cannot be undone.', async () => {
    try {
      await api('empty-trash');
      loadTrash();
    } catch(e) { alert('Error emptying trash'); }
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────
let editingStat = null;

async function loadStats() {
  try {
    const [stats, trash] = await Promise.all([
      api('get-stats-cards'),
      api('get-trash', { table: 'stats' })
    ]);
    currentData.stats = stats;
    const list = document.getElementById('stats-list');
    const active = (stats || []).filter(s => !s.deleted).sort((a,b) => a.sort_order - b.sort_order);
    list.innerHTML = active.length
      ? active.map(s => `
        <div class="entry-item" data-id="${s.id}" draggable="true"
          ondragstart="dragStart(event,'${s.id}','stats')"
          ondragover="dragOver(event)" ondrop="dragDrop(event,'stats')" style="cursor:grab;">
          <div class="entry-item-left">
            <div class="entry-item-type">${escapeHtml(s.count || '')}${escapeHtml(s.suffix || '')}</div>
            <div class="entry-item-title">${escapeHtml(s.label || '(no label)')}</div>
          </div>
          ${s.draft ? '<span class="entry-draft">Draft</span>' : ''}
          <div class="entry-actions">
            ${s.draft ? `<button class="entry-btn-sm" onclick="publishStat('${s.id}')">Publish</button>` : ''}
            <button class="entry-btn-sm" onclick="editStat('${s.id}')">${iconEdit}</button>
            <button class="entry-btn-sm danger" onclick="deleteStat('${s.id}')">${iconDelete}</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No stats yet</div>';

    const trashEl = document.getElementById('stats-trash');
    if (trashEl) trashEl.innerHTML = (trash && trash.length)
      ? trash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data?.label || 'Stat')}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','stats')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) { console.error('loadStats', e); }
}

function newStat() {
  editingStat = null;
  document.getElementById('stat-form-title').textContent = 'Add Stat';
  ['st-count','st-suffix','st-label','st-note'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('stat-form').classList.add('open');
  document.getElementById('btn-stat').style.display = 'none';
}

function cancelEditStat() {
  editingStat = null;
  document.getElementById('stat-form').classList.remove('open');
  document.getElementById('btn-stat').style.display = 'block';
}

function editStat(id) {
  const s = (currentData.stats || []).find(x => x.id === id);
  if (!s) return;
  editingStat = id;
  document.getElementById('stat-form-title').textContent = 'Edit Stat';
  document.getElementById('st-count').value = s.count || '';
  document.getElementById('st-suffix').value = s.suffix || '';
  document.getElementById('st-label').value = s.label || '';
  document.getElementById('st-note').value = s.note || '';
  document.getElementById('stat-form').classList.add('open');
  document.getElementById('btn-stat').style.display = 'none';
}

async function saveStat(draft = false) {
  const data = {
    count: document.getElementById('st-count').value || null,
    suffix: document.getElementById('st-suffix').value || null,
    label: document.getElementById('st-label').value || null,
    note: document.getElementById('st-note').value || null,
    draft
  };
  try {
    if (editingStat) {
      await api('update-stat', { id: editingStat, data });
    } else {
      await api('save-stat', { data });
    }
    cancelEditStat();
    loadStats();
  } catch(e) { alert('Error saving'); }
}

async function publishStat(id) {
  try { await api('update-stat', { id, data: { draft: false } }); loadStats(); }
  catch(e) { alert('Error publishing'); }
}

function deleteStat(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-stat', { id }).then(() => { loadStats(); loadTrash(); });
  });
}

// ─── Library Cards ────────────────────────────────────────────────────────────
let editingLibraryCard = null;

async function loadLibraryCards() {
  try {
    const cards = await api('get-library-cards');
    currentData.libraryCards = cards;
    const list = document.getElementById('librarycards-list');
    const active = (cards || []).filter(c => !c.deleted).sort((a,b) => a.sort_order - b.sort_order);
    list.innerHTML = active.length
      ? active.map(c => `
        <div class="entry-item" data-id="${c.id}" draggable="true"
          ondragstart="dragStart(event,'${c.id}','library_cards')"
          ondragover="dragOver(event)" ondrop="dragDrop(event,'library_cards')" style="cursor:grab;">
          <div class="entry-item-left">
            <div class="entry-item-type">${escapeHtml(c.label || 'Card')}</div>
            <div class="entry-item-title">${escapeHtml(c.title || '(no title)')}</div>
          </div>
          ${c.draft ? '<span class="entry-draft">Draft</span>' : ''}
          <div class="entry-actions">
            ${c.draft ? `<button class="entry-btn-sm" onclick="publishLibraryCard('${c.id}')">Publish</button>` : ''}
            <button class="entry-btn-sm" onclick="editLibraryCard('${c.id}')">${iconEdit}</button>
            <button class="entry-btn-sm danger" onclick="deleteLibraryCard('${c.id}')">${iconDelete}</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No library cards yet</div>';

    const trash = await api('get-trash', { table: 'library_cards' });
    document.getElementById('librarycards-trash').innerHTML = (trash && trash.length)
      ? trash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data?.title || 'Library Card')}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','library_cards')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) { console.error('loadLibraryCards', e); }
}

function newLibraryCard() {
  editingLibraryCard = null;
  document.getElementById('librarycard-form-title').textContent = 'Add Library Card';
  ['lc-label','lc-title','lc-desc','lc-link'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('librarycard-form').classList.add('open');
  document.getElementById('btn-librarycard').style.display = 'none';
}

function cancelEditLibraryCard() {
  editingLibraryCard = null;
  document.getElementById('librarycard-form').classList.remove('open');
  document.getElementById('btn-librarycard').style.display = 'block';
}

function editLibraryCard(id) {
  const c = (currentData.libraryCards || []).find(x => x.id === id);
  if (!c) return;
  editingLibraryCard = id;
  document.getElementById('librarycard-form-title').textContent = 'Edit Library Card';
  document.getElementById('lc-label').value = c.label || '';
  document.getElementById('lc-title').value = c.title || '';
  document.getElementById('lc-desc').value = c.description || '';
  document.getElementById('lc-link').value = c.link || '';
  document.getElementById('librarycard-form').classList.add('open');
  document.getElementById('btn-librarycard').style.display = 'none';
}

async function saveLibraryCard(draft = false) {
  const data = {
    label: document.getElementById('lc-label').value || null,
    title: document.getElementById('lc-title').value || null,
    description: document.getElementById('lc-desc').value || null,
    link: document.getElementById('lc-link').value || null,
    draft
  };
  try {
    if (editingLibraryCard) {
      await api('update-library-card', { id: editingLibraryCard, data });
    } else {
      await api('save-library-card', { data });
    }
    cancelEditLibraryCard();
    loadLibraryCards();
  } catch(e) { alert('Error saving'); }
}

async function publishLibraryCard(id) {
  try { await api('update-library-card', { id, data: { draft: false } }); loadLibraryCards(); }
  catch(e) { alert('Error publishing'); }
}

function deleteLibraryCard(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-library-card', { id }).then(() => { loadLibraryCards(); loadTrash(); });
  });
}

// ─── Services ─────────────────────────────────────────────────────────────────
let editingService = null;

async function loadServices() {
  try {
    const services = await api('get-services');
    currentData.services = services;
    const list = document.getElementById('services-list');
    const active = (services || []).filter(s => !s.deleted).sort((a,b) => a.sort_order - b.sort_order);
    list.innerHTML = active.length
      ? active.map(s => `
        <div class="entry-item" data-id="${s.id}" draggable="true"
          ondragstart="dragStart(event,'${s.id}','services')"
          ondragover="dragOver(event)" ondrop="dragDrop(event,'services')" style="cursor:grab;">
          <div class="entry-item-left">
            <div class="entry-item-type">Service</div>
            <div class="entry-item-title">${escapeHtml(s.name || '(no name)')}</div>
          </div>
          ${s.draft ? '<span class="entry-draft">Draft</span>' : ''}
          <div class="entry-actions">
            ${s.draft ? `<button class="entry-btn-sm" onclick="publishService('${s.id}')">Publish</button>` : ''}
            <button class="entry-btn-sm" onclick="editService('${s.id}')">${iconEdit}</button>
            <button class="entry-btn-sm danger" onclick="deleteService('${s.id}')">${iconDelete}</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No services yet</div>';

    const trash = await api('get-trash', { table: 'services' });
    document.getElementById('services-trash').innerHTML = (trash && trash.length)
      ? trash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data?.name || 'Service')}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','services')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) { console.error('loadServices', e); }
}

function newService() {
  editingService = null;
  document.getElementById('service-form-title').textContent = 'Add Service';
  ['sv-name','sv-detail'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('service-form').classList.add('open');
  document.getElementById('btn-service').style.display = 'none';
}

function cancelEditService() {
  editingService = null;
  document.getElementById('service-form').classList.remove('open');
  document.getElementById('btn-service').style.display = 'block';
}

function editService(id) {
  const s = (currentData.services || []).find(x => x.id === id);
  if (!s) return;
  editingService = id;
  document.getElementById('service-form-title').textContent = 'Edit Service';
  document.getElementById('sv-name').value = s.name || '';
  document.getElementById('sv-detail').value = s.detail || '';
  document.getElementById('service-form').classList.add('open');
  document.getElementById('btn-service').style.display = 'none';
}

async function saveService(draft = false) {
  const data = {
    name: document.getElementById('sv-name').value || null,
    detail: document.getElementById('sv-detail').value || null,
    draft
  };
  try {
    if (editingService) {
      await api('update-service', { id: editingService, data });
    } else {
      await api('save-service', { data });
    }
    cancelEditService();
    loadServices();
  } catch(e) { alert('Error saving'); }
}

async function publishService(id) {
  try { await api('update-service', { id, data: { draft: false } }); loadServices(); }
  catch(e) { alert('Error publishing'); }
}

function deleteService(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-service', { id }).then(() => { loadServices(); loadTrash(); });
  });
}

// ─── Tools ────────────────────────────────────────────────────────────────────
let editingTool = null;

async function loadTools() {
  try {
    const tools = await api('get-tools');
    currentData.tools = tools;
    const list = document.getElementById('tools-list');
    const active = (tools || []).filter(t => !t.deleted).sort((a,b) => a.sort_order - b.sort_order);
    list.innerHTML = active.length
      ? active.map(t => `
        <div class="entry-item" data-id="${t.id}" draggable="true"
          ondragstart="dragStart(event,'${t.id}','tools')"
          ondragover="dragOver(event)" ondrop="dragDrop(event,'tools')" style="cursor:grab;">
          <div class="entry-item-left" style="display:flex;align-items:center;gap:8px;">
            ${t.icon_url ? `<img src="${t.icon_url}" style="width:20px;height:20px;object-fit:contain;">` : ''}
            <div>
              <div class="entry-item-type">Tool</div>
              <div class="entry-item-title">${escapeHtml(t.name || '(no name)')}</div>
            </div>
          </div>
          ${t.draft ? '<span class="entry-draft">Draft</span>' : ''}
          <div class="entry-actions">
            ${t.draft ? `<button class="entry-btn-sm" onclick="publishTool('${t.id}')">Publish</button>` : ''}
            <button class="entry-btn-sm" onclick="editTool('${t.id}')">${iconEdit}</button>
            <button class="entry-btn-sm danger" onclick="deleteTool('${t.id}')">${iconDelete}</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No tools yet</div>';

    const trash = await api('get-trash', { table: 'tools' });
    document.getElementById('tools-trash').innerHTML = (trash && trash.length)
      ? trash.map(t => `
        <div class="trash-entry-item">
          <div class="trash-entry-left">
            <div class="trash-entry-title">${escapeHtml(t.data?.name || 'Tool')}</div>
            <div class="trash-entry-meta">Deleted ${formatDate(t.deleted_at)}</div>
          </div>
          <div class="entry-actions">
            <button class="entry-btn-sm" onclick="restoreItem('${t.id}','tools')">Restore</button>
            <button class="entry-btn-sm danger" onclick="permanentDelete('${t.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-trash">No deleted items</div>';
  } catch(e) { console.error('loadTools', e); }
}

function previewToolIcon() {
  const url = document.getElementById('tl-icon-url').value;
  const preview = document.getElementById('tl-icon-preview');
  if (url) {
    preview.innerHTML = `<img src="${url}" style="width:40px;height:40px;object-fit:contain;" onerror="this.parentElement.textContent='Could not load'">`;
  } else {
    preview.textContent = 'Paste URL to preview';
  }
}

function newTool() {
  editingTool = null;
  document.getElementById('tool-form-title').textContent = 'Add Tool';
  ['tl-name','tl-icon-url'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('tl-icon-preview').textContent = 'Paste URL to preview';
  document.getElementById('tool-form').classList.add('open');
  document.getElementById('btn-tool').style.display = 'none';
}

function cancelEditTool() {
  editingTool = null;
  document.getElementById('tool-form').classList.remove('open');
  document.getElementById('btn-tool').style.display = 'block';
}

function editTool(id) {
  const t = (currentData.tools || []).find(x => x.id === id);
  if (!t) return;
  editingTool = id;
  document.getElementById('tool-form-title').textContent = 'Edit Tool';
  document.getElementById('tl-name').value = t.name || '';
  document.getElementById('tl-icon-url').value = t.icon_url || '';
  if (t.icon_url) {
    document.getElementById('tl-icon-preview').innerHTML = `<img src="${t.icon_url}" style="width:40px;height:40px;object-fit:contain;" onerror="this.parentElement.textContent='Could not load'">`;
  }
  document.getElementById('tool-form').classList.add('open');
  document.getElementById('btn-tool').style.display = 'none';
}

async function saveTool(draft = false) {
  const data = {
    name: document.getElementById('tl-name').value || null,
    icon_url: document.getElementById('tl-icon-url').value || null,
    draft
  };
  try {
    if (editingTool) {
      await api('update-tool', { id: editingTool, data });
    } else {
      await api('save-tool', { data });
    }
    cancelEditTool();
    loadTools();
  } catch(e) { alert('Error saving'); }
}

async function publishTool(id) {
  try { await api('update-tool', { id, data: { draft: false } }); loadTools(); }
  catch(e) { alert('Error publishing'); }
}

function deleteTool(id) {
  showDeleteModal('Move to trash?', 'You can restore within 30 days.', () => {
    api('delete-tool', { id }).then(() => { loadTools(); loadTrash(); });
  });
}

// ─── Site Content ─────────────────────────────────────────────────────────────
async function loadSiteContent() {
  try {
    const rows = await api('get-site-content');
    const map = Object.fromEntries((rows || []).map(r => [r.key, r.value]));
    Object.entries(map).forEach(([key, val]) => {
      const el = document.getElementById('sc-' + key);
      if (el) el.value = val || '';
    });
  } catch(e) { console.error('loadSiteContent', e); }
}

async function saveSiteContentGroup(keys) {
  try {
    await Promise.all(keys.map(key => {
      const el = document.getElementById('sc-' + key);
      if (!el) return Promise.resolve();
      return api('save-site-content', { key, value: el.value });
    }));
    alert('Saved.');
  } catch(e) { alert('Error saving site content'); }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function loadAllData() {
  await Promise.all([
    loadOverview(), loadSamples(), loadArtists(), loadThumbs(), loadGraphics(), loadWorks(), loadRates(),
    loadTestimonials(), loadVisitors(), loadPitches(),
    loadToggles(), loadNotes(), loadFullActivity(), loadTrash(),
    loadSiteContent(), loadStats(), loadLibraryCards(), loadServices(), loadTools()
  ]);
}

// Auto-poll: refresh visitors and pitches every 45 seconds
setInterval(() => {
  loadVisitors();
  loadPitches();
}, 45000);
