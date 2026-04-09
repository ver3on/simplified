(function () {

  var thumbHero   = window._anim.makeHeroController('.thumb-hero-anim');
  var graphicHero = window._anim.makeHeroController('.graphic-hero-anim');

  var sections = [
    { id: 'thumbnails', pill: document.querySelector('.back-pill[href="#thumbnails"]') },
    { id: 'graphic',    pill: document.querySelector('.back-pill[href="#graphic"]') }
  ];

  function updateActive() {
    var scrollY = window.pageYOffset;
    var active = null;
    sections.forEach(function(s) {
      var el = document.getElementById(s.id);
      if (!el) return;
      if (el.getBoundingClientRect().top + scrollY - 80 <= scrollY) active = s;
    });
    sections.forEach(function(s) { if (s.pill) s.pill.classList.remove('active'); });
    if (active && active.pill) active.pill.classList.add('active');
  }

  window.addEventListener('scroll', function() {
    thumbHero.check();
    graphicHero.check();
    window._anim.checkReveals();
    window._anim.checkCards('thumbs-grid', 'library-entry-thumbs');
    window._anim.checkCards('graphic-grid', 'library-entry-graphic');
    updateActive();
  }, { passive: true });

  setTimeout(function() {
    window._anim.checkReveals();
    window._anim.checkCards('thumbs-grid', 'library-entry-thumbs');
    window._anim.checkCards('graphic-grid', 'library-entry-graphic');
    updateActive();
  }, 50);

  window.addEventListener('load', function() {
    window._anim.checkCards('thumbs-grid', 'library-entry-thumbs');
    window._anim.checkCards('graphic-grid', 'library-entry-graphic');
  });

  window.addEventListener('load', function() {
    window._anim.checkReveals();
    window._anim.checkCards('thumbs-grid', 'library-entry-thumbs');
    window._anim.checkCards('graphic-grid', 'library-entry-graphic');
  });

})();