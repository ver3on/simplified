(function () {

  var SUPABASE_URL  = (document.querySelector('meta[name="sb-url"]')  || {}).content || '';
  var SUPABASE_ANON = (document.querySelector('meta[name="sb-anon"]') || {}).content || '';

  function buildThumbEntry(s, idx) {
    var ytMatch = s.link && s.link.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    var thumbSrc = s.thumb || (ytMatch ? 'https://img.youtube.com/vi/' + ytMatch[1] + '/maxresdefault.jpg' : null);
    var thumbHtml = thumbSrc
      ? '<img src="' + thumbSrc + '" alt="' + s.title + '" onerror="this.parentElement.innerHTML=\'Thumbnail Coming Soon\'">'
      : 'Thumbnail Coming Soon';
    return '<div class="library-entry-thumbs" data-idx="' + idx + '">'
      + '<div class="entry-thumb">' + thumbHtml + '</div>'
      + '<div class="entry-meta"><div class="entry-title">' + s.title + '</div></div>'
      + '</div>';
  }

  function buildGraphicEntry(s, idx) {
    var thumbHtml = s.thumb
      ? '<img src="' + s.thumb + '" alt="Graphic design sample" onerror="this.parentElement.innerHTML=\'Image Coming Soon\'">'
      : 'Image Coming Soon';
    return '<div class="library-entry-graphic" data-idx="' + idx + '">'
      + '<div class="entry-thumb">' + thumbHtml + '</div>'
      + '</div>';
  }

  var thumbsGrid = document.getElementById('thumbs-grid');

  function renderThumbs(samples) {
    if (!thumbsGrid) return;
    if (!samples || samples.length === 0) {
      thumbsGrid.innerHTML = '<p style="padding:40px 24px;color:var(--muted);font-size:0.8rem;">No samples yet — check back soon.</p>';
      return;
    }
    thumbsGrid.innerHTML = samples.map(buildThumbEntry).join('');
    if (samples.length === 1) {
      var last = thumbsGrid.lastElementChild;
      if (last) last.style.margin = '0 auto';
    }
    setTimeout(function() { window._thumbAnim && window._thumbAnim.checkCards('thumbs-grid', 'library-entry-thumbs'); }, 80);
  }

  if (thumbsGrid && SUPABASE_URL && SUPABASE_ANON) {
    fetch(SUPABASE_URL + '/rest/v1/thumbnails?select=title,thumb,link&deleted=eq.false&draft=eq.false&order=sort_order.asc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) { renderThumbs(data && data.length ? data : []); })
    .catch(function() { renderThumbs([]); });
  } else if (thumbsGrid) {
    renderThumbs([]);
  }

  var graphicGrid = document.getElementById('graphic-grid');

  function renderGraphic(samples) {
    if (!graphicGrid) return;
    if (!samples || samples.length === 0) {
      graphicGrid.innerHTML = '<p style="padding:40px 24px;color:var(--muted);font-size:0.8rem;">No samples yet — check back soon.</p>';
      return;
    }
    graphicGrid.innerHTML = samples.map(buildGraphicEntry).join('');
    setTimeout(function() { window._thumbAnim && window._thumbAnim.checkCards('graphic-grid', 'library-entry-graphic'); }, 80);
  }

  if (graphicGrid && SUPABASE_URL && SUPABASE_ANON) {
    fetch(SUPABASE_URL + '/rest/v1/graphic_designs?select=thumb&deleted=eq.false&draft=eq.false&order=sort_order.asc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) { renderGraphic(data && data.length ? data : []); })
    .catch(function() { renderGraphic([]); });
  } else if (graphicGrid) {
    renderGraphic([]);
  }

})();