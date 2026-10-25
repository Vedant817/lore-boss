/* Lore Boss operator UI (setup + mod queue).
   Endpoint contract: orchestration/cards/M4-01.md; types mirror src/types.ts.
   The only external URL shown here is the Twitch developer console, cited below.
   Comments: // docs: <url> appear next to anything that documents an external integration. */
(() => {
  'use strict';

  const TOKEN_KEY = 'loreboss.modToken';
  const POLL_INTERVAL_MS = 10000; // modest auto-refresh cadence; never more than one cycle in flight
  const state = {
    health: null,
    readiness: null,
    boss: null,
    lore: [],
    tab: 'pending',
    purgeTimer: 0,
    busy: false,
    connectBusy: false,
  };
  // Auto-refresh bookkeeping. renderEpoch invalidates in-flight loads: every mutation,
  // edit draft or evidence expansion bumps it so a slower poll can never overwrite
  // newer state or re-render away what a reviewer is looking at.
  let pollTimer = 0;
  let pollInFlight = false;
  let lastPollStart = 0;
  let lastSyncMs = 0;
  let renderEpoch = 0;
  const bumpEpoch = () => { renderEpoch += 1; };

  // ——— DOM helper: every dynamic value goes through textContent/createTextNode (no innerHTML). ———
  const el = (tag, attrs = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (k === 'on') for (const [type, fn] of Object.entries(v)) node.addEventListener(type, fn);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
    for (const kid of kids) {
      if (kid === null || kid === undefined || kid === false) continue;
      node.append(kid && typeof kid === 'object' && 'nodeType' in kid ? kid : document.createTextNode(String(kid)));
    }
    return node;
  };
  const $ = (id) => document.getElementById(id);
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  // ——— Token storage (sessionStorage only, never a URL). ———
  const getToken = () => sessionStorage.getItem(TOKEN_KEY) || '';
  const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t);
  const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

  // ——— API: every call checks res.ok and parses {error}; never assume success. ———
  async function api(path, { method = 'GET', body } = {}) {
    const init = { method, headers: {} };
    const token = getToken();
    if (token) init.headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(path, init);
    } catch {
      throw apiError('Cannot reach the Lore Boss server. Is `npm run dev` running?', 0);
    }
    let parsed = null;
    const text = await res.text();
    if (text) {
      try { parsed = JSON.parse(text); } catch { parsed = null; }
    }
    if (!res.ok) {
      const msg = parsed && typeof parsed.error === 'string' && parsed.error
        ? parsed.error
        : `Request failed (HTTP ${res.status}).`;
      throw apiError(msg, res.status);
    }
    if (parsed === null) {
      // A 200 with an empty or non-JSON body is malformed, never a fresh empty payload.
      throw apiError(`Server response was not valid JSON (HTTP ${res.status}).`, res.status);
    }
    return parsed;
  }
  const apiError = (message, status) => {
    const err = new Error(message);
    err.status = status;
    return err;
  };

  // ——— Banners (ARIA live; errors surfaced, not swallowed). ———
  let bannerTimer = 0;
  function note(message, kind = 'info') {
    const b = $('banner');
    b.textContent = message;
    b.className = `banner banner-${kind}`;
    if (bannerTimer) clearTimeout(bannerTimer);
    if (kind !== 'danger') bannerTimer = setTimeout(() => { b.textContent = ''; }, 6000);
  }
  const fail = (err, prefix) => {
    if (err.status === 401 || err.status === 403) {
      clearToken();
      showGate('Token rejected. Enter the mod token configured on the server.');
      return;
    }
    note(`${prefix}: ${err.message}`, 'danger');
  };

  // ——— Operator auto-refresh: a visible, unlocked page reloads health/status/readiness
  // every ~10s with one cycle in flight. No polling while hidden, locked, a mutation is
  // active, purge confirmation is armed, or an edit draft / expanded evidence panel would
  // be re-rendered away. Success never fakes freshness: lastSyncMs advances only when a
  // status load succeeds, and failures keep the previous data plus the danger banner. ———
  const appUnlocked = () => !$('app').hidden;
  const queueInteractionActive = () => {
    const list = $('queue-list');
    return Boolean(list.querySelector('textarea') || list.querySelector('.evidence:not([hidden])'));
  };
  const pollAllowed = () => document.visibilityState === 'visible' && appUnlocked()
    && !state.busy && !state.purgeTimer && !pollInFlight && !queueInteractionActive();
  function renderFreshness() {
    if (!lastSyncMs) return;
    const seconds = Math.max(0, Math.round((Date.now() - lastSyncMs) / 1000));
    $('freshness').textContent = seconds < 5 ? 'Updated just now'
      : seconds < 60 ? `Updated ${seconds}s ago` : `Updated ${Math.floor(seconds / 60)}m ago`;
  }
  async function startPoll() {
    lastPollStart = Date.now();
    pollInFlight = true;
    try {
      await loadAll();
    } finally {
      pollInFlight = false;
    }
  }
  function tick() {
    try {
      renderFreshness();
      if (pollAllowed() && Date.now() - lastPollStart >= POLL_INTERVAL_MS) startPoll();
    } finally {
      pollTimer = setTimeout(tick, 1000); // chained timeout: survives, eslint globals have no setInterval
    }
  }
  function startTicking() {
    if (pollTimer) return;
    if (!lastPollStart) lastPollStart = Date.now();
    renderFreshness();
    pollTimer = setTimeout(tick, 1000);
  }
  function stopTicking() {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = 0;
    }
  }

  // ——— Views / views share this index document (server serves / and /queue with it). ———
  function syncView() {
    const isQueue = location.pathname.replace(/\/+$/, '') === '/queue';
    $('view-queue').hidden = !isQueue;
    $('view-setup').hidden = isQueue;
    for (const a of document.querySelectorAll('[data-nav]')) {
      if (a.getAttribute('data-nav') === (isQueue ? '/queue' : '/')) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }

  function showGate(message = '') {
    $('gate').hidden = false;
    $('app').hidden = true;
    $('gate-lock').hidden = true;
    $('gate-token').value = '';
    $('gate-error').textContent = message;
    stopTicking();
  }
  function showApp() {
    $('gate').hidden = true;
    $('app').hidden = false;
    $('gate-lock').hidden = false;
    lastPollStart = Date.now(); // unlock() just did a full load; anchor the next cycle to it
    startTicking();
  }

  // ——— Health (public GET /health). Values rendered defensively — schema fields only. ———
  // docs: card M4-01 — {source, auth:{connected, login, scopes}, eventsub, llmConfigured, sessionId, error}
  function describeValue(v) {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'yes' : 'no';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v.map(String).join(', ');
    if (typeof v === 'object') {
      const keys = Object.keys(v);
      return keys.length ? `keys: ${keys.join(', ')}` : 'present';
    }
    return '—';
  }
  function renderHealth() {
    const h = state.health;
    const rows = $('health-rows');
    clear(rows);
    if (!h || typeof h !== 'object') {
      rows.append(
        el('dt', { text: 'status' }),
        el('dd', { text: 'Unavailable — the server did not return health data.' }),
      );
      return;
    }
    const source = typeof h.source === 'string' ? h.source : '—';
    const inReplay = source.toLowerCase().includes('replay');
    rows.append(
      el('dt', { text: 'source' }),
      el('dd', {},
        source,
        ' ',
        inReplay ? el('span', { class: 'chip chip-danger', text: 'Replay — labeled' }) : null,
      ),
    );
    const auth = h.auth && typeof h.auth === 'object' ? h.auth : null;
    if (auth) {
      rows.append(
        el('dt', { text: 'Twitch auth' }),
        el('dd', { text: auth.connected === true ? `connected${auth.login ? ` as ${String(auth.login)}` : ''}` : 'not connected' }),
      );
      if (auth.connected === true) rows.append(el('dt', { text: 'scopes' }), el('dd', { text: describeValue(auth.scopes) }));
    }
    rows.append(
      el('dt', { text: 'eventsub' }), el('dd', { text: describeValue(h.eventsub) }),
      el('dt', { text: 'AI model' }), el('dd', { text: h.llmConfigured === true ? 'configured' : 'not configured' }),
      el('dt', { text: 'session' }), el('dd', { text: describeValue(h.sessionId) }),
    );
    if (typeof h.error === 'string' && h.error) {
      rows.append(
        el('dt', { text: 'error' }),
        el('dd', { text: h.error, style: 'color: var(--lb-danger);' }),
      );
    }
  }

  // ——— Saved setup + inference verification (authenticated GET /api/readiness). ———
  // docs: card M7-02 — {config, health, inference}; secrets are booleans only.
  function configuredLabel(value) { return value === true ? 'configured' : 'missing'; }
  function isLoopbackUrl(value) {
    try {
      return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(String(value)).hostname);
    } catch {
      return false;
    }
  }
  function renderReadiness() {
    const rows = $('readiness-rows');
    const todo = $('readiness-todo');
    const inferenceNote = $('inference-note');
    clear(rows);
    clear(todo);
    inferenceNote.style.color = '';
    const readiness = state.readiness && typeof state.readiness === 'object' ? state.readiness : null;
    const cfg = readiness && readiness.config && typeof readiness.config === 'object' ? readiness.config : null;
    if (!cfg) {
      rows.append(el('dt', { text: 'saved setup' }), el('dd', { text: 'Unavailable — unlock with the mod token and refresh status.' }));
      inferenceNote.textContent = '';
      return;
    }
    const saved = (value) => (typeof value === 'string' && value ? value : 'not saved');
    rows.append(
      el('dt', { text: 'LLM base URL' }), el('dd', { text: saved(cfg.baseUrl) }),
      el('dt', { text: 'AI model' }), el('dd', { text: saved(cfg.model) }),
      el('dt', { text: 'Redirect URI' }), el('dd', { text: saved(cfg.redirectUri) }),
      el('dt', { text: 'Twitch client ID' }), el('dd', { text: configuredLabel(cfg.clientIdConfigured) }),
      el('dt', { text: 'Twitch client secret' }), el('dd', { text: configuredLabel(cfg.clientSecretConfigured) }),
      el('dt', { text: 'AI API key' }), el('dd', { text: configuredLabel(cfg.apiKeyConfigured) }),
    );
    const health = readiness.health && typeof readiness.health === 'object' ? readiness.health : null;
    const needs = [];
    if (cfg.clientIdConfigured !== true) needs.push('Twitch client ID');
    if (cfg.clientSecretConfigured !== true) needs.push('Twitch client secret');
    if (!health || !health.auth || health.auth.connected !== true) needs.push('Connect Twitch');
    if (!cfg.baseUrl) needs.push('LLM base URL');
    if (!cfg.model) needs.push('exact AI model ID');
    if (cfg.apiKeyConfigured !== true && !isLoopbackUrl(cfg.baseUrl)) needs.push('AI API key');
    if (!readiness.inference || readiness.inference.verified !== true) needs.push('Verify inference with "Check inference"');
    if (needs.length) for (const need of needs) todo.append(el('li', { text: need }));
    else todo.append(el('li', { text: 'Nothing outstanding — saved setup and inference are verified.' }));
    const inference = readiness.inference && typeof readiness.inference === 'object' ? readiness.inference : null;
    if (!inference) {
      inferenceNote.textContent = 'Not checked yet. Checking makes one request to your configured endpoint.';
      return;
    }
    const when = typeof inference.checkedAt === 'string' ? inference.checkedAt : 'unknown time';
    if (inference.verified === true) {
      inferenceNote.textContent = `Verified ${when} — ${String(inference.model || 'model')} answered at ${String(inference.baseUrl || 'endpoint')}.`;
      inferenceNote.style.color = 'var(--lb-success)';
    } else {
      inferenceNote.textContent = `Failed ${when}: ${typeof inference.error === 'string' && inference.error ? inference.error : 'no valid readiness response.'}`;
      inferenceNote.style.color = 'var(--lb-danger)';
    }
  }

  // ——— Boss panel + spawn. HP is operator-configured, never a hardcoded number. ———
  function renderBoss() {
    const boss = state.boss && typeof state.boss === 'object' ? state.boss : null;
    const body = $('boss-body');
    clear(body);
    if (!boss || typeof boss.phase !== 'string') {
      body.append(el('p', { class: 'caption', text: 'No boss data yet. Spawn a boss once lore is approved.' }));
    } else {
      body.append(el('dl', { class: 'kv' },
        el('dt', { text: 'phase' }), el('dd', { text: boss.phase }),
        el('dt', { text: 'name' }), el('dd', { text: typeof boss.name === 'string' && boss.name ? boss.name : '—' }),
      ));
      const hp = typeof boss.hp === 'number' && Number.isFinite(boss.hp) ? boss.hp : null;
      const maxHp = typeof boss.maxHp === 'number' && Number.isFinite(boss.maxHp) && boss.maxHp > 0 ? boss.maxHp : null;
      if (hp !== null && maxHp !== null) {
        body.append(el('div', { class: 'hp-track', style: 'margin: 12px 0 4px;' },
          el('div', { class: 'hp-fill' })));
        body.append(el('p', { class: 'caption', text: `${hp} / ${maxHp} HP` }));
        const dmg = body.querySelector('.hp-fill');
        if (dmg) dmg.style.transform = `scaleX(${Math.min(1, Math.max(0, hp / maxHp))})`;
      }
      const top = topDamage(boss.damageByUser, 5);
      if (top.length) {
        body.append(el('p', { class: 'caption', text: 'Top damage' }),
          el('ol', {}, ...top.map((t, i) => el('li', { text: `${i + 1}. ${t.user} — ${t.amount}` }))));
      }
    }
    const approved = state.lore.filter((l) => l.status === 'approved').length;
    const fighting = boss && ['spawning', 'fight'].includes(boss.phase);
    const canSpawn = approved > 0 && !state.busy && !fighting;
    $('spawn-form').querySelector('button').disabled = !canSpawn || !(+$('spawn-hp').value >= 1);
    $('spawn-hint').textContent = fighting ? 'Finish the current fight before spawning another boss.' : approved > 0
      ? `${approved} approved lore item(s) power attacks.`
      : 'Spawning is enabled once at least one lore item is approved.';
  }
  function topDamage(damageByUser, limit) {
    if (!damageByUser || typeof damageByUser !== 'object') return [];
    return Object.entries(damageByUser)
      .filter(([user, amount]) => typeof user === 'string' && typeof amount === 'number' && Number.isFinite(amount))
      .map(([user, amount]) => ({ user, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  // One place flips busy so Extract/Refresh/Spawn are undouble-clickable and always restored.
  function setBusy(value) {
    state.busy = value;
    $('extract').disabled = value;
    $('refresh').disabled = value;
    renderBoss();
  }

  async function spawn(event) {
    event.preventDefault();
    const raw = $('spawn-hp').value.trim();
    const maxHp = Number(raw);
    if (!raw || !Number.isInteger(maxHp) || maxHp < 1) {
      note('Enter a positive whole number for boss max HP.', 'danger');
      return;
    }
    bumpEpoch();
    setBusy(true);
    try {
      await api('/api/boss/spawn', { method: 'POST', body: { maxHp } });
      $('spawn-hp').value = '';
      note('Boss spawned. Chat can attack or heal.', 'success');
      await loadStatus();
    } catch (err) {
      fail(err, 'Spawn failed');
    } finally {
      setBusy(false);
    }
  }

  async function extractLore() {
    bumpEpoch();
    setBusy(true);
    try {
      await api('/api/extract', { method: 'POST', body: {} });
      note('Extraction finished — queue updated.', 'success');
      await loadStatus();
    } catch (err) {
      fail(err, 'Extraction failed');
    } finally {
      setBusy(false);
    }
  }

  // Manual refresh: never reports success after a failure and never destroys an open
  // editor or evidence panel; failures keep the last caption and the danger banner.
  async function manualRefresh() {
    if (state.busy) return;
    if (queueInteractionActive()) {
      note('Close the open editor or evidence panel before refreshing.', 'danger');
      return;
    }
    setBusy(true);
    try {
      if (await loadAll()) note('Status refreshed.', 'info');
    } finally {
      setBusy(false);
    }
  }

  // ——— Purge: inline two-step confirm (no native dialog). ———
  function renderPurge() {
    const zone = $('purge-zone');
    const unarm = () => { if (state.purgeTimer) { clearTimeout(state.purgeTimer); state.purgeTimer = 0; } renderPurge(); };
    if (state.purgeTimer) {
      zone.replaceChildren(
        el('span', { class: 'caption', text: 'Erase every stored chat, lore and boss data from this session?' }),
        el('button', { class: 'btn btn-danger', type: 'button', text: 'Confirm purge', onclick: () => { unarm(); doPurge(); } }),
        el('button', { class: 'btn', type: 'button', text: 'Keep', onclick: unarm }),
      );
      zone.querySelector('button').focus();
    } else {
      zone.replaceChildren(
        el('button', { class: 'btn btn-danger', type: 'button', text: 'Purge session content…', onclick: () => {
          if (state.purgeTimer) clearTimeout(state.purgeTimer);
          state.purgeTimer = setTimeout(() => { state.purgeTimer = 0; renderPurge(); }, 10000);
          renderPurge();
        } }),
      );
    }
  }
  async function doPurge() {
    bumpEpoch();
    try {
      await api('/api/purge', { method: 'POST', body: {} });
      note('Purged: all stored chat, lore and boss data removed.', 'success');
      await loadStatus();
    } catch (err) {
      fail(err, 'Purge failed');
    }
  }

  // ——— Queue. Evidence IDs render via textContent only. ———
  function renderTabs() {
    const tabs = $('tabs');
    clear(tabs);
    for (const key of ['pending', 'approved', 'rejected']) {
      const count = state.lore.filter((l) => l.status === key).length;
      tabs.append(el('button', {
        class: 'btn',
        type: 'button',
        text: `${key[0].toUpperCase()}${key.slice(1)} (${count})`,
        'aria-pressed': state.tab === key ? 'true' : 'false',
        on: { click: () => { state.tab = key; renderTabs(); renderQueue(); } },
      }));
    }
  }

  // Compact queue metadata: short evidence ids and readable local dates for
  // scanning; the title attribute preserves the full ids and ISO timestamps for
  // audit (hover/assistive tech), and the expanded panel shows the real values.
  const shortId = (id) => `${String(id).slice(0, 8)}…`;
  const localDateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const localWhen = (value) => {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : localDateTime.format(date);
  };
  function captionFor(item) {
    const compact = [];
    const audit = [];
    const ids = item.evidenceMessageIds && Array.isArray(item.evidenceMessageIds) ? item.evidenceMessageIds.map(String) : [];
    if (ids.length) {
      compact.push(`evidence: ${ids.map((id) => `#${shortId(id)}`).join(' ')}`);
      audit.push(`evidence: ${ids.map((id) => `#${id}`).join(' ')}`);
    }
    if (item.createdAt) {
      compact.push(`captured ${localWhen(item.createdAt)}`);
      audit.push(`captured ${String(item.createdAt)}`);
    }
    if (item.reviewedBy) {
      compact.push(`reviewed by ${String(item.reviewedBy)}${item.reviewedAt ? ` at ${localWhen(item.reviewedAt)}` : ''}`);
      audit.push(`reviewed by ${String(item.reviewedBy)}${item.reviewedAt ? ` at ${String(item.reviewedAt)}` : ''}`);
    }
    return { compact: compact.join(' · '), audit: audit.join(' · ') };
  }
  const kindChipClass = { catchphrase: '', rivalry: 'chip-gold', moment: 'chip-success', quote: 'chip-danger' };

  async function toggleEvidence(item, panel, button) {
    if (!panel.hidden) {
      panel.hidden = true;
      clear(panel);
      button.textContent = 'View evidence';
      button.setAttribute('aria-expanded', 'false');
      return;
    }
    bumpEpoch(); // an in-flight poll must not re-render this panel closed
    clear(panel);
    panel.hidden = false;
    panel.append(el('p', { class: 'caption', text: 'Loading evidence…' }));
    button.disabled = true;
    try {
      const data = await api(`/api/lore/${encodeURIComponent(String(item.id))}/evidence`);
      clear(panel);
      const messages = data && Array.isArray(data.messages) ? data.messages : [];
      const missing = data && Array.isArray(data.missingIds) ? data.missingIds : [];
      // Real counts from the endpoint response only — never invented aggregates.
      const summary = [`${messages.length} stored ${messages.length === 1 ? 'message' : 'messages'} loaded`];
      if (missing.length) summary.push(`${missing.length} missing or expired`);
      panel.append(el('p', { class: 'caption', text: summary.join(' · ') }));
      for (const message of messages) {
        if (!message || typeof message !== 'object') continue;
        panel.append(el('p', {},
          el('strong', { text: String(message.userName || 'unknown') }),
          ' ',
          el('span', { text: String(message.text || '') }),
          ' ',
          el('span', { class: 'caption', text: String(message.ts || '') }),
        ));
      }
      if (missing.length) panel.append(el('p', { class: 'caption', style: 'color: var(--lb-danger);', text: `Missing or expired evidence: ${missing.map(String).join(', ')}` }));
      if (!messages.length && !missing.length) panel.append(el('p', { class: 'caption', text: 'No stored evidence for this item.' }));
      button.textContent = 'Hide evidence';
      button.setAttribute('aria-expanded', 'true');
    } catch (err) {
      clear(panel);
      panel.append(el('p', { class: 'caption', style: 'color: var(--lb-danger);', text: `Evidence unavailable: ${err.message}` }));
      fail(err, 'Evidence unavailable');
    } finally {
      button.disabled = false;
    }
  }

  async function submitReview(id, status, text) {
    if (state.busy) return;
    bumpEpoch();
    setBusy(true);
    try {
      await api(`/api/lore/${encodeURIComponent(String(id))}/review`, { method: 'POST', body: text === undefined ? { status } : { status, text } });
      note(status === 'approved' ? 'Lore approved.' : 'Lore rejected.', 'success');
      await loadStatus();
    } catch (err) {
      fail(err, 'Review failed');
      setBusy(false); // re-enable buttons on the re-render below
      renderQueue();
      return;
    } finally {
      setBusy(false);
      renderQueue();
    }
  }

  function openEditor(item, textHolder, actions) {
    bumpEpoch(); // an in-flight poll must not re-render this draft away
    const area = el('textarea', { maxlength: '140', 'aria-label': 'Edit lore text' });
    area.value = typeof item.text === 'string' ? item.text : '';
    const save = el('button', { class: 'btn btn-success', type: 'button', text: 'Save & approve', onclick: () => {
      const next = area.value.trim();
      if (!next) { note('Edited lore text cannot be empty.', 'danger'); return; }
      submitReview(item.id, 'approved', next);
    } });
    const cancel = el('button', { class: 'btn', type: 'button', text: 'Cancel', onclick: () => renderQueue() });
    textHolder.replaceChildren(area);
    actions.replaceChildren(save, cancel);
    area.focus();
  }

  function renderQueue() {
    const list = $('queue-list');
    clear(list);
    const items = state.lore.filter((l) => l.status === state.tab);
    if (!items.length) {
      const empty = {
        pending: 'No pending lore. It appears here when extraction finds something fresh.',
        approved: 'No approved lore yet — approve an item to power attacks and recaps.',
        rejected: 'No rejected lore.',
      }[state.tab] || 'No lore here yet.';
      list.append(el('p', { class: 'caption', text: empty }));
    }
    for (const item of items) {
      if (!item || typeof item.id !== 'string') continue;
      const text = el('p', { class: 'q-text', text: typeof item.text === 'string' ? item.text : '' });
      const meta = captionFor(item);
      const caption = el('p', { class: 'caption', title: meta.audit || null, text: meta.compact });
      const evidence = el('div', { class: 'evidence', hidden: true, 'aria-live': 'polite' });
      const actions = el('div', { class: 'q-actions' });
      const kind = typeof item.kind === 'string' ? item.kind : 'moment';
      const card = el('article', { class: 'qcard' },
        el('div', {},
          el('p', {}, el('span', { class: `chip ${kindChipClass[kind] || ''}`, text: kind })),
          text,
          caption,
          evidence,
        ),
        actions,
      );
      const btn = (label, cls, fn) => el('button', { class: `btn ${cls}`, type: 'button', text: label, disabled: state.busy ? '' : null, onclick: fn });
      if (state.tab === 'pending') {
        actions.append(
          btn('Approve', 'btn-success', () => submitReview(item.id, 'approved')),
          btn('Edit', '', () => openEditor(item, text, actions)),
          btn('Reject', 'btn-danger', () => submitReview(item.id, 'rejected')),
        );
      }
      const viewEvidence = el('button', { class: 'btn', type: 'button', text: 'View evidence', 'aria-expanded': 'false', onclick: () => toggleEvidence(item, evidence, viewEvidence) });
      actions.append(viewEvidence);
      list.append(card);
    }
    renderTabs();
    renderBoss();
  }

  // ——— Settings: fields never prefilled; save posts the five documented fields. ———
  // docs: https://dev.twitch.tv/docs/auth — app registration + redirect handled on the server.
  async function saveSettings(event) {
    event.preventDefault();
    const val = (id) => $(id).value.trim();
    bumpEpoch();
    setBusy(true);
    try {
      const optional = (key, value) => (value ? { [key]: value } : {});
      await api('/api/settings', {
        method: 'POST',
        body: {
          ...optional('clientId', val('set-client-id')),
          ...optional('clientSecret', val('set-client-secret')),
          ...optional('redirectUri', val('set-redirect-uri')),
          ...optional('baseUrl', val('set-base-url')),
          ...optional('model', val('set-model')),
          ...optional('apiKey', val('set-api-key')),
        },
      });
      $('set-client-secret').value = '';
      $('set-api-key').value = '';
      $('settings-note').textContent = 'Settings saved. Use "Connect Twitch" to authorize the bot.';
      note('Settings saved. Inference verification was reset until you check again.', 'success');
      await Promise.all([loadHealth(), loadReadiness()]);
    } catch (err) {
      fail(err, 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function checkInference() {
    const button = $('check-inference');
    button.disabled = true;
    $('inference-note').textContent = 'Checking the configured endpoint…';
    $('inference-note').style.color = '';
    try {
      await api('/api/llm/check', { method: 'POST', body: {} });
      note('Inference verified: the configured model returned the readiness object.', 'success');
    } catch (err) {
      fail(err, 'Inference check failed');
    } finally {
      button.disabled = false;
      await loadReadiness();
    }
  }

  // ——— Connect Twitch entry (REVIEW-02 F8). A click never navigates straight to
  // /auth/start: it first makes the existing authenticated /api/status request, whose
  // Set-Cookie refreshes the lb_mod cookie that /auth/start requires, so an expired
  // cookie is restored instead of stranding the browser on a bare 401. Navigation
  // happens only after that preflight succeeds; duplicate clicks and failures are gated,
  // no token enters a URL, and no provider is contacted here. ———
  async function connectTwitch(event) {
    event.preventDefault();
    const link = $('connect-link');
    if (state.connectBusy) return; // duplicate click while a preflight is in flight
    if (!getToken()) { showGate('Enter the mod token to connect Twitch.'); return; } // existing unlock gate
    state.connectBusy = true;
    link.setAttribute('aria-disabled', 'true');
    let connected;
    try {
      const status = await api('/api/status'); // authenticated: refreshes lb_mod before /auth/start
      connected = runtimeConnected(status.health);
    } catch (err) {
      state.connectBusy = false;
      link.removeAttribute('aria-disabled');
      if (err.status === 401 || err.status === 403) {
        clearToken();
        showGate('Token rejected. Enter the mod token configured on the server.');
        return;
      }
      note(`Could not start authorization: ${err.message}`, 'danger');
      return; // stay local: no navigation, no false success
    }
    if (connected) {
      state.connectBusy = false;
      link.removeAttribute('aria-disabled');
      note('Already connected to Twitch. Disconnect below before starting a new authorization.', 'info');
      return; // preserve the current session; do not begin a conflicting round
    }
    window.location.assign('/auth/start'); // session is refreshed; navigation is the success signal
  }
  const runtimeConnected = (health) => Boolean(health && typeof health === 'object' && health.auth && typeof health.auth === 'object' && health.auth.connected === true);

  // ——— Loaders. Each captures renderEpoch before its request and discards a response
  // that arrives after a newer mutation/edit so a slow poll cannot overwrite newer
  // state. On failure the previous data stays visible, the danger banner explains why,
  // and lastSyncMs/freshness only advance on a successful /api/status. ———
  async function loadHealth() {
    const epoch = renderEpoch;
    let ok = false;
    try {
      const health = await api('/health');
      if (epoch === renderEpoch) {
        state.health = health;
        ok = true;
      }
    } catch (err) {
      fail(err, 'Health check failed');
    }
    if (epoch === renderEpoch) renderHealth();
    return ok;
  }
  async function loadStatus() {
    const epoch = renderEpoch;
    let ok = false;
    try {
      const status = await api('/api/status');
      if (!status || typeof status !== 'object' || !Array.isArray(status.lore)) {
        // Valid JSON with the wrong shape: keep last-known-good state and never
        // advance freshness for data the contract does not define.
        throw apiError('Status response was missing expected fields.', 0);
      }
      if (epoch === renderEpoch) {
        state.boss = status && typeof status.boss === 'object' ? status.boss : null;
        state.lore = Array.isArray(status && status.lore) ? status.lore : [];
        ok = true;
        lastSyncMs = Date.now();
      }
    } catch (err) {
      fail(err, 'Status unavailable');
    }
    if (epoch === renderEpoch) {
      renderQueue();
      if (ok) renderFreshness();
    }
    return ok;
  }
  async function loadReadiness() {
    const epoch = renderEpoch;
    let ok = false;
    try {
      const readiness = await api('/api/readiness');
      if (epoch === renderEpoch) {
        state.readiness = readiness;
        ok = true;
      }
    } catch (err) {
      fail(err, 'Saved setup unavailable');
    }
    if (epoch === renderEpoch) renderReadiness();
    return ok;
  }
  const loadAll = async () => (await Promise.all([loadHealth(), loadStatus(), loadReadiness()])).every(Boolean);

  async function unlock(event) {
    event.preventDefault();
    const token = $('gate-token').value.trim() || getToken();
    if (!token) { $('gate-error').textContent = 'Enter the mod token.'; return; }
    setToken(token);
    try {
      await api('/api/status');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearToken();
        showGate('Token rejected. Enter the mod token configured on the server.');
        return;
      }
      fail(err, 'Could not load status');
      return;
    }
    $('gate-error').textContent = '';
    showApp();
    await loadAll();
  }

  function boot() {
    const redirect = `http://localhost:${location.port || '80'}/auth/callback`;
    $('redirect-help').textContent = redirect;
    $('set-redirect-uri').placeholder = redirect;
    syncView();
    $('gate-form').addEventListener('submit', unlock);
    $('gate-lock').addEventListener('click', () => { clearToken(); showGate(); });
    $('refresh').addEventListener('click', manualRefresh);
    $('spawn-form').addEventListener('submit', spawn);
    $('spawn-hp').addEventListener('input', renderBoss);
    $('extract').addEventListener('click', extractLore);
    $('disconnect').addEventListener('click', async () => {
      bumpEpoch();
      try {
        await api('/api/disconnect', { method: 'POST', body: {} });
        note('Disconnected from Twitch.', 'success');
        await loadAll();
      } catch (err) {
        fail(err, 'Disconnect failed');
      }
    });
    $('settings-form').addEventListener('submit', saveSettings);
    $('check-inference').addEventListener('click', checkInference);
    $('connect-link').addEventListener('click', connectTwitch);
    // Auto-refresh lifecycle: pause the whole tick chain while hidden, resume on visible
    // (fetching immediately if the data is older than one cadence). Timers are stopped on
    // unload/pagehide; the JS context going away is the final stop.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        stopTicking();
        return;
      }
      if (appUnlocked()) {
        startTicking();
        if (pollAllowed() && Date.now() - lastPollStart >= POLL_INTERVAL_MS) startPoll();
      }
    });
    window.addEventListener('pagehide', stopTicking);
    window.addEventListener('beforeunload', stopTicking);
    renderPurge();
    renderBoss();
    renderTabs();
    renderQueue();
    renderReadiness();
    loadHealth();
    if (getToken()) unlock({ preventDefault: () => {} });
  }

  boot();
})();
