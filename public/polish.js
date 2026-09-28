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

      @media(prefers-reduced-motion:reduce){
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
  function inLiveRound() { return role === 'participant' && S && S.phase === 'play' && (window.qmFocusProtectionActive ? window.qmFocusProtectionActive() : activeRound?.focusRequired !== false && !S.team?.focusExempt); }
  function armAntiCheat() {
    if (window.__qmAntiCheatBound) return;
    window.__qmAntiCheatBound = true;
    document.addEventListener('visibilitychange', () => {
      if (!inLiveRound()) return;
      if (document.hidden) { tabSwitchCount++; wentAwayAt = Date.now(); reportFocusEvent('tab-hidden'); }
      else if (wentAwayAt) { wentAwayAt = 0; showReturnPrompt(); }
    });
    document.addEventListener('fullscreenchange', () => {
      if (inLiveRound() && !document.fullscreenElement) { reportFocusEvent('fullscreen-exit'); showReturnPrompt(); }
    });
  }
  function reportFocusEvent(event) {
    const token = window.TEAM_TOKEN || (typeof TEAM_TOKEN !== 'undefined' ? TEAM_TOKEN : '');
    if (!token) return;
    fetch('/api/team/focus-event', { method:'POST', headers:{'content-type':'application/json',authorization:`Bearer ${token}`}, body:JSON.stringify({event}) }).catch(()=>{});
  }
  function showReturnPrompt() {
    if (document.getElementById('anticheatPrompt')) return;
    const modal = document.createElement('div');
    modal.className = 'enhance-overlay';
    modal.id = 'anticheatPrompt';
    modal.innerHTML = `<section class="enhance-modal polish-modal"><div class="modal-icon anticheat-icon">⚠</div><div class="eyebrow">FOCUS PROTECTION</div><h2>Return to the quiz</h2><p>Your host can see this focus alert. The quiz timer continues while you are away. Websites cannot block other apps, so please follow your host’s rules.</p>${tabSwitchCount > 1 ? `<span class="anticheat-count">${tabSwitchCount} times away this round</span>` : ''}<div class="modal-actions"><button class="btn" data-role="back">Return to the round</button></div></section>`;
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
  const baseRenderForPolish = window.render;
  if (typeof baseRenderForPolish === 'function') {
    window.render = function () {
      baseRenderForPolish();
      addPolishStyles();
      animateStatCounters();
    };
  }
})();
