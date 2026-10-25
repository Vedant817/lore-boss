/* Lore Boss operator UI (setup + mod queue).
   Endpoint contract: orchestration/cards/M4-01.md; types mirror src/types.ts.
   The only external URL shown here is the Twitch developer console, cited below.
   Comments: // docs: <url> appear next to anything that documents an external integration. */
(() => {
  'use strict';

  const TOKEN_KEY = 'loreboss.modToken';
  const state = {
    health: null,
    readiness: null,
    boss: null,
    lore: [],
    tab: 'pending',
    purgeTimer: 0,
    busy: false,
  };

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
  }
  function showApp() {
    $('gate').hidden = true;
    $('app').hidden = false;
    $('gate-lock').hidden = false;
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
    const canSpawn = approved > 0 && !state.busy;
    $('spawn-form').querySelector('button').disabled = !canSpawn || !(+$('spawn-hp').value >= 1);
    $('spawn-hint').textContent = approved > 0
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

  async function spawn(event) {
    event.preventDefault();
    const raw = $('spawn-hp').value.trim();
    const maxHp = Number(raw);
    if (!raw || !Number.isInteger(maxHp) || maxHp < 1) {
      note('Enter a positive whole number for boss max HP.', 'danger');
      return;
    }
    state.busy = true;
    renderBoss();
    try {
      await api('/api/boss/spawn', { method: 'POST', body: { maxHp } });
      $('spawn-hp').value = '';
      note('Spawning boss.', 'success');
      await loadStatus();
    } catch (err) {
      fail(err, 'Spawn failed');
    } finally {
      state.busy = false;
      renderBoss();
    }
  }

  async function extractLore() {
    state.busy = true;
    try {
      await api('/api/extract', { method: 'POST', body: {} });
      note('Extraction finished — queue updated.', 'success');
      await loadStatus();
    } catch (err) {
      fail(err, 'Extraction failed');
    } finally {
      state.busy = false;
      renderBoss();
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

  function captionFor(item) {
    const bits = [];
    if (item.evidenceMessageIds && Array.isArray(item.evidenceMessageIds) && item.evidenceMessageIds.length) {
      bits.push(`evidence: ${item.evidenceMessageIds.map((id) => `#${String(id)}`).join(' ')}`);
    }
    if (item.createdAt) bits.push(`captured ${String(item.createdAt)}`);
    if (item.reviewedBy) bits.push(`reviewed by ${String(item.reviewedBy)}${item.reviewedAt ? ` at ${String(item.reviewedAt)}` : ''}`);
    return bits.join(' · ');
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
    clear(panel);
    panel.hidden = false;
    panel.append(el('p', { class: 'caption', text: 'Loading evidence…' }));
    button.disabled = true;
    try {
      const data = await api(`/api/lore/${encodeURIComponent(String(item.id))}/evidence`);
      clear(panel);
      const messages = data && Array.isArray(data.messages) ? data.messages : [];
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
      const missing = data && Array.isArray(data.missingIds) ? data.missingIds : [];
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
    state.busy = true;
    try {
      await api(`/api/lore/${encodeURIComponent(String(id))}/review`, { method: 'POST', body: text === undefined ? { status } : { status, text } });
      note(status === 'approved' ? 'Lore approved.' : 'Lore rejected.', 'success');
      await loadStatus();
    } catch (err) {
      fail(err, 'Review failed');
      state.busy = false; // re-enable buttons on the re-render below
      renderQueue();
      return;
    } finally {
      state.busy = false;
      renderQueue();
    }
  }

  function openEditor(item, textHolder, actions) {
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
      const caption = el('p', { class: 'caption', text: captionFor(item) });
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
    state.busy = true;
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
      state.busy = false;
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

  // ——— Loaders ———
  async function loadHealth() {
    try {
      state.health = await api('/health');
    } catch (err) {
      state.health = null;
      fail(err, 'Health check failed');
    }
    renderHealth();
  }
  async function loadStatus() {
    try {
      const status = await api('/api/status');
      state.boss = status && typeof status.boss === 'object' ? status.boss : null;
      state.lore = Array.isArray(status && status.lore) ? status.lore : [];
    } catch (err) {
      fail(err, 'Status unavailable');
    }
    renderQueue();
  }
  async function loadReadiness() {
    try {
      state.readiness = await api('/api/readiness');
    } catch (err) {
      state.readiness = null;
      fail(err, 'Saved setup unavailable');
    }
    renderReadiness();
  }
  const loadAll = () => Promise.all([loadHealth(), loadStatus(), loadReadiness()]);

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
    $('refresh').addEventListener('click', () => { loadAll().then(() => note('Status refreshed.', 'info')); });
    $('spawn-form').addEventListener('submit', spawn);
    $('spawn-hp').addEventListener('input', renderBoss);
    $('extract').addEventListener('click', extractLore);
    $('disconnect').addEventListener('click', async () => {
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
