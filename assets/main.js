(function () {

  // ── Pill nav ──
  var sectionIds = ['hero', 'stats', 'work', 'captioning', 'services', 'testimonials', 'contact'];
  var pills = document.querySelectorAll('.pill-item');
  var isScrolling = false;

  pills.forEach(function(pill) {
    pill.addEventListener('click', function() {
      var targetId = pill.dataset.target;
      var el = document.getElementById(targetId);
      if (el) {
        isScrolling = true;
        pills.forEach(function(p) { p.classList.remove('active'); });
        pill.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth' });
        setTimeout(function() { isScrolling = false; }, 1000);
      }
    });
  });

  function updatePill() {
    if (isScrolling) return;
    var current = 'hero';
    var bodyHeight = document.body.offsetHeight;
    var windowHeight = window.innerHeight;
    sectionIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top <= 150) current = id;
      }
    });
    if (windowHeight + window.scrollY >= bodyHeight - 10) current = 'contact';
    pills.forEach(function(p) { p.classList.toggle('active', p.dataset.target === current); });
  }

  // ── Work swiper + descriptor ──
  var workDescs = [];
  var workDescEl = document.getElementById('work-descriptor');

  function updateWorkDesc(index) {
    workDescEl.classList.add('fading');
    setTimeout(function() {
      workDescEl.textContent = workDescs[index % workDescs.length];
      workDescEl.classList.remove('fading');
    }, 300);
  }

  var workSwiper = null;

  function initWorkSwiper() {
    if (workSwiper) workSwiper.destroy(true, true);
    workSwiper = new Swiper('.work-swiper', {
      loop: workDescs.length > 1,
      grabCursor: true,
      pagination: { el: '#work-pagination', dynamicBullets: true, clickable: true },
      on: { slideChange: function() { updateWorkDesc(this.realIndex); } }
    });
  }

  function buildWorkSlide(w) {
    var imgHtml = w.image
      ? `<div class="work-card-img-wrap"><img src="${w.image}" alt="${w.title || ''}"></div>`
      : '';
    var linkHtml = w.link
      ? `<a href="${w.link}" class="work-card-link" style="display:block;text-align:center;margin-top:8px;">View Post →</a>`
      : '';
    return `<div class="swiper-slide">
      <div class="work-card">
        <div class="work-card-type">${w.type || ''}</div>
        <div class="work-card-title">${w.title || ''}</div>
        ${imgHtml}
        ${linkHtml}
      </div>
    </div>`;
  }

  var SUPABASE_URL_W = document.querySelector('meta[name="sb-url"]')?.content || '';
  var SUPABASE_ANON_W = document.querySelector('meta[name="sb-anon"]')?.content || '';

  if (SUPABASE_URL_W && SUPABASE_ANON_W) {
    fetch(`${SUPABASE_URL_W}/rest/v1/works?select=type,title,description,image,link&deleted=eq.false&draft=eq.false&order=sort_order.asc`, {
      headers: { 'apikey': SUPABASE_ANON_W, 'Authorization': `Bearer ${SUPABASE_ANON_W}` }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data || !data.length) { initWorkSwiper(); return; }
      workDescs = data.map(function(w) { return w.description || ''; });
      var wrapper = document.querySelector('.work-swiper .swiper-wrapper');
      wrapper.innerHTML = data.map(buildWorkSlide).join('');
      if (workDescEl) workDescEl.textContent = workDescs[0] || '';
      initWorkSwiper();
    })
    .catch(function() { initWorkSwiper(); });
  } else {
    initWorkSwiper();
  }

  // ── Pagination drag on work swiper ──
  var pagEl = document.getElementById('work-pagination');
  var dragStartX = 0;
  var dragStartIndex = 0;

  pagEl.addEventListener('pointerdown', function(e) {
    dragStartX = e.clientX;
    dragStartIndex = workSwiper.realIndex;
    pagEl.setPointerCapture(e.pointerId);
  });

  pagEl.addEventListener('pointermove', function(e) {
    if (e.buttons === 0) return;
    var diff = e.clientX - dragStartX;
    if (Math.abs(diff) > 30) {
      if (diff < 0) workSwiper.slideNext();
      else workSwiper.slidePrev();
      dragStartX = e.clientX;
    }
  });

  // ── Scroll handler ──
  function onScroll() {
    updatePill();
    if (window._anim) {
      window._anim.checkHero();
      window._anim.checkReveals();
      window._anim.checkContact();
      window._anim.checkStats();
      window._anim.checkStatCards();
      window._anim.checkCaptionCards();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Initial check on load ──
  setTimeout(function() {
    if (window._initPublicSite) window._initPublicSite();
    if (window._anim) {
      window._anim.checkHero();
      window._anim.checkReveals();
      window._anim.checkContact();
      window._anim.checkStats();
      window._anim.checkStatCards();
      window._anim.checkCaptionCards();
    }
  }, 100);

})();