(function () {

  var SUPABASE_URL = (document.querySelector('meta[name="sb-url"]') || {}).content || '';
  var SUPABASE_ANON = (document.querySelector('meta[name="sb-anon"]') || {}).content || '';

  // ── BUILD CAPTIONING ENTRY ──
  function buildCaptioningEntry(s, idx) {
    var ytMatch = s.link && s.link.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    var thumbSrc = s.thumb || (ytMatch ? 'https://img.youtube.com/vi/' + ytMatch[1] + '/maxresdefault.jpg' : null);
    var thumbHtml = thumbSrc
      ? '<img src="' + thumbSrc + '" alt="' + s.title + '" onerror="this.parentElement.innerHTML=\'Thumbnail<br>Coming Soon\'">'
      : 'Thumbnail<br>Coming Soon';
    var btnHtml = s.link
      ? '<a href="' + s.link + '" target="_blank" class="entry-btn stretched-link" style="margin-top:14px;align-self:flex-start;">Watch Sample →</a>'
      : '<span class="entry-btn" style="margin-top:14px;align-self:flex-start;opacity:0.35;">Watch Sample</span>';
    return '<div class="library-entry-captioning" data-idx="' + idx + '">'
         + '<div class="entry-thumb">' + thumbHtml + '</div>'
         + '<div class="entry-meta">'
         + '<div class="entry-type">' + s.type + '</div>'
         + '<div class="entry-title">' + s.title + '</div>'
         + '<div class="entry-ep">' + s.episode + '</div>'
         + btnHtml
         + '</div>'
         + '</div>';
  }

  // ── BUILD ARTIST ENTRY ──
  function buildArtistEntry(s, idx) {
    var thumbHtml = s.thumb
      ? '<img src="' + s.thumb + '" alt="' + s.title + '" onerror="this.parentElement.innerHTML=\'Thumbnail\'">'
      : 'Thumbnail';
    var btnHtml = s.link
      ? '<a href="' + s.link + '" target="_blank" class="entry-btn stretched-link">Watch Sample →</a>'
      : '<span class="entry-btn" style="opacity:0.35;">Watch Sample →</span>';
    return '<div class="library-entry-artists" data-idx="' + idx + '">'
         + '<div class="entry-thumb">' + thumbHtml + '</div>'
         + '<div class="entry-meta">'
         + '<div class="entry-type">' + s.type + '</div>'
         + '<div class="entry-title">' + s.title + (s.episode ? ' | ' + s.episode : '') + '</div>'
         + btnHtml
         + '</div>'
         + '</div>';
  }

  // ── LOAD CAPTIONING ──
  var capGrid = document.getElementById('captioning-grid');

  function renderCaptioning(samples) {
    if (!capGrid) return;
    if (!samples || samples.length === 0) {
      capGrid.innerHTML = '<p style="padding:40px 24px;color:var(--muted);font-size:0.8rem;">No samples yet — check back soon.</p>';
      return;
    }
    capGrid.innerHTML = samples.map(buildCaptioningEntry).join('');
    capGrid.querySelectorAll('.library-entry-captioning').forEach(function(c) { c.classList.add('card-hidden'); });
    if (samples.length % 2 !== 0) {
      var last = capGrid.lastElementChild;
      if (last) { last.style.gridColumn = '1 / -1'; last.style.maxWidth = '50%'; last.style.margin = '0 auto'; last.style.width = '100%'; }
    }
    setTimeout(function() { window._anim && window._anim.checkCards('captioning-grid', 'library-entry-captioning'); }, 80);
  }

  if (capGrid && SUPABASE_URL && SUPABASE_ANON) {
    fetch(SUPABASE_URL + '/rest/v1/samples?select=type,title,episode,thumb,link&deleted=eq.false&draft=eq.false&order=sort_order.asc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) { renderCaptioning(data && data.length ? data : []); })
    .catch(function() { renderCaptioning([]); });
  } else if (capGrid) {
    renderCaptioning([]);
  }

  // ── LOAD ARTISTS ──
  var artGrid = document.getElementById('artists-grid');

  function renderArtists(samples) {
    if (!artGrid) return;
    if (!samples || samples.length === 0) {
      artGrid.innerHTML = '<p style="padding:40px 24px;color:var(--muted);font-size:0.8rem;">No features yet — check back soon.</p>';
      return;
    }
    artGrid.innerHTML = samples.map(buildArtistEntry).join('');
    artGrid.querySelectorAll('.library-entry-artists').forEach(function(c) { c.classList.add('card-hidden'); });
    setTimeout(function() { window._anim && window._anim.checkCards('artists-grid', 'library-entry-artists'); }, 80);
  }

  if (artGrid && SUPABASE_URL && SUPABASE_ANON) {
    fetch(SUPABASE_URL + '/rest/v1/artist_samples?select=type,title,episode,thumb,link&deleted=eq.false&draft=eq.false&order=sort_order.asc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) { renderArtists(data && data.length ? data : []); })
    .catch(function() { renderArtists([]); });
  } else if (artGrid) {
    renderArtists([]);
  }

})();