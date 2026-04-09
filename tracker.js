(function () {
  var FUNCTION_URL = '/.netlify/functions/track';

  // ── SESSION ──
  var sessionId = sessionStorage.getItem('sid');
  if (!sessionId) {
    sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('sid', sessionId);
  }

  var page = window.location.pathname.split('/').pop() || 'index.html';
  var referrer = document.referrer || '';
  var ref = new URLSearchParams(window.location.search).get('r') ||
            sessionStorage.getItem('ref') || '';
  if (ref) sessionStorage.setItem('ref', ref);

  var startTime = parseInt(sessionStorage.getItem('startTime') || '0');
  if (!startTime) {
    startTime = Date.now();
    sessionStorage.setItem('startTime', String(startTime));
  }

  var finalSent = false;

  // ── PAGE SEQUENCE ──
  var pageSequence = JSON.parse(sessionStorage.getItem('pageSeq') || '[]');
  if (!pageSequence.includes(page)) {
    pageSequence.push(page);
    sessionStorage.setItem('pageSeq', JSON.stringify(pageSequence));
  }

  // ── CLICK TRACKING ──
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a, button');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var text = (el.innerText || el.textContent || '').trim().slice(0, 60);
    if (!text) return;
    var allClicked = JSON.parse(sessionStorage.getItem('allClicked') || '[]');
    var already = allClicked.find(function (x) { return x.text === text && x.page === page; });
    if (!already) {
      allClicked.push({ text: text, href: href, page: page });
      sessionStorage.setItem('allClicked', JSON.stringify(allClicked));
    }
  });

  // ── INACTIVITY TIMER ──
  // for testing: 
  // var INACTIVITY_MS = 25 * 1000; // 10 seconds
  // var inactivityTimer = null;
  var INACTIVITY_MS = 15 * 60 * 1000;
  var inactivityTimer = null;

  function resetInactivity() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(sendFinal, INACTIVITY_MS);
  }

  ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(function (evt) {
    window.addEventListener(evt, resetInactivity, { passive: true });
  });

  resetInactivity();

  // ── SEND FINAL (Notif 2) ──
  function sendFinal() {
    if (finalSent) return;
    finalSent = true;
    var duration = Math.round((Date.now() - startTime) / 1000);
    var allClicked = JSON.parse(sessionStorage.getItem('allClicked') || '[]');
    var pages = JSON.parse(sessionStorage.getItem('pageSeq') || '[' + JSON.stringify(page) + ']');
    var payload = {
      session_id: sessionId,
      page: page,
      pages: pages,
      referrer: referrer,
      ref: ref,
      user_agent: navigator.userAgent,
      duration: duration,
      links_clicked: allClicked,
      final: true
    };
    var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(FUNCTION_URL, blob);
    } else {
      fetch(FUNCTION_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }, keepalive: true });
    }
    // Clear session so next visit starts fresh
    sessionStorage.clear();
  }

  // ── NOTIF 1 (pageview — fires once per session) ──
  var notif1Sent = sessionStorage.getItem('notif1Sent');
  if (!notif1Sent) {
    sessionStorage.setItem('notif1Sent', '1');
    fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        page: page,
        referrer: referrer,
        ref: ref,
        user_agent: navigator.userAgent,
        duration: 0,
        links_clicked: [],
        event: 'pageview'
      })
    });
  }

})();