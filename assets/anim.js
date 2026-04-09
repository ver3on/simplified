(function () {

  // ── Hero ──
  var heroEls = document.querySelectorAll('.hero-anim');
  var heroSection = document.getElementById('hero');
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
    var bottom = heroSection.getBoundingClientRect().bottom;
    var past = bottom < window.innerHeight * 0.2;
    if (past && heroVisible) {
      heroVisible = false;
      setHeroHidden('right');
    } else if (!past && !heroVisible) {
      heroVisible = true;
      setHeroHidden('left');
      setTimeout(setHeroVisible, 20);
    }
  }

  // ── Reveals ──
  var reveals = document.querySelectorAll('.reveal');

  function checkReveals() {
    reveals.forEach(function(el) {
      var r = el.getBoundingClientRect();
      var aboveScreen = r.bottom < window.innerHeight * 0.12;
      var belowScreen = r.top > window.innerHeight * 0.95;
      if (aboveScreen || belowScreen) {
        el.classList.remove('shown');
        el.classList.add('hidden-down');
      } else {
        el.classList.add('shown');
        el.classList.remove('hidden-down');
      }
    });
  }

  // ── Contact ──
  var cLeft = document.querySelector('.c-left');
  var cRight = document.querySelector('.c-right');

  function checkContact() {
    var s = document.getElementById('contact');
    var r = s.getBoundingClientRect();
    var inView = r.top < window.innerHeight * 0.9 && r.bottom > 50;
    if (cLeft) {
      cLeft.classList.toggle('shown', inView);
      cLeft.classList.toggle('hidden-left', !inView);
    }
    if (cRight) {
      cRight.classList.toggle('shown', inView);
      cRight.classList.toggle('hidden-right', !inView);
    }
  }

  // ── Stat cards ──
  var statInView = [];

  function checkStatCards() {
    document.querySelectorAll('.stat[data-count]').forEach(function(el, i) {
      var r = el.getBoundingClientRect();
      var inView = r.top < window.innerHeight * 0.95 && r.bottom > window.innerHeight * 0.05;
      var aboveView = r.bottom < window.innerHeight * 0.05;
      var wasIn = statInView[i];
      if (inView && !wasIn) {
        statInView[i] = true;
        setTimeout(function() {
          el.classList.remove('card-hidden', 'card-out');
          el.classList.add('card-in');
        }, i * 80);
      } else if (aboveView && wasIn) {
        statInView[i] = false;
        setTimeout(function() {
          el.classList.remove('card-in', 'card-hidden');
          el.classList.add('card-out');
        }, i * 60);
      } else if (r.top > window.innerHeight * 0.95) {
        statInView[i] = false;
        el.classList.remove('card-in', 'card-out');
        el.classList.add('card-hidden');
      }
    });
  }

  // ── Caption cards ──
  function checkCaptionCards() {
    document.querySelectorAll('#caption-grid .caption-card').forEach(function(card) {
      var r = card.getBoundingClientRect();
      var idx = parseInt(card.dataset.idx) || 0;
      var inView = r.top < window.innerHeight * 0.95 && r.bottom > window.innerHeight * 0.05;
      var aboveView = r.bottom < window.innerHeight * 0.05;
      if (inView) {
        card.style.transitionDelay = (idx * 0.1) + 's';
        card.classList.remove('card-hidden', 'card-out');
        card.classList.add('card-in');
      } else if (aboveView) {
        card.style.transitionDelay = '0s';
        card.classList.remove('card-in', 'card-hidden');
        card.classList.add('card-out');
      }
    });
  }

  // ── Count-up ──
  var statEls = document.querySelectorAll('.stat[data-count]');
  var counted = [];

  function countUp(el, i) {
    var valueEl = el.querySelector('.stat-value');
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var isFloat = target % 1 !== 0;
    var duration = 1000;
    var steps = 35;
    var step = 0;
    setTimeout(function() {
      el.classList.add('active');
      var timer = setInterval(function() {
        step++;
        var p = 1 - Math.pow(1 - step / steps, 3);
        var val = target * p;
        valueEl.textContent = (isFloat ? val.toFixed(1) : Math.round(val)) + suffix;
        if (step >= steps) {
          clearInterval(timer);
          valueEl.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
        }
      }, duration / steps);
    }, i * 70);
  }

  function checkStats() {
    statEls.forEach(function(el, i) {
      var r = el.getBoundingClientRect();
      var inView = r.top < window.innerHeight * 0.9 && r.bottom > 0;
      if (inView && !counted.includes(el)) {
        counted.push(el);
        countUp(el, i);
      } else if (!inView && counted.includes(el)) {
        counted.splice(counted.indexOf(el), 1);
        el.classList.remove('active');
        el.querySelector('.stat-value').textContent = '0' + (el.dataset.suffix || '');
      }
    });
  }

  // ── Animation CSS classes ──
  var animClasses = `
    .hero-anim { opacity: 0; transition: opacity 0.45s ease, transform 0.45s ease; }
    .hero-anim.hidden-left { opacity: 0; transform: translateX(-40px); transition-delay: 0s; }
    .hero-anim.hidden-right { opacity: 0; transform: translateX(50px); transition-delay: 0s; }
    .hero-anim.shown { opacity: 1; transform: translateX(0); }
    .hero-anim.shown.d1 { transition-delay: 0s; }
    .hero-anim.shown.d2 { transition-delay: 0.07s; }
    .hero-anim.shown.d3 { transition-delay: 0.14s; }
    .hero-anim.shown.d4 { transition-delay: 0.21s; }
    .hero-anim.shown.d5 { transition-delay: 0.28s; }

    .reveal { transition: opacity 0.4s ease, transform 0.4s ease; }
    .reveal.hidden-down { opacity: 0; transform: translateY(24px); transition: opacity 0.55s ease, transform 0.55s ease; }
    .reveal.shown { opacity: 1; transform: translateY(0); transition: opacity 0.55s ease, transform 0.55s ease; }

    .c-left { transition: opacity 0.5s ease, transform 0.5s ease; }
    .c-left.hidden-left { opacity: 0; transform: translateX(-50px); }
    .c-left.shown { opacity: 1; transform: translateX(0); }

    .c-right { transition: opacity 0.5s ease, transform 0.5s ease; }
    .c-right.hidden-right { opacity: 0; transform: translateX(50px); }
    .c-right.shown { opacity: 1; transform: translateX(0); }

    .stat.card-hidden { opacity: 0; transform: translateX(-30px); }
    .stat.card-in { opacity: 1 !important; transform: translateX(0); }
    .stat.card-out { opacity: 0; transform: translateX(40px); }

    .caption-card.card-hidden { opacity: 0; transform: translateX(-28px); }
    .caption-card.card-in { opacity: 1; transform: translateX(0); }
    .caption-card.card-out { opacity: 0; transform: translateX(40px); }

    .testimonial-card.animating { opacity: 0; transform: translateY(24px); }
    .testimonial-card.reveal-in { opacity: 1; transform: translateY(0); transition: opacity 0.55s ease, transform 0.55s ease; }
  `;

  var styleTag = document.createElement('style');
  styleTag.textContent = animClasses;
  document.head.appendChild(styleTag);

  // ── Init state ──
  heroEls.forEach(function(el) { el.classList.add('hidden-left'); });
  reveals.forEach(function(el) { el.classList.add('hidden-down'); });
  document.querySelectorAll('.stat[data-count]').forEach(function(el) { el.classList.add('card-hidden'); });
  if (cLeft) cLeft.classList.add('hidden-left');
  if (cRight) cRight.classList.add('hidden-right');

  // ── makeHeroController (shared with sub-pages) ──
  function makeHeroController(selector) {
    var els = document.querySelectorAll(selector);
    var section = els.length ? els[0].closest('section') : null;
    var visible = false;

    function setHidden(dir) {
      els.forEach(function(el) {
        el.classList.remove('hidden-left', 'hidden-right', 'shown');
        el.classList.add(dir === 'right' ? 'hidden-right' : 'hidden-left');
      });
    }

    function setVisible() {
      els.forEach(function(el) {
        el.classList.remove('hidden-left', 'hidden-right');
        el.classList.add('shown');
      });
    }

    function check() {
      if (!section) return;
      var bottom = section.getBoundingClientRect().bottom;
      var past = bottom < window.innerHeight * 0.2;
      if (past && visible) {
        visible = false;
        setHidden('right');
      } else if (!past && !visible) {
        visible = true;
        setHidden('left');
        setTimeout(setVisible, 20);
      }
    }

    els.forEach(function(el) { el.classList.add('hidden-left'); });
    setTimeout(function() {
      visible = true;
      setHidden('left');
      setTimeout(setVisible, 20);
    }, 100);

    return { check: check };
  }

  // ── checkCards (shared with sub-pages) ──
  function checkCards(gridId, entryClass) {
    var cards = document.querySelectorAll('#' + gridId + ' .' + entryClass);
    cards.forEach(function(card) {
      var r = card.getBoundingClientRect();
      var idx = parseInt(card.dataset.idx) || 0;
      var fullyIn  = r.top >= 0 && r.bottom <= window.innerHeight;
      var partlyIn = r.top < window.innerHeight && r.bottom > 0;
      var aboveView = r.bottom < 0;
      if (fullyIn) {
        card.style.transitionDelay = (idx * 0.08) + 's';
        card.classList.remove('card-hidden', 'card-out', 'card-partial');
        card.classList.add('card-in');
      } else if (partlyIn) {
        card.style.transitionDelay = '0s';
        card.classList.remove('card-hidden', 'card-out', 'card-in');
        card.classList.add('card-partial');
      } else if (aboveView) {
        card.style.transitionDelay = '0s';
        card.classList.remove('card-in', 'card-hidden', 'card-partial');
        card.classList.add('card-out');
      }
    });
  }

  // ── Expose ──
  window._anim = {
    checkCaptionCards: checkCaptionCards,
    checkHero: checkHero,
    checkReveals: checkReveals,
    checkContact: checkContact,
    checkStats: checkStats,
    checkStatCards: checkStatCards,
    makeHeroController: makeHeroController,
    checkCards: checkCards
  };

})();