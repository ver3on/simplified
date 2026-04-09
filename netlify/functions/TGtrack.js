const { createClient } = require('@supabase/supabase-js');

function formatDuration(seconds) {
  if (!seconds || seconds < 1) return '< 1s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

exports.handler = async function (event) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Not Allowed' };

  try {
    const payload = JSON.parse(event.body);
    const { session_id, page, pages, duration, links_clicked, user_agent, ref, event: evtType, final } = payload;
    
    const visitorIp = event.headers['x-nf-client-connection-ip']
               || event.headers['x-forwarded-for']?.split(',')[0].trim()
               || '';

const { data: blocked } = await supabase
  .from('blocked_ips')
  .select('ip')
  .eq('ip', visitorIp)
  .maybeSingle();

if (blocked) return { statusCode: 200, headers, body: 'ok' };
    const country = event.headers['x-country'] || event.headers['cf-ipcountry'] || 'Unknown';
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const clickedTexts = (links_clicked || []).map(l => l.text).filter(Boolean);
    const pageLabel = page || 'index.html';
    const pageList = pages || [pageLabel];

    // ── UPSERT VISITOR ──
    const { data: existing } = await supabase
      .from('visitors')
      .select('id, pages, clicked')
      .eq('id', session_id)
      .maybeSingle();

    if (existing) {
      const mergedPages = [...new Set([...(existing.pages || []), ...pageList])];
      const mergedClicked = [...new Set([...(existing.clicked || []), ...clickedTexts])];
      await supabase.from('visitors').update({
        duration: duration ? formatDuration(duration) : undefined,
        pages: mergedPages,
        clicked: mergedClicked,
        updated_at: new Date().toISOString()
      }).eq('id', session_id);
    } else {
      await supabase.from('visitors').insert({
        id: session_id,
        country,
        pages: pageList,
        clicked: clickedTexts,
        duration: duration ? formatDuration(duration) : '0s',
        visited_at: new Date().toISOString()
      });
    }

    // ── PAGEVIEW EVENT → NOTIFICATION 1 ──
    if (evtType === 'pageview' && ref) {
      const { data: pitch } = await supabase
        .from('pitches')
        .select('id, handle, platform, status, visit_count')
        .eq('ref_code', ref)
        .maybeSingle();

      if (pitch) {
        // Increment visit_count atomically
        const newCount = (pitch.visit_count || 0) + 1;
        await supabase
          .from('pitches')
          .update({
            status: 'opened',
            visit_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', pitch.id);

        const isRevisit = pitch.status === 'opened';
        const visitLabel = isRevisit ? 'revisited' : 'opened';

        if (botToken && chatId) {
          const msg = [
            isRevisit ? `<b>📍 REVISIT</b>` : `<b>📮 LINK OPENED</b>`,
            ``,
            `<b><u>${pitch.handle}</u> </b>${visitLabel} your ${pitch.platform} pitch`,
            `<code>country:</code> ${country}`,
            `<code>visit log:</code> ${newCount}`
          ].join('\n');

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
          });
        }
      } else if (botToken && chatId) {
        // No ref code match — generic visitor notification 1
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `👤<b> NEW VISITOR</b>\n\n<code>country:</code> ${country}\n<code>landing:</code> ${pageLabel.replace('.html','').toUpperCase().replace('INDEX','HOME')}`,
            parse_mode: 'HTML'
          })
        });
      }
    }

    // No ref but still a pageview — generic notif
    if (evtType === 'pageview' && !ref && botToken && chatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `👤<b> NEW VISITOR</b>\n\n<code>country:</code> ${country}\n<code>landing:</code> ${pageLabel.replace('.html','').toUpperCase().replace('INDEX','HOME')}`,
            parse_mode: 'HTML'
        })
      });
    }

    // ── FINAL EVENT → NOTIFICATION 2 ──
    if (final) {
      let handle = null;
      let platform = null;
      let visitCount = null;

      if (ref) {
        const { data: pitch } = await supabase
          .from('pitches')
          .select('handle, platform, visit_count')
          .eq('ref_code', ref)
          .maybeSingle();
        if (pitch) {
          handle = pitch.handle;
          platform = pitch.platform;
          visitCount = pitch.visit_count;
        }
      }

      if (botToken && chatId) {
        const cleanPage = p => p.replace('.html','').toUpperCase().replace('INDEX','HOME');
        const clickedLine = clickedTexts.length > 0
          ? `<code>clicked:</code> ${clickedTexts.join(', ')}`
          : `<code>clicked:</code> —`;
        const pagesLine = `<code>pages:</code> ${pageList.map(cleanPage).join(' → ')}`;
        const refLine = handle ? `@${handle} / ${platform}` : `direct visitor`;
        const visitLine = visitCount ? `<code>visit log:</code> ${visitCount}` : '';

        const lines = [
          `<b>📊 SESSION SUMMARY</b>`,
          `\n`,
          refLine,
          `<code>country:</code> ${country}`,
          `<code>duration:</code> ${formatDuration(duration)}`,
          pagesLine,
          clickedLine,
          visitLine
        ].filter(Boolean).join('\n');

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: 'HTML' })
        });
      }
    }

    return { statusCode: 200, headers, body: 'ok' };
  } catch (err) {
    console.error('[track]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};