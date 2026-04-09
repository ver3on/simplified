(function () {

  var animClasses = `
    .cap-hero-anim, .art-hero-anim { opacity: 0; transition: opacity 0.45s ease, transform 0.45s ease; }
    .cap-hero-anim.hidden-left, .art-hero-anim.hidden-left   { opacity: 0; transform: translateX(-40px); }
    .cap-hero-anim.hidden-right, .art-hero-anim.hidden-right { opacity: 0; transform: translateX(50px); }
    .cap-hero-anim.shown, .art-hero-anim.shown               { opacity: 1; transform: translateX(0); }
    .cap-hero-anim.shown.d1, .art-hero-anim.shown.d1 { transition-delay: 0s; }
    .cap-hero-anim.shown.d2, .art-hero-anim.shown.d2 { transition-delay: 0.07s; }
    .cap-hero-anim.shown.d3, .art-hero-anim.shown.d3 { transition-delay: 0.14s; }

    .library-entry-captioning.card-hidden  { opacity: 0; transform: translateX(-28px); }
    .library-entry-captioning.card-partial { opacity: 0.35; transform: translateX(0); }
    .library-entry-captioning.card-in      { opacity: 1; transform: translateX(0); }
    .library-entry-captioning.card-out     { opacity: 0; transform: translateX(40px); }

    .library-entry-artists.card-hidden  { opacity: 0; transform: translateX(-28px); }
    .library-entry-artists.card-partial { opacity: 0.35; transform: translateX(0); }
    .library-entry-artists.card-in      { opacity: 1; transform: translateX(0); }
    .library-entry-artists.card-out     { opacity: 0; transform: translateX(40px); }
  `;

  var styleTag = document.createElement('style');
  styleTag.textContent = animClasses;
  document.head.appendChild(styleTag);

})();