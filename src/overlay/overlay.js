/* Lore Boss OBS overlay client.
   Speaks only the local WebSocket protocol — ARCHITECTURE.md §7 (OverlayMsg v1).
   // docs: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket — reconnect handling below.
   Rules from the task card: parse defensively, textContent only (no innerHTML with dynamic data),
   never display raw WebSocket errors or secret values, honest empty state, REPLAY badge when live replay. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    badge: $('badge-replay'),
    empty: $('ov-empty'),
    fight: $('ov-fight'),
    bossName: $('ov-boss-name'),
    hpFill: $('ov-hp-fill'),
    hpCaption: $('ov-hp-caption'),
    damageList: $('ov-damage-list'),
    damageEmpty: $('ov-damage-empty'),
    quote: $('ov-quote'),
    quoteText: $('ov-quote-text'),
    quoteSrc: $('ov-quote-src'),
    defeated: $('ov-defeated'),
    defeatedName: $('ov-defeated-name'),
    mvpList: $('ov-mvp-list'),
    recap: $('ov-recap'),
    recapPill: $('ov-recap-pill'),
    recapHeadline: $('ov-recap-headline'),
    recapLines: $('ov-recap-lines'),
    recapLabel: $('ov-recap-label'),
    recapHint: $('ov-recap-hint'),
    hitpop: $('ov-hitpop'),
    ticker: $('ov-ticker'),
    conn: $('ov-conn'),
  };
  let popTimer = 0;
  let popHideTimer = 0;
  let recapTimer = 0;
  let lastState = null;
  let channel = null;

  const el = (tag, attrs = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
    for (const kid of kids) {
      if (kid === null || kid === undefined || kid === false) continue;
      node.append(kid && typeof kid === 'object' && 'nodeType' in kid ? kid : document.createTextNode(String(kid)));
    }
    return node;
  };
  const sep = () => el('span', { class: 't-sep', text: '•' });

  // Defensive field readers: unknown shapes are ignored, never trusted.
  const str = (v) => (typeof v === 'string' ? v : null);
  const num = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
    return null;
  };

  function swap(node, show) { node.hidden = !show; }

  function showView(view) {
    // 'empty' | 'fight' | 'defeated' | 'recap'
    swap(els.empty, view === 'empty');
    swap(els.fight, view === 'fight');
    swap(els.defeated, view === 'defeated');
    swap(els.recap, view === 'recap');
  }

  function renderBossState(state) {
    const phase = str(state.phase);
    if (!['idle', 'spawning', 'fight', 'defeated'].includes(phase)) return;
    if (phase === 'idle') { showView('empty'); return; }
    if (phase === 'defeated') { showDefeated({ name: str(state.name), durationMs: num(state.durationMs), mvps: topDamage(state.damageByUser, 3) }); return; }
    // spawning / fight
    showView('fight');
    els.bossName.textContent = str(state.name) || 'Boss incoming…';
    const hp = num(state.hp);
    const maxHp = num(state.maxHp);
    const ratio = hp !== null && maxHp !== null && maxHp > 0 ? Math.min(1, Math.max(0, hp / maxHp)) : 0;
    els.hpFill.style.transform = `scaleX(${ratio})`;
    els.hpCaption.textContent = hp !== null && maxHp !== null ? `${hp} / ${maxHp} HP` : 'HP unavailable';
    renderDamage(topDamage(state.damageByUser, 3));
  }

  function topDamage(damageByUser, limit) {
    if (!damageByUser || typeof damageByUser !== 'object') return [];
    return Object.entries(damageByUser)
      .filter(([user, amount]) => typeof user === 'string' && typeof amount === 'number' && Number.isFinite(amount))
      .map(([user, amount]) => ({ user, amount }))
      .sort((a, b) => b.amount - a.amount || a.user.localeCompare(b.user))
      .slice(0, limit);
  }

  function renderDamage(top) {
    els.damageList.replaceChildren(...top.map(t =>
      el('li', { text: `${t.user} — ${t.amount}` })));
    swap(els.damageEmpty, top.length === 0);
  }

  function showDefeated(data) {
    showView('defeated');
    const mvps = data.mvps || [];
    els.mvpList.replaceChildren(...mvps.map(m =>
      el('li', { text: `${m.user} — ${m.amount}` })));
    if (mvps.length === 0) els.mvpList.append(el('li', { text: 'The fight ended with no recorded damage.' }));
    const name = str(data.name) || 'The boss fell.';
    const duration = num(data.durationMs);
    els.defeatedName.textContent = duration !== null
      ? `${name} · fought for ${Math.floor(duration / 60000)}:${String(Math.floor((duration % 60000) / 1000)).padStart(2, '0')}`
      : name;
  }

  function showHit(hit) {
    const amount = num(hit.amount);
    if (amount === null) return;
    const crit = hit.crit === true;
    els.hitpop.textContent = hit.cause === 'heal' ? `+${amount} HP` : crit ? `CRIT! −${amount} (bits)` : `−${amount}`;
    els.hitpop.hidden = false;
    els.hitpop.classList.toggle('pop-crit', crit);
    els.hitpop.classList.remove('pop-show');
    els.hitpop.classList.remove('pop-out');
    clearTimeout(popHideTimer);
    void els.hitpop.offsetWidth; // restart the CSS animation
    els.hitpop.classList.add('pop-show');
    if (popTimer) clearTimeout(popTimer);
    popTimer = setTimeout(() => {
      els.hitpop.classList.add('pop-out');
      popHideTimer = setTimeout(() => { els.hitpop.hidden = true; els.hitpop.classList.remove('pop-show', 'pop-out'); }, 320);
    }, 900);
  }

  function showAttack(attack) {
    const text = str(attack.text);
    if (!text) return;
    els.quoteText.textContent = `“${text}”`;
    const author = str(attack.author);
    els.quoteSrc.textContent = author ? `— @${author} · mod-approved lore` : 'mod-approved lore';
    swap(els.quote, true);
  }

  function showRecap(recap) {
    const raider = str(recap.raider) || 'A raider';
    const viewers = num(recap.viewers);
    els.recapPill.textContent = `Raid incoming · ${raider}${viewers !== null ? ` + ${viewers} viewers` : ''}`;
    const name = str(recap.channel) || channel;
    els.recapHeadline.textContent = name ? `Previously on ${name}…` : 'Previously on…';
    els.recapLines.replaceChildren(
      ...(Array.isArray(recap.lines) ? recap.lines.slice(0, 3).map((line, i) =>
        el('li', { class: 'ov-recap-line reveal', text: `${i + 1}. ${str(line) || ''}` })) : []),
    );
    if (els.recapLines.children.length === 0) {
      els.recapLines.append(el('li', { class: 'ov-recap-line reveal', text: 'Nothing to recap yet — approved lore builds the story.' }));
    }
    els.recapLabel.textContent = recap.generatedBy === 'template'
      ? 'Scripted recap — template assembled from approved lore only.'
      : 'AI recap, written from approved lore only.';
    // The raider hint must be honest: never invite an attack while there is no boss fight.
    const fighting = lastState?.phase === 'fight';
    els.recapHint.textContent = fighting
      ? 'Raiders: type !attack to join the fight →'
      : 'Raiders: welcome! A fight starts once the streamer approves lore — hang tight.';
    showView('recap');
    triggerStagger();
    clearTimeout(recapTimer);
    recapTimer = setTimeout(() => { recapTimer = 0; if (lastState) renderBossState(lastState); else showView('empty'); }, Math.max(1000, Math.min(60000, num(recap.durationMs) ?? 12000)));
  }

  function triggerStagger() {
    for (const line of els.recapLines.children) {
      line.classList.remove('reveal');
      void line.offsetWidth;
      line.classList.add('reveal');
    }
  }

  function showTicker(msg) {
    const items = Array.isArray(msg.items) ? msg.items : [];
    const texts = items.map((it) => (it && typeof it === 'object' ? str(it.text) : null)).filter((t) => t);
    if (!texts.length) { swap(els.ticker, false); return; }
    els.ticker.replaceChildren(...texts.flatMap((t, i) =>
      i === 0 ? [el('span', { class: 't-item', text: t })] : [sep(), el('span', { class: 't-item', text: t })]));
    swap(els.ticker, true);
  }

  // ——— Message dispatch (ARCHITECTURE §7; unknown/invalid messages are ignored). ———
  function handle(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return;
    if (msg.v !== undefined && msg.v !== 1) return;
    switch (msg.type) {
      case 'hello': {
        els.badge.hidden = msg.source !== 'replay';
        channel = str(msg.channel);
        send({ type: 'ack' });
        break;
      }
      case 'boss.state': {
        if (msg.state && typeof msg.state === 'object') {
          const changedBoss = !lastState || lastState.bossId !== msg.state.bossId;
          lastState = msg.state;
          if (msg.state.phase === 'idle') { clearTimeout(recapTimer); recapTimer = 0; }
          if (!recapTimer) renderBossState(msg.state);
          if (changedBoss || msg.state.phase === 'idle') swap(els.quote, false);
        }
        break;
      }
      case 'boss.hit': showHit(msg); break;
      case 'boss.attack': showAttack(msg); break;
      case 'boss.defeated': {
        const mvps = Array.isArray(msg.mvps)
          ? msg.mvps.map((m) => ({ user: m && typeof m === 'object' ? str(m.userName) : null, amount: m ? num(m.damage) : null }))
              .filter((m) => m.user !== null && m.amount !== null)
          : [];
        showDefeated({ name: str(msg.name), durationMs: num(msg.durationMs), mvps });
        break;
      }
      case 'lore.ticker': showTicker(msg); break;
      case 'recap.show': showRecap(msg); break;
      default: break; // unknown type: ignored, never shown
    }
  }

  // ——— Connection state + retry (backoff). Raw WS errors are never displayed. ———
  let socket = null;
  let attempt = 0;
  let retryTimer = 0;

  function setConn(text) { els.conn.textContent = text; }

  function onConnectionLost(event) {
    if (event.target !== socket) return; // stale event from a replaced socket
    scheduleRetry();
  }

  function connect() {
    if (typeof WebSocket === 'undefined') { setConn('This browser does not support WebSockets.'); return; }
    setConn(attempt > 0 ? 'reconnecting…' : 'connecting…');
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${proto}//${location.host}/overlay`);

    socket.addEventListener('open', () => {
      attempt = 0;
      setConn('connected');
    });
    socket.addEventListener('message', (event) => {
      if (typeof event.data === 'string') handle(event.data);
    });
    socket.addEventListener('close', onConnectionLost);
    socket.addEventListener('error', onConnectionLost); // reason never surfaced on purpose
  }

  function scheduleRetry() {
    socket = null;
    attempt += 1;
    setConn('reconnecting…');
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(connect, Math.min(1000 * 2 ** (attempt - 1), 15000));
  }

  function send(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  swap(els.quote, false); // start clean before hello
  showView('empty');
  connect();
})();
