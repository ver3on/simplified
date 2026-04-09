(function () {

  var SUPABASE_URL = document.querySelector('meta[name="sb-url"]') ? document.querySelector('meta[name="sb-url"]').content : '';
  var SUPABASE_ANON = document.querySelector('meta[name="sb-anon"]') ? document.querySelector('meta[name="sb-anon"]').content : '';

  function buildTierPrice(t) {
    if (t.isQuote) return '<div class="t-price is-quote">' + t.price + '</div>';
    var u = t.unit ? ' <span class="unit">' + t.unit + '</span>' : '';
    return '<div class="t-price">' + t.price + u + '</div>';
  }

  function buildTier(t) {
    var badge = t.badge ? ' <span class="badge">' + t.badge + '</span>' : '';
    var featured = t.featured ? ' t-featured' : '';
    return '<div class="t-row' + featured + '">'
      + '<div class="t-left"><div class="t-name">' + t.name + badge + '</div>'
      + '<div class="t-desc">' + t.desc + '</div></div>'
      + buildTierPrice(t)
      + '</div>';
  }

  function buildService(s) {
    var note = s.note ? '<p class="tier-note">' + s.note + '</p>' : '';
    return '<div class="drop-wrap block-gap">'
      + '<button class="drop-toggle" onclick="toggleDrop(\'' + s.id + '\',this)" aria-expanded="false">'
      + '<span class="drop-title">' + s.title + '</span>'
      + '<span class="drop-arrow">↓</span>'
      + '</button>'
      + '<div class="drop-body" id="' + s.id + '">'
      + '<div class="drop-body-inner">'
      + '<p class="drop-intro">' + s.intro + '</p>'
      + '<div class="tier-rows">' + s.tiers.map(buildTier).join('') + '</div>'
      + note
      + '</div></div></div>';
  }

  function buildAddon(a) {
    return '<div class="addon">'
      + '<div><div class="addon-name">' + a.name + '</div>'
      + '<div class="addon-detail">' + a.detail + '</div></div>'
      + '<div class="addon-price">' + a.price + '</div>'
      + '</div>';
  }

  function buildTermsSection(s) {
    return '<div class="ft-section">'
      + '<div class="ft-title">' + s.title + '</div>'
      + s.items.map(function(item) { return '<div class="ft-item">' + item + '</div>'; }).join('')
      + '</div>';
  }

  function applyRates(row) {
    var servicesList = document.getElementById('services-list');
    if (servicesList && row.services) servicesList.innerHTML = row.services.map(buildService).join('');
    var addonsGrid = document.getElementById('addons-grid');
    if (addonsGrid && row.addons) addonsGrid.innerHTML = row.addons.map(buildAddon).join('');
    var notesList = document.getElementById('notes-list');
    if (notesList && row.notes) notesList.innerHTML = row.notes.map(function(n) { return '<li>' + n + '</li>'; }).join('');
    var termsEl = document.getElementById('tcFullTerms');
    if (termsEl && row.terms) termsEl.innerHTML = row.terms.map(buildTermsSection).join('');
    if (window._ratesAnim) window._ratesAnim.checkCards();
  }

  var FALLBACK = {
    services: [
      { id: 'lfsfBody', title: 'Long-Form to Short-Form + Captions', intro: "Don't have a Shorts or Reels tab yet? Send me your long-form video and I'll cut it into short clips and add captions — all in one go. Editing fee is quoted per project based on video length and number of clips needed.", note: "Send your video and I'll reply with a quote within 24 hours.", tiers: [
        { name: 'Standard Captions', desc: 'Editing + phrases synced to audio, minimal styling', price: 'Custom quote', isQuote: true },
        { name: 'Word by Word Captions', desc: 'Editing + every word timed individually, plain style', price: 'Custom quote', isQuote: true },
        { name: 'Stylized Word by Word', desc: 'Editing + custom brand design with word-by-word timing', price: 'Custom quote', isQuote: true, featured: true, badge: 'Premium' }
      ]},
      { id: 'lfBody', title: 'Captioning for Long-Form', intro: "YouTube videos, podcasts, online courses, webinars. Rate is based on the video's total runtime, not edit time.", tiers: [
        { name: 'Standard', desc: 'Phrases or sentences synced to audio, clean minimal styling', price: '$2', unit: '/min' },
        { name: 'Word by Word', desc: 'Every word timed individually to speech, plain style', price: '$3.50', unit: '/min' },
        { name: 'Stylized Word by Word', desc: 'Custom brand design — fonts, colors, layout — with word-by-word timing. Includes a brand style consult before work begins.', price: '$5', unit: '/min', featured: true, badge: 'Premium' }
      ]},
      { id: 'sfBody', title: 'Captioning for Short-Form', intro: 'Already have finished short clips — TikToks, Reels, YouTube Shorts and just need captions added? Multiple clips are priced individually.', tiers: [
        { name: 'Standard', desc: 'Phrases synced to audio, minimal styling', price: '$10', unit: '/clip' },
        { name: 'Word by Word', desc: 'Every word timed individually, plain style', price: '$15', unit: '/clip' },
        { name: 'Stylized Word by Word', desc: 'Custom brand design + word-by-word timing. Includes a brand style consult before work begins.', price: '$20', unit: '/clip', featured: true, badge: 'Premium' }
      ]},
      { id: 'thumbBody', title: 'Thumbnails', intro: "Static YouTube thumbnails designed to match your channel's branding. Delivered as PNG or JPG. Turnaround: 1-2 business days.", note: 'Rush (same or next day): +50%.', tiers: [
        { name: 'Single Thumbnail', desc: 'One custom static thumbnail', price: '$8' },
        { name: '3 Thumbnails', desc: 'Save more, perfect for weekly series or A/B testing', price: '$22', featured: true, badge: 'Bundle' }
      ]}
    ],
    addons: [
      { name: 'Rush Turnaround', detail: 'Delivery within 48 hours', price: '+50%' },
      { name: 'Minimum Charge', detail: 'Long-form captioning edits only', price: '$10' },
      { name: 'Standard Turnaround', detail: 'Starts after deposit + materials received', price: '3-5 days' },
      { name: 'Payment', detail: '50% upfront · 50% on delivery', price: 'Wise / PayPal' }
    ],
    notes: [
      "Per-minute rates are based on the video's runtime, not edit time.",
      'Stylized tier includes a brand style consult — just send references and your channel link.',
      'One free revision included for timing corrections. Style changes after approval are quoted separately.',
      'File delivered in the same format as provided. Final file sent after remaining balance is received.'
    ],
    terms: [
      { title: 'Payment', items: ['50% deposit required before work begins. Final file delivered upon receipt of remaining balance.', 'Preferred payment via Wise. PayPal accepted if Wise is unavailable.', 'Work starts only after deposit and video materials have been received.'] },
      { title: 'File Delivery', items: ['Final file delivered in the same format as provided by the client.', 'Delivered via Google Drive, Mega, or WeTransfer.', 'Download link stays live for 7 days after delivery — please download within that window.', 'I do not keep a copy of the final file or any provided materials after 7 days of delivery.'] },
      { title: 'Revisions', items: ['1 free revision included — covers timing corrections and elements position only.', 'Revision requests must be made within 7 days of delivery. After that, the work is considered final.', 'Style or layout change requests after approval are quoted separately.'] },
      { title: 'Refunds', items: ['No refunds once work has begun. The 50/50 payment structure protects both parties.', 'If I am unable to complete the order, the deposit will be refunded in full.'] },
      { title: 'Right to Decline', items: ['I reserve the right to decline any order without explanation.'] }
    ]
  };

  if (SUPABASE_URL && SUPABASE_ANON) {
    fetch(SUPABASE_URL + '/rest/v1/rates?select=*&order=updated_at.desc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var row = Array.isArray(data) ? data[0] : data;
      var ratesData = (row && row.data) ? row.data : row;
      applyRates(ratesData && ratesData.services ? ratesData : FALLBACK);
    })
    .catch(function() { applyRates(FALLBACK); });
  } else {
    applyRates(FALLBACK);
  }

})();