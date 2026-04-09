const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // must be service role, not anon key
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const { action, password, ...data } = body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    let result;

    switch (action) {

      // ── Settings / Toggles ──────────────────────────────────────────────────
      case 'get-settings': {
        const { data: rows, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-setting': {
        const { error } = await supabase
          .from('settings')
          .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
        await logActivity(`Updated setting: ${data.key}`);
        result = { success: true };
        break;
      }

      // ── Site Content ────────────────────────────────────────────────────────
      case 'get-site-content': {
        const { data: rows, error } = await supabase.from('site_content').select('*');
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-site-content': {
        const { error } = await supabase
          .from('site_content')
          .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
        await logActivity(`Updated content: ${data.key}`);
        result = { success: true };
        break;
      }

      // ── Samples ─────────────────────────────────────────────────────────────
      case 'get-samples': {
        const { data: rows, error } = await supabase
          .from('samples').select('*').eq('deleted', false).order('sort_order');
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-sample': {
        const sortOrder = await getNextSortOrder('samples');
        const { data: rows, error } = await supabase
          .from('samples')
          .insert({ ...data.data, sort_order: data.data.sort_order ?? sortOrder })
          .select();
        if (error) throw error;
        await logActivity('Added captioning sample', data.data.title);
        result = rows;
        break;
      }

      case 'update-sample': {
        const { error } = await supabase
          .from('samples')
          .update({ ...data.data, updated_at: new Date().toISOString() })
          .eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated captioning sample', data.data.title || data.id);
        result = { success: true };
        break;
      }

      case 'delete-sample': {
        const { data: s, error: fetchErr } = await supabase
          .from('samples').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        const { error: trashErr } = await supabase.from('trash').insert({
          source_table: 'samples',
          source_id: data.id,
          data: s,
          deleted_at: new Date().toISOString()
        });
        if (trashErr) throw trashErr;
        const { error } = await supabase
          .from('samples').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted captioning sample', s.title);
        result = { success: true };
        break;
      }

      // ── Artist Samples ───────────────────────────────────────────────────────
      case 'get-artist-samples': {
        const { data: rows, error } = await supabase
          .from('artist_samples').select('*').eq('deleted', false).order('sort_order');
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-artist-sample': {
        const sortOrder = await getNextSortOrder('artist_samples');
        const { data: rows, error } = await supabase
          .from('artist_samples')
          .insert({ ...data.data, sort_order: data.data.sort_order ?? sortOrder })
          .select();
        if (error) throw error;
        await logActivity('Added artist feature', data.data.title);
        result = rows;
        break;
      }

      case 'update-artist-sample': {
        const { error } = await supabase
          .from('artist_samples')
          .update({ ...data.data, updated_at: new Date().toISOString() })
          .eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated artist feature', data.data.title || data.id);
        result = { success: true };
        break;
      }

      case 'delete-artist-sample': {
        const { data: a, error: fetchErr } = await supabase
          .from('artist_samples').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        const { error: trashErr } = await supabase.from('trash').insert({
          source_table: 'artist_samples',
          source_id: data.id,
          data: a,
          deleted_at: new Date().toISOString()
        });
        if (trashErr) throw trashErr;
        const { error } = await supabase
          .from('artist_samples').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted artist feature', a.title);
        result = { success: true };
        break;
      }

      // ── Testimonials ─────────────────────────────────────────────────────────
      case 'get-testimonials': {
        const { data: rows, error } = await supabase
          .from('testimonials').select('*').eq('deleted', false).order('created_at', { ascending: false });
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-testimonial': {
        const { data: rows, error } = await supabase
          .from('testimonials').insert(data.data).select();
        if (error) throw error;
        await logActivity('Added testimonial', '@' + data.data.name);
        result = rows;
        break;
      }

      case 'update-testimonial': {
        const { error } = await supabase
          .from('testimonials')
          .update({ ...data.data, updated_at: new Date().toISOString() })
          .eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated testimonial', data.data.name || data.id);
        result = { success: true };
        break;
      }

      case 'delete-testimonial': {
        const { data: t, error: fetchErr } = await supabase
          .from('testimonials').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        const { error: trashErr } = await supabase.from('trash').insert({
          source_table: 'testimonials',
          source_id: data.id,
          data: t,
          deleted_at: new Date().toISOString()
        });
        if (trashErr) throw trashErr;
        const { error } = await supabase
          .from('testimonials').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted testimonial', t.name);
        result = { success: true };
        break;
      }

      // ── Rates ────────────────────────────────────────────────────────────────
      // Stored as a single JSON row. First load seeds from rates-data.js structure.
      case 'get-rates': {
        const { data: row, error } = await supabase
          .from('rates').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (error) throw error;
        // Return the data field (the JSON blob), or null so the front end can show empty state
        result = row ? row.data : null;
        break;
      }

      case 'save-rates': {
        // Check if a row already exists
        const { data: existing } = await supabase.from('rates').select('id').limit(1).maybeSingle();
        if (existing) {
          const { error } = await supabase
            .from('rates').update({ data: data.data, updated_at: new Date().toISOString() }).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('rates').insert({ data: data.data });
          if (error) throw error;
        }
        await logActivity('Updated rates');
        result = { success: true };
        break;
      }

      // ── Notes ────────────────────────────────────────────────────────────────
      // Multiple notes — each save creates a new row, delete removes by id
      case 'get-notes': {
        const { data: rows, error } = await supabase
          .from('notes').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-notes': {
        const { error } = await supabase.from('notes').insert({ text: data.content });
        if (error) throw error;
        await logActivity('Added note');
        result = { success: true };
        break;
      }

      case 'delete-note': {
        const { error } = await supabase.from('notes').delete().eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted note');
        result = { success: true };
        break;
      }

      // ── Visitors ─────────────────────────────────────────────────────────────
      // Rows already store pages[] and clicked[] arrays — no grouping needed
      case 'get-visitors': {
        const { data: rows, error } = await supabase
          .from('visitors').select('*').order('visited_at', { ascending: false }).limit(100);
        if (error) throw error;
        result = rows;
        break;
      }

      // ── Stats ────────────────────────────────────────────────────────────────
      case 'get-stats': {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const { count, error } = await supabase
          .from('visitors').select('*', { count: 'exact', head: true })
          .gte('visited_at', monthStart.toISOString());
        if (error) throw error;

        // Top page: tally all pages arrays
        const { data: allVisits } = await supabase.from('visitors').select('pages, clicked');
        const pageCounts = {};
        const clickCounts = {};
        (allVisits || []).forEach(v => {
          (v.pages || []).forEach(p => { pageCounts[p] = (pageCounts[p] || 0) + 1; });
          (v.clicked || []).forEach(c => { clickCounts[c] = (clickCounts[c] || 0) + 1; });
        });
        const topPage = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
        const topClick = Object.entries(clickCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

        result = { monthlyVisits: count || 0, topPage, topClick };
        break;
      }

      // ── Pitches ──────────────────────────────────────────────────────────────
      case 'get-pitches': {
        const { data: rows, error } = await supabase
          .from('pitches').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-pitch': {
        const { data: rows, error } = await supabase.from('pitches').insert(data.data).select();
        if (error) throw error;
        await logActivity('Generated pitch link', '@' + data.data.handle);
        result = rows;
        break;
      }

      // ── Thumbnails ────────────────────────────────────────────────────────────
      case 'get-thumbnails': {
        const { data: rows, error } = await supabase
          .from('thumbnails').select('*').eq('deleted', false).order('sort_order');
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-thumbnail': {
        const sortOrder = await getNextSortOrder('thumbnails');
        const { data: rows, error } = await supabase
          .from('thumbnails')
          .insert({ ...data.data, sort_order: data.data.sort_order ?? sortOrder })
          .select();
        if (error) throw error;
        await logActivity('Added thumbnail', data.data.title);
        result = rows;
        break;
      }

      case 'update-thumbnail': {
        const { error } = await supabase
          .from('thumbnails')
          .update({ ...data.data, updated_at: new Date().toISOString() })
          .eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated thumbnail', data.data.title || data.id);
        result = { success: true };
        break;
      }

      case 'delete-thumbnail': {
        const { data: th, error: fetchErr } = await supabase
          .from('thumbnails').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        const { error: trashErr } = await supabase.from('trash').insert({
          source_table: 'thumbnails',
          source_id: data.id,
          data: th,
          deleted_at: new Date().toISOString()
        });
        if (trashErr) throw trashErr;
        const { error } = await supabase
          .from('thumbnails').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted thumbnail', th.title);
        result = { success: true };
        break;
      }

      // ── Graphic Designs ───────────────────────────────────────────────────────
      case 'get-graphic-designs': {
        const { data: rows, error } = await supabase
          .from('graphic_designs').select('*').eq('deleted', false).order('sort_order');
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-graphic-design': {
        const sortOrder = await getNextSortOrder('graphic_designs');
        const { data: rows, error } = await supabase
          .from('graphic_designs')
          .insert({ ...data.data, sort_order: data.data.sort_order ?? sortOrder })
          .select();
        if (error) throw error;
        await logActivity('Added graphic design');
        result = rows;
        break;
      }

      case 'update-graphic-design': {
        const { error } = await supabase
          .from('graphic_designs')
          .update({ ...data.data, updated_at: new Date().toISOString() })
          .eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated graphic design', data.data.title || data.id);
        result = { success: true };
        break;
      }

      // ── Works ─────────────────────────────────────────────────────────────────
      case 'get-works': {
        const { data: rows, error } = await supabase
          .from('works').select('*').eq('deleted', false).order('sort_order');
        if (error) throw error;
        result = rows;
        break;
      }

      case 'save-work': {
        const sortOrder = await getNextSortOrder('works');
        const { data: rows, error } = await supabase
          .from('works')
          .insert({ ...data.data, sort_order: data.data.sort_order ?? sortOrder })
          .select();
        if (error) throw error;
        await logActivity('Added work', data.data.title);
        result = rows;
        break;
      }

      case 'update-work': {
        const { error } = await supabase
          .from('works')
          .update({ ...data.data, updated_at: new Date().toISOString() })
          .eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated work', data.data.title || data.id);
        result = { success: true };
        break;
      }

      case 'delete-work': {
        const { data: w, error: fetchErr } = await supabase
          .from('works').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        const { error: trashErr } = await supabase.from('trash').insert({
          source_table: 'works',
          source_id: data.id,
          data: w,
          deleted_at: new Date().toISOString()
        });
        if (trashErr) throw trashErr;
        const { error } = await supabase
          .from('works').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted work', w.title);
        result = { success: true };
        break;
      }

      // ── Stats ────────────────────────────────────────────────────────────────
      case 'get-stats-cards': {
        const { data: rows, error } = await supabase
          .from('stats').select('*').eq('deleted', false).order('sort_order');
        if (error) throw error;
        result = rows;
        break;
      }
      case 'save-stat': {
        const sortOrder = await getNextSortOrder('stats');
        const { data: rows, error } = await supabase
          .from('stats')
          .insert({ ...data.data, sort_order: data.data.sort_order ?? sortOrder }).select();
        if (error) throw error;
        await logActivity('Added stat', data.data.label);
        result = rows;
        break;
      }
      case 'update-stat': {
        const { error } = await supabase
          .from('stats')
          .update({ ...data.data, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated stat', data.data.label || data.id);
        result = { success: true };
        break;
      }
      case 'delete-stat': {
        const { data: st, error: fetchErr } = await supabase
          .from('stats').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        await supabase.from('trash').insert({ source_table: 'stats', source_id: data.id, data: st, deleted_at: new Date().toISOString() });
        const { error } = await supabase
          .from('stats').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted stat', st.label);
        result = { success: true };
        break;
      }

      // ── Library Cards ────────────────────────────────────────────────────────
      case 'get-library-cards': {
        const { data: rows, error } = await supabase
          .from('library_cards').select('*').eq('deleted', false).order('sort_order');
        if (error) throw error;
        result = rows;
        break;
      }
      case 'save-library-card': {
        const sortOrder = await getNextSortOrder('library_cards');
        const { data: rows, error } = await supabase
          .from('library_cards')
          .insert({ ...data.data, sort_order: data.data.sort_order ?? sortOrder }).select();
        if (error) throw error;
        await logActivity('Added library card', data.data.title);
        result = rows;
        break;
      }
      case 'update-library-card': {
        const { error } = await supabase
          .from('library_cards')
          .update({ ...data.data, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated library card', data.data.title || data.id);
        result = { success: true };
        break;
      }
      case 'delete-library-card': {
        const { data: lc, error: fetchErr } = await supabase
          .from('library_cards').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        await supabase.from('trash').insert({ source_table: 'library_cards', source_id: data.id, data: lc, deleted_at: new Date().toISOString() });
        const { error } = await supabase
          .from('library_cards').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted library card', lc.title);
        result = { success: true };
        break;
      }

      // ── Services ─────────────────────────────────────────────────────────────
      case 'get-services': {
        const { data: rows, error } = await supabase
          .from('services').select('*').eq('deleted', false).order('sort_order');
        if (error) throw error;
        result = rows;
        break;
      }
      case 'save-service': {
        const sortOrder = await getNextSortOrder('services');
        const { data: rows, error } = await supabase
          .from('services')
          .insert({ ...data.data, sort_order: data.data.sort_order ?? sortOrder }).select();
        if (error) throw error;
        await logActivity('Added service', data.data.name);
        result = rows;
        break;
      }
      case 'update-service': {
        const { error } = await supabase
          .from('services')
          .update({ ...data.data, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated service', data.data.name || data.id);
        result = { success: true };
        break;
      }
      case 'delete-service': {
        const { data: sv, error: fetchErr } = await supabase
          .from('services').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        await supabase.from('trash').insert({ source_table: 'services', source_id: data.id, data: sv, deleted_at: new Date().toISOString() });
        const { error } = await supabase
          .from('services').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted service', sv.name);
        result = { success: true };
        break;
      }

      // ── Tools ────────────────────────────────────────────────────────────────
      case 'get-tools': {
        const { data: rows, error } = await supabase
          .from('tools').select('*').eq('deleted', false).order('sort_order');
        if (error) throw error;
        result = rows;
        break;
      }
      case 'save-tool': {
        const sortOrder = await getNextSortOrder('tools');
        const { data: rows, error } = await supabase
          .from('tools')
          .insert({ ...data.data, sort_order: data.data.sort_order ?? sortOrder }).select();
        if (error) throw error;
        await logActivity('Added tool', data.data.name);
        result = rows;
        break;
      }
      case 'update-tool': {
        const { error } = await supabase
          .from('tools')
          .update({ ...data.data, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated tool', data.data.name || data.id);
        result = { success: true };
        break;
      }
      case 'delete-tool': {
        const { data: tl, error: fetchErr } = await supabase
          .from('tools').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        await supabase.from('trash').insert({ source_table: 'tools', source_id: data.id, data: tl, deleted_at: new Date().toISOString() });
        const { error } = await supabase
          .from('tools').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted tool', tl.name);
        result = { success: true };
        break;
      }

      case 'delete-graphic-design': {
        const { data: gd, error: fetchErr } = await supabase
          .from('graphic_designs').select('*').eq('id', data.id).single();
        if (fetchErr) throw fetchErr;
        const { error: trashErr } = await supabase.from('trash').insert({
          source_table: 'graphic_designs',
          source_id: data.id,
          data: gd,
          deleted_at: new Date().toISOString()
        });
        if (trashErr) throw trashErr;
        const { error } = await supabase
          .from('graphic_designs').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted graphic design');
        result = { success: true };
        break;
      }

      case 'update-pitch': {
        const { error } = await supabase
          .from('pitches')
          .update({ ...data.data, updated_at: new Date().toISOString() })
          .eq('id', data.id);
        if (error) throw error;
        await logActivity('Updated pitch status', data.data.status || data.id);
        result = { success: true };
        break;
      }

      case 'delete-pitch': {
        const { error } = await supabase.from('pitches').delete().eq('id', data.id);
        if (error) throw error;
        await logActivity('Deleted pitch', data.id);
        result = { success: true };
        break;
      }

      // ── Activity Log ─────────────────────────────────────────────────────────
      case 'clear-activity': {
        const { error } = await supabase.from('activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        result = { success: true };
        break;
      }
      
      case 'get-activity': {
        const { data: rows, error } = await supabase
          .from('activity_log').select('*')
          .order('created_at', { ascending: false })
          .limit(data.limit || 50);
        if (error) throw error;
        result = rows;
        break;
      }

      // ── Trash ────────────────────────────────────────────────────────────────
      case 'get-trash': {
        const { data: rows, error } = await supabase
          .from('trash').select('*')
          .eq('source_table', data.table)
          .order('deleted_at', { ascending: false });
        if (error) throw error;
        result = rows;
        break;
      }

      case 'restore-from-trash': {
        const { data: item, error: fetchErr } = await supabase
          .from('trash').select('*').eq('id', data.trashId).single();
        if (fetchErr) throw fetchErr;
        const { error: restoreErr } = await supabase
          .from(item.source_table)
          .update({ deleted: false, updated_at: new Date().toISOString() })
          .eq('id', item.source_id);
        if (restoreErr) throw restoreErr;
        const { error: deleteErr } = await supabase.from('trash').delete().eq('id', data.trashId);
        if (deleteErr) throw deleteErr;
        await logActivity('Restored from trash', item.data?.title || item.data?.name || item.source_table);
        result = { success: true };
        break;
      }

      case 'empty-trash': {
        const { error } = await supabase.from('trash').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        await logActivity('Emptied trash');
        result = { success: true };
        break;
      }

      case 'permanent-delete': {
        const { data: item } = await supabase.from('trash').select('*').eq('id', data.trashId).single();
        const { error } = await supabase.from('trash').delete().eq('id', data.trashId);
        if (error) throw error;
        await logActivity('Permanently deleted', item?.data?.title || item?.data?.name || '');
        result = { success: true };
        break;
      }

      case 'upload-thumb': {
  const { filename, fileBase64, mimeType, bucket = 'thumbnails' } = data;
  const fileBuffer = Buffer.from(fileBase64, 'base64');
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, fileBuffer, { contentType: mimeType, upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename);
  result = { publicUrl };
  break;
}

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action: ' + action }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result ?? { success: true }) };

  } catch (err) {
    console.error('[admin]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function logActivity(action, details = '') {
  await supabase.from('activity_log').insert({ action, details });
}

async function getNextSortOrder(table) {
  const { data } = await supabase
    .from(table).select('sort_order').eq('deleted', false)
    .order('sort_order', { ascending: false }).limit(1);
  return (data?.[0]?.sort_order ?? 0) + 1;
}
