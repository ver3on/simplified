(function () {

  var animClasses = `
    .thumb-hero-anim, .graphic-hero-anim { opacity: 0; transition: opacity 0.45s ease, transform 0.45s ease; }
    .thumb-hero-anim.hidden-left, .graphic-hero-anim.hidden-left   { opacity: 0; transform: translateX(-40px); }
    .thumb-hero-anim.hidden-right, .graphic-hero-anim.hidden-right { opacity: 0; transform: translateX(50px); }
    .thumb-hero-anim.shown, .graphic-hero-anim.shown               { opacity: 1; transform: translateX(0); }
    .thumb-hero-anim.shown.d1, .graphic-hero-anim.shown.d1 { transition-delay: 0s; }
    .thumb-hero-anim.shown.d2, .graphic-hero-anim.shown.d2 { transition-delay: 0.07s; }
    .thumb-hero-anim.shown.d3, .graphic-hero-anim.shown.d3 { transition-delay: 0.14s; }

    .library-entry-thumbs.card-hidden  { opacity: 0; transform: translateX(-28px); }
    .library-entry-thumbs.card-partial { opacity: 1; transform: translateX(0); }
    .library-entry-thumbs.card-in      { opacity: 1; transform: translateX(0); }
    .library-entry-thumbs.card-out     { opacity: 0; transform: translateX(40px); }

    .library-entry-graphic.card-hidden  { opacity: 0; transform: translateX(-28px); }
    .library-entry-graphic.card-partial { opacity: 0.35; transform: translateX(0); }
    .library-entry-graphic.card-in      { opacity: 1; transform: translateX(0); }
    .library-entry-graphic.card-out     { opacity: 0; transform: translateX(40px); }
  `;

  var styleTag = document.createElement('style');
  styleTag.textContent = animClasses;
  document.head.appendChild(styleTag);

})();