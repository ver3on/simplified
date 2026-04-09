(function () {

  var capHero = window._anim.makeHeroController('.cap-hero-anim');
  var artHero = window._anim.makeHeroController('.art-hero-anim');

  var sections = [
    { id: 'captioning', pill: document.querySelector('.back-pill[href="#captioning"]') },
    { id: 'artists',    pill: document.querySelector('.back-pill[href="#artists"]') }
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
    capHero.check();
    artHero.check();
    window._anim.checkReveals();
    window._anim.checkCards('captioning-grid', 'library-entry-captioning');
    window._anim.checkCards('artists-grid', 'library-entry-artists');
    updateActive();
  }, { passive: true });

  setTimeout(function() {
    window._anim.checkReveals();
    window._anim.checkCards('captioning-grid', 'library-entry-captioning');
    window._anim.checkCards('artists-grid', 'library-entry-artists');
    updateActive();
  }, 150);

})();