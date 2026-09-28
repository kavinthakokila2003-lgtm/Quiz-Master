/* Quiz Master accessibility & polish pass. Loaded last — only additive/overriding, no data or API changes. */
(() => {
  function addPolishStyles() {
    if (document.getElementById('qmPolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'qmPolishStyles';
    style.textContent = `
      /* Darken secondary text/badge colors to meet WCAG AA contrast on their backgrounds */
      :root{--muted:#5f6478}
      .badge{color:#5c5f70}
      .badge.lock{color:#8a5410}
      .badge.live{color:#166840}
      .side-label{color:#6d7181}
      .access-state{color:#5c6175}
      .access-state.locked{color:#9c3349}
      .access-state.unlocked{color:#166840}

      /* Clear, consistent keyboard focus highlight across every interactive control */
      a:focus-visible,button:focus-visible,.btn:focus-visible,.nav:focus-visible,.tab:focus-visible,
      .choice:focus-visible,.small-link:focus-visible,.switch:focus-visible,.step-dot:focus-visible,
      details>summary:focus-visible,.round-card summary:focus-visible{
        outline:3px solid #7566e9;outline-offset:2px;border-radius:8px;
      }
      input:focus-visible,textarea:focus-visible,select:focus-visible{
        outline:3px solid #7566e955;
      }

      /* Toast is announced to screen readers */
      .toast{role:status}

      /* Small confirm dialog reused for lightweight confirmations */
      .polish-modal p{margin:0 0 6px}

      /* Modern primary-button treatment: richer gradient, deeper glow, crisp press feedback */
      .btn:not(.light):not(.dark):not(.danger-button):not(.lock-action):not(.unlock-action){
        background:linear-gradient(135deg,#7161f2,#5947d8);
        box-shadow:0 8px 20px #5947d840;
      }
      .btn:not(.light):not(.dark):not(.danger-button):not(.lock-action):not(.unlock-action):hover{
        background:linear-gradient(135deg,#7d6df5,#6350e6);
        box-shadow:0 10px 26px #5947d855;
      }

      /* Host banner / welcome card: smooth entrance on the waiting screen and projector */
      .host-banner,.host-welcome,.projector-host{animation:hostReveal .5s cubic-bezier(.2,.8,.2,1) both}
      @keyframes hostReveal{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}

      /* Mascot hint redesigned as a speech bubble sitting beside the owl, with little glasses */
      .mascot-hint{position:relative;background:linear-gradient(110deg,#f8f6ff,#f0fbf8);overflow:visible}
      .owl-mini{position:relative;display:inline-block}
      .owl-mini:after{content:'👓';position:absolute;left:50%;top:38%;transform:translate(-50%,-50%) scale(.62);pointer-events:none}
      .mascot-bubble{position:relative;flex:1;padding:2px 4px}
      .mascot-bubble:before{content:'';position:absolute;left:-9px;top:14px;border:7px solid transparent;border-right-color:#f8f6ff}

      /* Anti-cheat / return-to-quiz overlay */
      .anticheat-icon{background:linear-gradient(145deg,#fff0f1,#ffe6e9)!important;color:#bc3d51!important}
      .anticheat-count{display:inline-block;margin-top:10px;padding:6px 11px;border-radius:20px;background:#fff1f2;color:#b5384d;font-size:11px;font-weight:800}

      /* ---------- Advanced visual pass ---------- */

      /* Gradient wordmark for extra polish on every header */
      .brand b{background:linear-gradient(120deg,#7161f2,#2b9c86);-webkit-background-clip:text;background-clip:text;color:transparent}

      /* Slow-moving aurora backdrop behind every sign-in / waiting screen */
      .team-login{background:
        radial-gradient(circle at 20% 20%,#c9beff55,transparent 45%),
        radial-gradient(circle at 82% 75%,#9fe6cf55,transparent 42%),
        radial-gradient(ellipse at 53% 30%,#efecff 0%,#f5f6f8 52%);
        background-size:180% 180%,180% 180%,100% 100%;
        animation:auroraDrift 16s ease-in-out infinite alternate}
      @keyframes auroraDrift{from{background-position:0% 0%,100% 100%,0 0}to{background-position:30% 40%,60% 50%,0 0}}

      /* Subtle shimmer across the admin hero banner */
      .hero{background-size:220% 220%!important;animation:heroShimmer 9s ease infinite}
      @keyframes heroShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}

      /* Staggered entrance for the main content blocks — reads as a "live" refresh */
      .stats>.stat,.round-cards>.round-card,.panels>.card,.table-panel,.question,.q-form{
        animation:qmRise .4s cubic-bezier(.2,.75,.2,1) both;
      }
      .stats>.stat:nth-child(1),.round-cards>.round-card:nth-child(1){animation-delay:0ms}
      .stats>.stat:nth-child(2),.round-cards>.round-card:nth-child(2){animation-delay:60ms}
      .stats>.stat:nth-child(3),.round-cards>.round-card:nth-child(3){animation-delay:120ms}
      .stats>.stat:nth-child(4),.round-cards>.round-card:nth-child(4){animation-delay:180ms}
      .round-cards>.round-card:nth-child(5){animation-delay:240ms}
      .round-cards>.round-card:nth-child(6){animation-delay:300ms}
      .round-cards>.round-card:nth-child(n+7){animation-delay:340ms}
      @keyframes qmRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

      /* Podium glow for the top three leaderboard rows, on admin and projector alike */
      .leader-row:nth-child(1){background:linear-gradient(90deg,#fff7e0,transparent)}
      .leader-row:nth-child(1) .rank{color:#b8860b;font-size:15px;animation:podiumPulse 2.4s ease-in-out infinite}
      .leader-row:nth-child(2){background:linear-gradient(90deg,#f2f3f7,transparent)}
      .leader-row:nth-child(2) .rank{color:#7a7f92}
      .leader-row:nth-child(3){background:linear-gradient(90deg,#fdece1,transparent)}
      .leader-row:nth-child(3) .rank{color:#a6602c}
      .audience-board .leader-row:nth-child(1){background:linear-gradient(90deg,#3a331f,transparent)}
      .audience-board .leader-row:nth-child(2){background:linear-gradient(90deg,#2c2e3d,transparent)}
      .audience-board .leader-row:nth-child(3){background:linear-gradient(90deg,#332720,transparent)}
      @keyframes podiumPulse{0%,100%{text-shadow:0 0 0 transparent}50%{text-shadow:0 0 10px #e8b93d99}}

      /* Light shine sweep across primary buttons on hover — cheap, GPU-only */
      .btn{position:relative;overflow:hidden}
      .btn:before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,#ffffff45 48%,transparent 66%);transform:translateX(-120%);transition:transform .55s ease}
      .btn:hover:before{transform:translateX(120%)}

      /* Sidebar nav icon: a touch more life on hover/active */
      .sidebar .nav:hover .ico{transform:translateY(-1px) rotate(-4deg)}
      .sidebar .nav.active .ico{animation:navPop .3s ease both}
      @keyframes navPop{from{transform:scale(.85)}to{transform:scale(1)}}


      /* ---------- Rounds tab: cleaner cards, no underlined text ---------- */
      .round-card,.round-card *,.round-card summary{text-decoration:none!important}
      .round-card h3,.round-card .round-title{letter-spacing:-.01em}
      .round-card.round-card-modern{border:1px solid #e6e8f2}
      .round-card .btn{border-radius:12px;font-weight:800}
      .grant-all-bar{max-width:1020px;margin:0 auto 14px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:14px 18px;border-radius:16px;background:linear-gradient(120deg,#f4f2ff,#effbf7);border:1px solid #dcd8fb}
      .grant-all-bar strong{display:block;font-size:14px;color:#232742}
      .grant-all-bar span{font-size:12px;color:#5f6478}
      .grant-all-bar .btn{white-space:nowrap}

      /* ---------- Waiting lobby hero (participants + projector) ---------- */
      .lobby-hero{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;max-width:820px;margin:0 auto 22px;padding:22px 26px;border-radius:24px;background:linear-gradient(135deg,#ffffff14,#ffffff06);border:1px solid #ffffff26;backdrop-filter:blur(8px);animation:hostReveal .6s cubic-bezier(.2,.8,.2,1) both}
      .lobby-hero.light{background:linear-gradient(135deg,#fff,#f6f4ff);border-color:#dcd8fb;color:#232742}
      .lobby-hero img,.lobby-hero .lobby-avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #ffffffcc;box-shadow:0 0 0 4px #7566e94d,0 12px 28px #0003;animation:heroFloat 5s ease-in-out infinite}
      .lobby-hero .lobby-avatar{display:grid;place-items:center;font-size:40px;background:linear-gradient(135deg,#7161f2,#2b9c86);color:#fff}
      .lobby-hero small{display:block;font-size:11px;letter-spacing:.14em;font-weight:800;opacity:.7;text-transform:uppercase}
      .lobby-hero h2{margin:4px 0 2px;font-size:clamp(22px,4vw,38px);line-height:1.1}
      .lobby-hero p{margin:0;font-size:14px;opacity:.85}
      .lobby-hero .lobby-count{display:inline-block;margin-top:10px;padding:5px 12px;border-radius:20px;background:#2b9c8626;color:#2b9c86;font-size:12px;font-weight:800}
      .lobby-hero .lobby-you{display:inline-block;margin:10px 0 0 8px;padding:5px 12px;border-radius:20px;background:#7566e926;font-size:12px;font-weight:800}
      body:has(#lobbyHero) .host-banner,body:has(#lobbyHero) .host-welcome{display:none}
      @keyframes heroFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      @media(max-width:560px){.lobby-hero{grid-template-columns:1fr;justify-items:center;text-align:center}}

      @media(prefers-reduced-motion:reduce){
        .lobby-hero,.lobby-hero img{animation:none!important}
        .enhance-overlay,.enhance-modal{transition:none!important}
        .host-banner,.host-welcome,.projector-host{animation:none!important}
        .team-login,.hero,.stats>.stat,.round-cards>.round-card,.panels>.card,.table-panel,.question,.q-form,
        .leader-row:nth-child(1) .rank,.sidebar .nav.active .ico,.btn:before{animation:none!important;transition:none!important}
      }
    `;
    document.head.append(style);
  }
  addPolishStyles();
  document.addEventListener('DOMContentLoaded', addPolishStyles, { once: true });

  // Make toast announcements accessible to screen readers without changing its visual behavior.
  const baseToast = window.toast;
  if (typeof baseToast === 'function') {
    window.toast = function (message) {
      baseToast(message);
      const el = document.querySelector('.toast');
      if (el) { el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); }
    };
  }

  // Small in-site confirm dialog, styled like the existing modals, for actions that had none.
  function showPolishConfirm({ icon = '↻', eyebrow = '', title, body, confirmLabel = 'Continue', cancelLabel = 'Cancel', danger = false, onConfirm }) {
    document.getElementById('polishConfirm')?.remove();
    const modal = document.createElement('div');
    modal.className = 'enhance-overlay';
    modal.id = 'polishConfirm';
    modal.innerHTML = `<section class="enhance-modal polish-modal"><div class="modal-icon${danger ? ' danger-icon' : ''}">${icon}</div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h2>${title}</h2><p>${body}</p><div class="modal-actions"><button class="btn light" data-role="cancel">${cancelLabel}</button><button class="btn${danger ? ' danger-button' : ''}" data-role="confirm">${confirmLabel}</button></div></section>`;
    document.body.append(modal);
    requestAnimationFrame(() => modal.classList.add('visible'));
    const close = () => { modal.classList.remove('visible'); setTimeout(() => modal.remove(), 180); };
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.querySelector('[data-role="cancel"]').addEventListener('click', close);
    modal.querySelector('[data-role="confirm"]').addEventListener('click', () => { close(); onConfirm(); });
    modal.querySelector('[data-role="confirm"]').focus();
  }

  // Resetting a team's login code immediately invalidates the old one — confirm before doing it.
  const baseResetTeamCode = window.resetTeamCode;
  if (typeof baseResetTeamCode === 'function') {
    window.resetTeamCode = function (old) {
      const team = (S.teams || []).find(t => t.code === old);
      if (!team) return;
      showPolishConfirm({
        icon: '↻',
        eyebrow: 'TEAM ACCESS',
        title: `Reset login for ${esc(team.name)}?`,
        body: `Their current login password stops working immediately. Share the new one with the team right away.`,
        confirmLabel: 'Reset login',
        onConfirm: () => baseResetTeamCode(old)
      });
    };
  }

  // Redesign the mascot hint as a speech bubble beside the owl (kept functionally identical: opens the scorecard).
  if (typeof window.roundFeedback === 'function') {
    window.roundFeedback = function () {
      const rows = (S.answers || []).filter(a => a.correct !== null && a.correct !== undefined);
      if (!rows.length) return '';
      const right = rows.filter(a => a.correct).length, wrong = rows.length - right;
      return `<button class="mascot-hint" onclick="openAnswerStatus()"><span class="owl-mini">🦉</span><span class="mascot-bubble"><strong>Click here to check your answers status</strong><small>${right} correct · ${wrong} incorrect</small></span><i>Open scorecard →</i></button>`;
    };
  }

  // --- Focus / anti-cheat mode -------------------------------------------------
  // True tab-blocking isn't possible from a web page, so this does the next best
  // thing: it notices when a participant leaves the quiz tab or drops fullscreen
  // during a live round, counts it, and — when they come back — blocks the screen
  // with a clear "return to the quiz" prompt instead of a passive toast.
  let tabSwitchCount = 0, wentAwayAt = 0;
  function inLiveRound() { return role === 'participant' && S && S.phase === 'play'; }
  function armAntiCheat() {
    if (window.__qmAntiCheatBound) return;
    window.__qmAntiCheatBound = true;
    document.addEventListener('visibilitychange', () => {
      if (!inLiveRound()) return;
      if (document.hidden) { tabSwitchCount++; wentAwayAt = Date.now(); }
      else if (wentAwayAt) { wentAwayAt = 0; showReturnPrompt(); }
    });
    document.addEventListener('fullscreenchange', () => {
      if (inLiveRound() && !document.fullscreenElement) showReturnPrompt();
    });
  }
  function showReturnPrompt() {
    if (document.getElementById('anticheatPrompt')) return;
    const modal = document.createElement('div');
    modal.className = 'enhance-overlay';
    modal.id = 'anticheatPrompt';
    modal.innerHTML = `<section class="enhance-modal polish-modal"><div class="modal-icon anticheat-icon">⚠</div><div class="eyebrow">FOCUS PROTECTION</div><h2>Stay on the quiz screen</h2><p>Leaving this tab or exiting fullscreen during a live round is recorded. Your timer keeps running while you're away, so return quickly.</p>${tabSwitchCount > 1 ? `<span class="anticheat-count">${tabSwitchCount} times away this round</span>` : ''}<div class="modal-actions"><button class="btn" data-role="back">Return to the round</button></div></section>`;
    document.body.append(modal);
    requestAnimationFrame(() => modal.classList.add('visible'));
    modal.querySelector('[data-role="back"]').addEventListener('click', async () => {
      modal.classList.remove('visible');
      setTimeout(() => modal.remove(), 180);
      try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); } catch {}
    });
  }
  armAntiCheat();

  // Animate admin stat numbers counting up whenever their value actually changes
  // (skipped entirely under reduced motion; a no-op the rest of the time it runs
  // since most polls don't change the numbers).
  const lastStatValues = new Map();
  function animateStatCounters() {
    if (role !== 'admin' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.stat').forEach((card) => {
      const label = card.querySelector('.stat-label')?.textContent || '';
      const valueEl = card.querySelector('.stat-value');
      if (!valueEl) return;
      const raw = valueEl.textContent;
      const match = raw.match(/\d+/);
      if (!match) return;
      const target = Number(match[0]);
      const prev = lastStatValues.has(label) ? lastStatValues.get(label) : target;
      lastStatValues.set(label, target);
      if (prev === target) return;
      const prefix = raw.slice(0, match.index), suffix = raw.slice(match.index + match[0].length);
      const duration = 500, startTime = performance.now();
      (function step(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        valueEl.textContent = `${prefix}${Math.round(prev + (target - prev) * eased)}${suffix}`;
        if (t < 1) requestAnimationFrame(step); else valueEl.textContent = raw;
      })(startTime);
    });
  }

  // ---- Admin: one-click access to every round for every team ----
  window.grantAllRoundsAccess = function () {
    if (!S.teams?.length) return toast('Add teams first.');
    S.roundAccess = S.roundAccess || {};
    const later = (S.rounds || []).filter(r => r.n > 1);
    const already = later.every(r => S.teams.every(t => S.roundAccess[`${r.n}-${t.code}`]));
    for (const r of later) for (const t of S.teams) {
      const key = `${r.n}-${t.code}`;
      if (already) delete S.roundAccess[key]; else S.roundAccess[key] = true;
    }
    save(); render();
    toast(already ? 'Round passwords are required again.' : 'All teams can now enter every round.');
  };

  function decorateRounds() {
    const grid = document.querySelector('.round-cards');
    if (!grid || document.getElementById('grantAllBar') || role !== 'admin') return;
    const later = (S.rounds || []).filter(r => r.n > 1);
    const all = later.length && S.teams?.length && later.every(r => S.teams.every(t => S.roundAccess?.[`${r.n}-${t.code}`]));
    const bar = document.createElement('div');
    bar.id = 'grantAllBar'; bar.className = 'grant-all-bar';
    bar.innerHTML = `<div><strong>Round access for all teams</strong><span>Let every team enter every round without a password. Locks still apply — you control the phones from each round card.</span></div><button class="btn${all ? ' light' : ''}" onclick="grantAllRoundsAccess()">${all ? 'Require passwords again' : 'Grant access to all rounds'}</button>`;
    grid.parentNode.insertBefore(bar, grid);
  }

  // ---- Lobby hero: quiz name, host photo + name, team roster count ----
  function lobbyHero(light, myTeam) {
    const total = (S.teams || []).length, here = (S.teams || []).filter(t => t.online || t.present || t.checkedIn).length || total;
    const photo = S.hostPhotoUrl ? `<img src="${esc(S.hostPhotoUrl)}" alt="Quiz master">` : `<div class="lobby-avatar">🎤</div>`;
    return `<section class="lobby-hero${light ? ' light' : ''}" id="lobbyHero">${photo}<div><small>${esc(S.portalName || 'Welcome to')}</small><h2>${esc(S.quizName || 'QUIZ MASTER')}</h2><p>Hosted by <strong>${esc(S.hostName || 'your Quiz Master')}</strong></p><span class="lobby-count">${here} of ${total} teams in the lobby</span>${myTeam ? `<span class="lobby-you">You are ${esc(myTeam)}</span>` : ''}</div></section>`;
  }
  function decorateLobby() {
    if (document.getElementById('lobbyHero')) return;
    const grid = document.querySelector('.lobby-grid, .lobby-teams, .lobby-team')?.closest('section,div');
    const first = document.querySelector('.lobby-team');
    if (!first) return;
    const container = first.parentElement;
    const isParticipant = role === 'participant';
    const me = isParticipant ? (S.teams || []).find(t => t.code === (window.TEAM_CODE || S.teamCode))?.name || S.teamName : '';
    container.insertAdjacentHTML('beforebegin', lobbyHero(isParticipant, me));
  }

  const baseRenderForPolish = window.render;
  if (typeof baseRenderForPolish === 'function') {
    window.render = function () {
      baseRenderForPolish();
      addPolishStyles();
      animateStatCounters();
      try { decorateRounds(); decorateLobby(); } catch (e) { console.warn(e); }
    };
  }
})();
