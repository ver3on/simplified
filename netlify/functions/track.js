const { createClient } = require('@supabase/supabase-js');

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscord(embed) {
  console.log('[discord] webhook url:', DISCORD_WEBHOOK);
  console.log('[discord] sending embed:', JSON.stringify(embed));
  const res = await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  });
  console.log('[discord] response status:', res.status);
}

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

    const clickedTexts = (links_clicked || []).map(l => l.text).filter(Boolean);
    const pageLabel = page || 'index.html';
    const pageList = pages || [pageLabel];
    const cleanPage = p => p.replace('.html', '').toUpperCase().replace('INDEX', 'HOME');

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

        if (DISCORD_WEBHOOK) {
          await sendDiscord({
            title: isRevisit ? '📍 REVISIT' : '📮 LINK OPENED',
            color: isRevisit ? 0xFFA500 : 0x0096FF,
            description: `**${pitch.handle}** ${visitLabel} your ${pitch.platform} pitch`,
            fields: [
              { name: '__COUNTRY__', value: country, inline: true },
              { name: '__VISIT LOG__', value: `${newCount}`, inline: true }
            ]
          });
        }
      } else if (DISCORD_WEBHOOK) {
        await sendDiscord({
          title: '👤 NEW VISITOR',
          color: 0x66FF00,
          fields: [
            { name: '__COUNTRY__', value: country, inline: true },
            { name: '__LANDING__', value: cleanPage(pageLabel), inline: true }
          ]
        });
      }
    }

    // ── NO REF PAGEVIEW → GENERIC NOTIF ──
    if (evtType === 'pageview' && !ref && DISCORD_WEBHOOK) {
      await sendDiscord({
        title: '👤 NEW VISITOR',
        color: 0x66FF00,
        fields: [
          { name: '__COUNTRY__', value: country, inline: true },
          { name: '__LANDING__', value: cleanPage(pageLabel), inline: true }
        ]
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

      if (DISCORD_WEBHOOK) {
        const pagesValue = pageList.map(cleanPage).map(p => `- ${p}`).join('\n');
        const clickedValue = clickedTexts.length > 0
          ? clickedTexts.map(t => `- ${t}`).join('\n')
          : '—';
        const refDesc = handle ? `**${handle}** / ${platform}` : 'Direct Visitor';

        await sendDiscord({
          title: '📊 SESSION SUMMARY',
          color: 0xFF0000,
          description: refDesc,
          fields: [
            { name: '__COUNTRY__', value: country, inline: true },
            { name: '__PAGES__', value: pagesValue, inline: true },
            { name: '__DURATION__', value: formatDuration(duration), inline: true },
            { name: '__CLICKED__', value: clickedValue, inline: false }
          ]
        });
      }
    }

    return { statusCode: 200, headers, body: 'ok' };
  } catch (err) {
    console.error('[track]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};