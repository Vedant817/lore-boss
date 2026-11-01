/* Lore Boss OBS overlay client.
   Speaks only the local WebSocket protocol — ARCHITECTURE.md §7 (OverlayMsg v1).
   // docs: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket — reconnect handling below.
   // docs: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API — optional ?sound effects, synthesized (no audio files).
   Rules from the task card: parse defensively, textContent only (no innerHTML with dynamic data),
   never display raw WebSocket errors or secret values, honest empty state, REPLAY badge when live replay.
   Effects (floaters, shake, confetti, sound) are decorative; every number shown comes from the server. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    root: $('ov-root'),
    badge: $('badge-replay'),
    empty: $('ov-empty'),
    fight: $('ov-fight'),
    panel: $('ov-boss-panel'),
    bossName: $('ov-boss-name'),
    stage: $('ov-stage'),
    timer: $('ov-timer'),
    hpFill: $('ov-hp-fill'),
    hpGhost: $('ov-hp-ghost'),
    hpCaption: $('ov-hp-caption'),
    stunned: $('ov-stunned'),
    combo: $('ov-combo'),
    strike: $('ov-strike'),
    strikeFill: $('ov-strike-fill'),
    strikeCount: $('ov-strike-count'),
    damageList: $('ov-damage-list'),
    damageEmpty: $('ov-damage-empty'),
    quote: $('ov-quote'),
    quoteText: $('ov-quote-text'),
    quoteSrc: $('ov-quote-src'),
    defeated: $('ov-defeated'),
    defeatedName: $('ov-defeated-name'),
    finisher: $('ov-finisher'),
    mvpList: $('ov-mvp-list'),
    hall: $('ov-hall'),
    hallList: $('ov-hall-list'),
    hallCount: $('ov-hall-count'),
    recap: $('ov-recap'),
    recapPill: $('ov-recap-pill'),
    recapHeadline: $('ov-recap-headline'),
    recapLines: $('ov-recap-lines'),
    recapLabel: $('ov-recap-label'),
    recapHint: $('ov-recap-hint'),
    prediction: $('ov-prediction'),
    floaters: $('ov-floaters'),
    confetti: $('ov-confetti'),
    splash: $('ov-splash'),
    hitpop: $('ov-hitpop'),
    ticker: $('ov-ticker'),
    conn: $('ov-conn'),
  };
  const params = new URLSearchParams(location.search);
  // ?preview adds a solid backdrop for browser viewing; the plain URL stays transparent for OBS.
  if (params.has('preview')) document.documentElement.classList.add('ov-preview');
  const STAGE_LABEL = { 2: 'ENRAGED', 3: 'DESPERATE' };
  let popTimer = 0;
  let popHideTimer = 0;
  let recapTimer = 0;
  let splashTimer = 0;
  let comboTimer = 0;
  let predictionTimer = 0;
  let lastState = null;
  let lastHall = null;
  let channel = null;
  let serverOffset = 0; // serverNow - local now, so countdowns follow the server clock

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
  const serverNow = () => Date.now() + serverOffset;
  const syncClock = (msg) => { const n = num(msg.serverNow); if (n !== null) serverOffset = n - Date.now(); };
  const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

  function swap(node, show) { node.hidden = !show; }

  function showView(view) {
    // 'empty' | 'fight' | 'defeated' | 'recap'
    swap(els.empty, view === 'empty');
    swap(els.fight, view === 'fight');
    swap(els.defeated, view === 'defeated');
    swap(els.recap, view === 'recap');
  }

  // ——— Optional sound (?sound): short synthesized tones, off by default for OBS. ———
  let audio = null;
  function tone(freq, ms, type = 'square', gain = 0.05) {
    if (!params.has('sound')) return;
    try {
      audio = audio || new window.AudioContext();
      const osc = audio.createOscillator(); const amp = audio.createGain();
      osc.type = type; osc.frequency.value = freq; amp.gain.value = gain;
      amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + ms / 1000);
      osc.connect(amp).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + ms / 1000);
    } catch { /* audio is decorative; failures are silent by design */ }
  }

  function shake() {
    els.root.classList.remove('shake'); void els.root.offsetWidth; els.root.classList.add('shake');
  }

  function splash(text, tone_) {
    els.splash.textContent = text;
    els.splash.className = `ov-splash tone-${tone_}`;
    els.splash.hidden = false;
    void els.splash.offsetWidth;
    clearTimeout(splashTimer);
    splashTimer = setTimeout(() => { els.splash.hidden = true; }, 1800);
  }

  function floater(text, who, kind) {
    const node = el('span', { class: `ov-float ${kind}` }, el('span', { class: 'who', text: who || '' }), text);
    // Decorative scatter around the HP bar; the value itself is the server's.
    node.style.left = `${120 + Math.floor(Math.random() * 640)}px`;
    node.style.top = `${200 + Math.floor(Math.random() * 120)}px`;
    els.floaters.append(node);
    setTimeout(() => node.remove(), 1500);
    while (els.floaters.children.length > 24) els.floaters.firstChild.remove();
  }

  function confetti() {
    const colors = ['var(--lb-primary)', 'var(--lb-primary-hi)', 'var(--lb-gold)', 'var(--lb-success)', 'var(--lb-danger)'];
    els.confetti.replaceChildren(...Array.from({ length: 90 }, (_, i) => {
      const piece = el('i');
      piece.style.left = `${Math.floor(Math.random() * 100)}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.floor(Math.random() * 600)}ms`;
      piece.style.setProperty('--dx', `${Math.floor(Math.random() * 240) - 120}px`);
      piece.style.setProperty('--rot', `${Math.floor(Math.random() * 720) - 360}deg`);
      return piece;
    }));
    setTimeout(() => els.confetti.replaceChildren(), 3400);
  }

  function renderBossState(state) {
    const phase = str(state.phase);
    if (!['idle', 'spawning', 'fight', 'defeated'].includes(phase)) return;
    if (phase === 'idle') { showView('empty'); return; }
    if (phase === 'defeated') { showDefeated({ name: str(state.name), durationMs: num(state.durationMs), mvps: topDamage(state.damageByUser, 3), finisher: str(state.finisher) }); return; }
    // spawning / fight
    showView('fight');
    els.bossName.textContent = str(state.name) || 'Boss incoming…';
    const hp = num(state.hp);
    const maxHp = num(state.maxHp);
    const ratio = hp !== null && maxHp !== null && maxHp > 0 ? Math.min(1, Math.max(0, hp / maxHp)) : 0;
    els.hpFill.style.transform = `scaleX(${ratio})`;
    els.hpGhost.style.transform = `scaleX(${ratio})`;
    els.hpCaption.textContent = hp !== null && maxHp !== null ? `${hp} / ${maxHp} HP` : 'HP unavailable';
    const stage = num(state.stage);
    const label = STAGE_LABEL[stage];
    els.stage.textContent = label || '';
    els.stage.className = `chip ov-stage stage-${stage}`;
    swap(els.stage, Boolean(label));
    els.panel.classList.toggle('stage-2', stage === 2);
    els.panel.classList.toggle('stage-3', stage === 3);
    renderDamage(topDamage(state.damageByUser, 3));
    renderLive();
  }

  // Time-based pieces (fight timer, strike countdown, stun) re-render every 250 ms from server state.
  function renderLive() {
    const state = lastState;
    if (!state || state.phase !== 'fight') { swap(els.strike, false); swap(els.stunned, false); return; }
    const now = serverNow();
    const started = Date.parse(str(state.startedAt) || '');
    els.timer.textContent = Number.isFinite(started) ? clock(Math.max(0, now - started)) : '';
    const strike = state.strike && typeof state.strike === 'object' ? state.strike : null;
    const endsAt = strike ? num(strike.endsAt) : null;
    const needed = strike ? num(strike.needed) : null;
    if (strike && endsAt !== null && needed !== null) {
      const remaining = Math.max(0, endsAt - now);
      const blockers = Array.isArray(strike.blockers) ? strike.blockers.length : 0;
      els.strikeFill.style.transform = `scaleX(${Math.min(1, remaining / 8000)})`;
      els.strikeCount.textContent = `${blockers} / ${needed} ${needed === 1 ? 'block' : 'blocks'} · ${Math.ceil(remaining / 1000)}s`;
      swap(els.strike, true);
    } else swap(els.strike, false);
    const stunnedUntil = num(state.stunnedUntil);
    swap(els.stunned, stunnedUntil !== null && now < stunnedUntil);
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

  function renderHall() {
    const fighters = lastHall && Array.isArray(lastHall.fighters) ? lastHall.fighters.slice(0, 5) : [];
    els.hallList.replaceChildren(...fighters.map((f) => {
      const name = f && typeof f === 'object' ? str(f.userName) : null;
      const damage = f ? num(f.damage) : null;
      if (!name || damage === null) return null;
      const titles = Array.isArray(f.titles) ? f.titles.map(str).filter(Boolean) : [];
      return el('li', {}, `${name} — ${damage} dmg`, ...titles.slice(0, 2).map(t => el('span', { class: 'title-chip', text: t })));
    }).filter(Boolean));
    const count = lastHall ? num(lastHall.bossesDefeated) : null;
    els.hallCount.textContent = count !== null ? `${count} ${count === 1 ? 'boss' : 'bosses'} defeated all-time` : '';
    swap(els.hall, els.hallList.children.length > 0);
  }

  function showDefeated(data) {
    showView('defeated');
    const mvps = data.mvps || [];
    els.mvpList.replaceChildren(...mvps.map(m =>
      el('li', { text: `${m.user} — ${m.amount}` })));
    if (mvps.length === 0) els.mvpList.append(el('li', { text: 'The fight ended with no recorded damage.' }));
    const name = str(data.name) || 'The boss fell.';
    const duration = num(data.durationMs);
    els.defeatedName.textContent = duration !== null ? `${name} · fought for ${clock(duration)}` : name;
    const finisher = str(data.finisher);
    els.finisher.textContent = finisher ? `Final blow: ${finisher}` : '';
    swap(els.finisher, Boolean(finisher));
    renderHall();
  }

  function showHit(hit) {
    const amount = num(hit.amount);
    if (amount === null) return;
    const crit = hit.crit === true;
    const heal = hit.cause === 'heal';
    const stunned = hit.stunned === true;
    els.hitpop.textContent = heal ? `+${amount} HP` : crit ? `CRIT! −${amount} (bits)` : `−${amount}`;
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
    if (!heal) floater(`−${amount}${stunned ? ' ×2' : ''}`, str(hit.userName), crit ? 'crit' : stunned ? 'stun' : '');
    if (crit) { shake(); tone(180, 260, 'sawtooth', 0.08); } else tone(heal ? 660 : 320, 90);
    const combo = num(hit.combo);
    if (combo !== null && combo >= 2) {
      els.combo.textContent = `COMBO ×${combo}`;
      els.combo.hidden = false;
      els.combo.classList.remove('bump'); void els.combo.offsetWidth; els.combo.classList.add('bump');
      clearTimeout(comboTimer);
      comboTimer = setTimeout(() => { els.combo.hidden = true; }, 2500);
    }
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

  function showPrediction(msg) {
    const status = str(msg.status);
    clearTimeout(predictionTimer);
    if (status === 'open') {
      els.prediction.textContent = `Channel Points prediction: ${str(msg.title) || 'live'}`;
      swap(els.prediction, true);
    } else if (status === 'resolved' && str(msg.winner)) {
      els.prediction.textContent = `Prediction resolved: ${str(msg.winner)}`;
      swap(els.prediction, true);
      predictionTimer = setTimeout(() => swap(els.prediction, false), 10000);
    } else swap(els.prediction, false);
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
          syncClock(msg);
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
      case 'boss.stage': {
        const label = STAGE_LABEL[num(msg.stage)];
        if (label) { splash(`${label}!`, num(msg.stage) === 3 ? 'danger' : 'gold'); shake(); tone(110, 500, 'sawtooth', 0.08); }
        break;
      }
      case 'boss.strike': {
        syncClock(msg);
        splash('LORE STRIKE!', 'danger'); shake(); tone(220, 400, 'sawtooth', 0.07);
        break;
      }
      case 'boss.block': {
        const blockers = num(msg.blockers); const needed = num(msg.needed);
        floater(blockers !== null && needed !== null ? `BLOCK ${blockers}/${needed}` : 'BLOCK', str(msg.userName), 'stun');
        tone(880, 120, 'triangle');
        break;
      }
      case 'boss.strike.result': {
        if (msg.outcome === 'blocked') { splash('BLOCKED! Boss stunned', 'gold'); tone(988, 300, 'triangle', 0.07); }
        else if (msg.outcome === 'landed') { const heal = num(msg.heal); splash(heal ? `Strike landed · boss +${heal} HP` : 'Strike landed', 'danger'); shake(); tone(140, 450, 'sawtooth', 0.08); }
        break;
      }
      case 'boss.defeated': {
        const mvps = Array.isArray(msg.mvps)
          ? msg.mvps.map((m) => ({ user: m && typeof m === 'object' ? str(m.userName) : null, amount: m ? num(m.damage) : null }))
              .filter((m) => m.user !== null && m.amount !== null)
          : [];
        showDefeated({ name: str(msg.name), durationMs: num(msg.durationMs), mvps, finisher: str(msg.finisher) });
        confetti(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 220, 'triangle', 0.06), i * 140));
        break;
      }
      case 'hall.update': { lastHall = msg; if (!els.defeated.hidden) renderHall(); break; }
      case 'prediction.state': showPrediction(msg); break;
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
  window.setInterval(() => { if (!recapTimer && !els.fight.hidden) renderLive(); }, 250);
  connect();
})();
