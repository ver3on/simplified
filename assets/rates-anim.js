(function () {

  var heroEls = document.querySelectorAll('.page-hero-anim');
  var heroSection = document.querySelector('.page-hero');
  var heroVisible = false;

  function setHeroHidden(dir) {
    heroEls.forEach(function(el) {
      el.classList.remove('hidden-left', 'hidden-right', 'shown');
      el.classList.add(dir === 'right' ? 'hidden-right' : 'hidden-left');
    });
  }

  function setHeroVisible() {
    heroEls.forEach(function(el) {
      el.classList.remove('hidden-left', 'hidden-right');
      el.classList.add('shown');
    });
  }

  function checkHero() {
    if (!heroSection) return;
    var past = heroSection.getBoundingClientRect().bottom < window.innerHeight * 0.05;
    if (past && heroVisible) { heroVisible = false; setHeroHidden('right'); }
    else if (!past && !heroVisible) { heroVisible = true; setHeroHidden('left'); setTimeout(setHeroVisible, 20); }
  }

  function checkCards() {
    var groups = [
      { els: document.querySelectorAll('.drop-wrap'), stagger: 0.07 },
      { els: document.querySelectorAll('.addon'), stagger: 0.07 },
      { els: document.querySelectorAll('.note-list li'), stagger: 0.07 }
    ];
    groups.forEach(function(g) {
      g.els.forEach(function(card, i) {
        var r = card.getBoundingClientRect();
        var inView    = r.top < window.innerHeight * 0.95 && r.bottom > window.innerHeight * 0.05;
        var aboveView = r.bottom < window.innerHeight * 0.05;
        var belowView = r.top > window.innerHeight * 0.95;
        if (inView) {
          card.style.transitionDelay = (i * g.stagger) + 's';
          card.classList.remove('card-hidden', 'card-out');
          card.classList.add('card-in');
        } else if (aboveView) {
          card.style.transitionDelay = '0s';
          card.classList.remove('card-in', 'card-hidden');
          card.classList.add('card-out');
        } else if (belowView) {
          card.style.transitionDelay = '0s';
          card.classList.remove('card-in', 'card-out');
          card.classList.add('card-hidden');
        }
      });
    });
  }

  var animClasses = `
    .page-hero-anim { opacity: 0; transition: opacity 0.45s ease, transform 0.45s ease; }
    .page-hero-anim.hidden-left  { opacity: 0; transform: translateX(-40px); }
    .page-hero-anim.hidden-right { opacity: 0; transform: translateX(50px); }
    .page-hero-anim.shown        { opacity: 1; transform: translateX(0); }
    .page-hero-anim.shown.d1 { transition-delay: 0s; }
    .page-hero-anim.shown.d2 { transition-delay: 0.07s; }
  `;

  var styleTag = document.createElement('style');
  styleTag.textContent = animClasses;
  document.head.appendChild(styleTag);

  heroEls.forEach(function(el) { el.classList.add('hidden-left'); });
  document.querySelectorAll('.drop-wrap, .addon, .note-list li').forEach(function(el) { el.classList.add('card-hidden'); });

  window._ratesAnim = {
    checkHero: checkHero,
    checkReveals: window._anim.checkReveals,
    checkCards: checkCards
  };

})();