(function () {

  var SUPABASE_URL = document.querySelector('meta[name="sb-url"]')?.content || '';
  var SUPABASE_ANON = document.querySelector('meta[name="sb-anon"]')?.content || '';

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function extractYouTubeId(url) {
    var match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  }

  // —— Texts
  async function loadSiteContent() {
  const sbUrl = document.querySelector('meta[name="sb-url"]').content;
  const sbAnon = document.querySelector('meta[name="sb-anon"]').content;

  const res = await fetch(`${sbUrl}/rest/v1/site_content?select=*`, {
    headers: {
      'apikey': sbAnon,
      'Authorization': 'Bearer ' + sbAnon
    }
  });
  const rows = await res.json();
  const c = Object.fromEntries(rows.map(r => [r.key, r.value]));

  // Hero
  document.getElementById('hero-eyebrow').textContent = c.hero_eyebrow || '';
  document.getElementById('hero-name').textContent = c.hero_name || '';
  document.getElementById('hero-tagline').textContent = c.hero_tagline || '';
  document.getElementById('hero-bio').textContent = c.hero_bio || '';

  // Hero links
  if (c.email) {
    const el = document.getElementById('hero-email-link');
    el.textContent = c.email;
    el.href = 'mailto:' + c.email;
  }
  if (c.tiktok_url && c.tiktok_handle) {
    const el = document.getElementById('hero-tiktok-link');
    el.textContent = 'TikTok: ' + c.tiktok_handle;
    el.href = c.tiktok_url;
    el.style.display = '';
    document.getElementById('hero-tiktok-sep').style.display = '';
  }
  if (c.ig_url && c.ig_handle) {
    const el = document.getElementById('hero-ig-link');
    el.textContent = 'Instagram: ' + c.ig_handle;
    el.href = c.ig_url;
    el.style.display = '';
    document.getElementById('hero-ig-sep').style.display = '';
  }
  if (c.resume_url) {
    const el = document.getElementById('hero-resume-link');
    el.href = c.resume_url;
    el.style.display = '';
    document.getElementById('hero-resume-sep').style.display = '';
  }

  // Contact
  document.getElementById('contact-heading').textContent = c.contact_heading || '';
  document.getElementById('contact-sub').textContent = c.contact_sub || '';
  if (c.email) {
    const el = document.getElementById('contact-email-link');
    el.textContent = c.email;
    el.href = 'mailto:' + c.email;
  }
  if (c.tiktok_url && c.tiktok_handle) {
    const el = document.getElementById('contact-tiktok-link');
    el.textContent = 'TikTok: ' + c.tiktok_handle;
    el.href = c.tiktok_url;
    el.style.display = '';
  }
  if (c.ig_url && c.ig_handle) {
    const el = document.getElementById('contact-ig-link');
    el.textContent = 'IG: ' + c.ig_handle;
    el.href = c.ig_url;
    el.style.display = '';
  }
}

  // ── Settings + availability ──
  async function fetchSettings() {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    try {
      var res = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value`, {
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
      });
      return await res.json();
    } catch(e) { console.error(e); }
  }

  function updateAvailability(isAvailable) {
    var el = document.getElementById('availability-status');
    var textEl = document.getElementById('avail-text');
    if (el) {
      el.classList.toggle('available', isAvailable);
      el.classList.toggle('unavailable', !isAvailable);
      textEl.textContent = isAvailable ? 'Available for projects' : 'Currently unavailable';
    }
  }

  // ── Testimonials ──
  var testiSwiper = null;

  function setTestiPill(on) {
    var pill = document.getElementById('pill-testimonies');
    if (pill) pill.style.display = on ? '' : 'none';
  }

  async function loadTestimonials(shouldShow) {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    var section = document.getElementById('testimonials');
    var grid = document.getElementById('testimonials-grid');
    if (!shouldShow) {
      section.style.display = 'none';
      setTestiPill(false);
      if (testiSwiper) { testiSwiper.destroy(true, true); testiSwiper = null; }
      return;
    }
    try {
      var res = await fetch(
        `${SUPABASE_URL}/rest/v1/testimonials?select=quote,name,context&deleted=eq.false&draft=eq.false&order=created_at.desc`,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
      );
      var testimonials = await res.json();
      if (testimonials && testimonials.length > 0) {
        grid.innerHTML = testimonials.map(function(t) {
          return `<div class="swiper-slide" style="padding:0 4px;">
            <div class="testimonial-card">
              <div class="testimonial-quote">"${escapeHtml(t.quote)}"</div>
              <div class="testimonial-name">@${escapeHtml(t.name)}</div>
              <div class="testimonial-context">${escapeHtml(t.context || '')}</div>
            </div>
          </div>`;
        }).join('');
        section.style.display = 'block';
        setTestiPill(true);
        if (testiSwiper) testiSwiper.destroy(true, true);
        testiSwiper = new Swiper('.testi-swiper', {
          loop: testimonials.length > 1,
          grabCursor: true,
          autoplay: testimonials.length > 1 ? { delay: 3500, disableOnInteraction: false } : false,
          pagination: { el: '#testi-pagination', dynamicBullets: true, clickable: true },
          on: {
            slideChange: function() {
              var active = this.slides[this.activeIndex]?.querySelector('.testimonial-card');
              if (active) {
                active.classList.add('animating');
                void active.offsetWidth;
                active.classList.add('reveal-in');
                setTimeout(function() { active.classList.remove('animating'); }, 550);
              }
            }
          }
        });
      } else {
        section.style.display = 'none';
        setTestiPill(false);
      }
    } catch(e) {
      console.error(e);
      section.style.display = 'none';
      setTestiPill(false);
    }
  }

  // ── Caption cards ──
  function buildCard(s, idx) {
    var thumbHtml = s.link
      ? `<img src="https://img.youtube.com/vi/${extractYouTubeId(s.link)}/maxresdefault.jpg" alt="${s.title}" onerror="this.parentElement.textContent='Thumbnail'">`
      : 'Thumbnail<br>Coming Soon';
    var linkHtml = s.link
      ? `<a href="${s.link}" target="_blank" class="caption-card-link">Watch Sample →</a>`
      : '<a href="captioning.html" class="caption-card-link">View Sample →</a>';
    return `<div class="caption-card" data-idx="${idx}">
      <div class="caption-card-thumb">${thumbHtml}</div>
      <div class="caption-card-body">
        <div class="caption-card-type">${escapeHtml(s.type)}</div>
        <div class="caption-card-title">${escapeHtml(s.title)}</div>
        <div class="caption-card-ep">${escapeHtml(s.episode)}</div>
        ${linkHtml}
      </div>
    </div>`;
  }

  var grid = document.getElementById('caption-grid');
  if (grid) {
    var FALLBACK = [
      { type: 'Italy Travel Tips', title: 'Our Big Italian Adventure', episode: 'video title here', link: 'https://youtu.be/ID_HERE' }
    ];
    function renderCards(show) {
      if (!show || show.length === 0) return;
      grid.innerHTML = show.map(buildCard).join('');
      grid.querySelectorAll('.caption-card').forEach(function(c) { c.classList.add('card-hidden'); });
      setTimeout(function() { window._anim && window._anim.checkCaptionCards(); }, 80);
      if (show.length === 1) {
        var only = grid.firstElementChild;
        if (only) {
          only.style.gridColumn = '1 / -1';
          only.style.maxWidth = '50%';
          only.style.margin = '0 auto';
          only.style.width = '100%';
        }
      }
    }
    if (SUPABASE_URL && SUPABASE_ANON) {
      fetch(`${SUPABASE_URL}/rest/v1/samples?select=type,title,episode,link&deleted=eq.false&draft=eq.false&order=sort_order.asc&limit=3`, {
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
      })
      .then(function(r) { return r.json(); })
      .then(function(data) { renderCards(data && data.length ? data : FALLBACK); })
      .catch(function() { renderCards(FALLBACK); });
    } else {
      renderCards(FALLBACK);
    }
  }

  // ── Init ──
  async function initPublicSite() {
    loadSiteContent();
    loadStatsGrid();
    loadLibraryCards();
    loadServicesAndTools();
    var settings = await fetchSettings();
    if (settings) {
      var isAvailable = settings.find(function(s) { return s.key === 'availability'; })?.value === 'available';
      var testiVisible = settings.find(function(s) { return s.key === 'testimonials_visible'; })?.value === 'true';
      updateAvailability(isAvailable);
      loadTestimonials(testiVisible);
    } else {
      loadTestimonials(false);
    }
  }

  async function loadLibraryCards() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/library_cards?select=*&deleted=eq.false&draft=eq.false&order=sort_order.asc`, {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    });
    const cards = await res.json();
    const grid = document.getElementById('library-cards-grid');
    if (!grid || !cards || !cards.length) return;
    grid.innerHTML = cards.map(c => `
      <a class="feature-card reveal" href="${escapeHtml(c.link || '#')}">
        <div class="feature-card-label">${escapeHtml(c.label || '')}</div>
        <div class="feature-card-title">${escapeHtml(c.title || '')}</div>
        <div class="feature-card-desc">${escapeHtml(c.description || '')}</div>
        <div class="feature-card-link-wrap"><span class="feature-card-link">View Library →</span></div>
      </a>`).join('');
  }

  async function loadStatsGrid() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stats?select=*&deleted=eq.false&draft=eq.false&order=sort_order.asc`, {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    });
    const stats = await res.json();
    const grid = document.getElementById('stats-grid');
    if (!grid || !stats || !stats.length) return;
    grid.innerHTML = stats.map(s => `
      <div class="stat" data-count="${s.count || ''}" data-suffix="${s.suffix || ''}">
        <div class="stat-value">0${s.suffix || ''}</div>
        ${s.label ? `<div class="stat-label">${s.label}</div>` : ''}
        ${s.note ? `<div class="stat-note">${s.note}</div>` : ''}
      </div>
    `).join('');
  }

  async function loadServicesAndTools() {
    const [sRes, tRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/services?select=*&deleted=eq.false&draft=eq.false&order=sort_order.asc`, {
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/tools?select=*&deleted=eq.false&draft=eq.false&order=sort_order.asc`, {
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
      })
    ]);
    const services = await sRes.json();
    const tools = await tRes.json();

    const toolsRow = document.getElementById('tools-row');
    if (toolsRow && tools && tools.length) {
      toolsRow.innerHTML = tools.map(t => `
        <div class="tool-item">
          <img src="${escapeHtml(t.icon_url || '')}" alt="${escapeHtml(t.name || '')}">
        </div>`).join('');
    }

    const servicesList = document.getElementById('services-list');
    if (servicesList && services && services.length) {
      servicesList.innerHTML = services.map(s => `
        <div class="service-item reveal">
          <div class="service-name">${escapeHtml(s.name || '')}</div>
          <div class="service-detail">${escapeHtml(s.detail || '')}</div>
        </div>`).join('');
    }
  }

  window._initPublicSite = initPublicSite;

})();