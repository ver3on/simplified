(function () {

  window.toggleDrop = function(id, btn) {
    var body = document.getElementById(id);
    var open = body.classList.contains('open');
    body.classList.toggle('open', !open);
    btn.setAttribute('aria-expanded', String(!open));
    setTimeout(function() {
      if (window._ratesAnim) window._ratesAnim.checkCards();
    }, 20);
  };

  window.addEventListener('scroll', function() {
    if (window._ratesAnim) {
      window._ratesAnim.checkHero();
      window._ratesAnim.checkReveals();
      window._ratesAnim.checkCards();
    }
  }, { passive: true });

  setTimeout(function() {
    if (window._ratesAnim) {
      window._ratesAnim.checkHero();
      window._ratesAnim.checkReveals();
      window._ratesAnim.checkCards();
    }
  }, 150);

})();