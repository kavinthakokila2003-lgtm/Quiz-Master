/* Quiz Master interaction and audience enhancements. Loaded after app.js. */
(() => {
  const baseAudienceContent = window.audienceContent;
  const baseParticipantWaiting = window.participantWaiting;
  const baseStartPolling = window.startPolling;
  const baseStartClock = window.startClock;
  const baseSubmitRound = window.submitRound;
  const baseEnterRound = window.enterRound;
  const baseMarkReady = window.markReady;
  const baseSetRoundCount = window.setRoundCount;
  let displayTimer = 0;
  let countdownPulse = 0;
  let autoSubmissionScheduled = false;
  const hapticsSeen = new Set();

  const hostBlock = () => `<div class="host-banner projector-host">${S.hostPhotoUrl ? `<img class="host-photo" src="${esc(S.hostPhotoUrl)}" alt="${esc(S.hostName || 'Quiz host')}">` : `<div class="host-photo host-initials">${esc(hostInitials(S.hostName || 'Quiz Host'))}</div>`}<div><small>HOSTED BY</small><strong>${esc(S.hostName || 'Quiz Host')}</strong><span>${esc(S.quizName || S.portalName || 'Company quiz')}</span></div></div>`;
  const lobbyGrid = (teams = S.joinedTeams || []) => `<section class="lobby-panel"><div class="lobby-title"><div><span class="eyebrow">LIVE TEAM CHECK-IN</span><h2>Teams in the room</h2></div><span class="lobby-count">${teams.length} / ${S.teamCount || S.teams?.length || 0} joined</span></div><div class="lobby-grid">${teams.length ? teams.map((t, i) => `<div class="lobby-team" style="--team-color:${esc(t.logoColor || logoFor(t.name).logoColor)};--join-index:${i}">${logo(t, 42)}<strong>${esc(t.name)}</strong><span>Checked in</span></div>`).join('') : `<div class="lobby-empty">Waiting for the first team to join…</div>`}</div></section>`;
  const fmtLeft = (deadline) => { const sec = Math.max(0, Math.ceil((Number(deadline) - Date.now()) / 1000)); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; };
  const roundDurationMs = (r) => { const p=String(r?.time||'10:00').split(':').map(Number); return ((p.length>1 ? p[0]*60+p[1] : p[0]*60) || 600)*1000; };
  const activeRound = () => (S.rounds || []).find(r => r.active);
  const timerMarkup = (r) => r?.deadlineAt ? `<div class="projector-timer ${Math.ceil((r.deadlineAt - Date.now()) / 1000) <= 3 ? 'urgent' : ''}" data-deadline="${Number(r.deadlineAt)}">${fmtLeft(r.deadlineAt)}<small>TIME LEFT</small></div>` : '';

  window.audienceContent = function(preview = false) {
    const r = activeRound(), completedBefore = (S.rounds || []).some(x => x.status === 'Completed' || x.ended), teams = S.joinedTeams || [];
    if (!r && !completedBefore && !S.allTeamsComplete) {
      return `<div class="audience-head"><div><div class="eyebrow">WELCOME TO</div><h1>${esc(S.quizName || 'QUIZ MASTER')}</h1><p>Team check-in is open</p></div><span class="badge live">● LIVE LOBBY</span></div>${hostBlock()}${lobbyGrid(teams)}<footer>Teams appear here as they check in on their phones.</footer>`;
    }
    const q = S.projectedQuestion, roundName = q ? (S.rounds || []).find(x => x.n === q.round)?.name || fmtRound(q.round) : '';
    const question = r && q ? `<section class="audience-question">${timerMarkup(r)}<div class="eyebrow">${esc(roundName)}</div><h2>${esc(q.text)}</h2>${q.options?.length ? `<div class="audience-options">${q.options.map((x,i)=>`<div><b>${String.fromCharCode(65+i)}</b>${esc(x)}</div>`).join('')}</div>` : ''}</section>` : r ? `<section class="audience-question">${timerMarkup(r)}<h2>${r.participantLocked?'Participant screens are locked':'Round is opening'}</h2><p>${r.participantLocked?'The host will unlock the participant screens when the teams should begin.':`${Number(S.readyCount)||0} of ${Number(S.teamCount)||0} teams are ready. The question appears when all teams have checked in.`}</p></section>` : !S.allTeamsComplete ? `<section class="audience-question"><h2>${completedBefore ? 'Round complete' : 'Waiting for the host to start a round'}</h2><p>${completedBefore ? 'The next round will appear when the host opens it.' : 'The host will start the first round when teams are ready.'}</p></section>` : '';
    const board = S.leaderboard ? `<section class="audience-board"><div class="panel-head"><h2>🏆 ${r ? 'Live leaderboard' : completedBefore || S.allTeamsComplete ? 'Round leaderboard' : 'Leaderboard'}</h2><span class="badge live">${S.teams?.length || 0} teams</span></div>${leaderboardTable(false)}</section>` : '';
    const final = S.allTeamsComplete && S.finalQuestions?.length ? `<section class="audience-board final-answers"><div class="panel-head"><h2>Questions & correct answers</h2><span class="badge live">All rounds complete</span></div>${S.finalQuestions.map(x=>`<article class="question"><div class="qtop"><span>${esc((S.rounds||[]).find(a=>a.n===x.round)?.name||fmtRound(x.round))}</span><span class="correct-key">${Number(x.points)||0} points</span></div><p>${esc(x.text)}</p><div class="audience-answer">Correct answer: <strong>${esc(x.answer)}</strong></div></article>`).join('')}</section>` : '';
    return `<div class="audience-head"><div><div class="eyebrow">LIVE TOURNAMENT</div><h1>${esc(S.quizName || 'QUIZ MASTER')}</h1><p>${r ? `● ${esc(r.name)} is live` : completedBefore ? 'Round standings' : 'Team check-in'}</p></div><span class="badge live">● UPDATING LIVE</span></div>${hostBlock()}${question}${r&&!q?lobbyGrid(teams):''}${board}${final}<footer>${esc(S.quizName || 'QUIZ MASTER')} · Live audience display</footer>`;
  };

  window.participantWaiting = function() {
    let old = baseParticipantWaiting();
    const teams = S.joinedTeams || [];
    const r = activeRound();
    if (r?.participantLocked) old = old.replace('<section class="card waiting-card">', '<section class="card waiting-card participant-locked" data-participant-locked="true">').replace('<div class="progressline"', '<div class="participant-lock-notice">🔒 Participant screens are locked by the host. Please wait for the unlock signal.</div><div class="progressline"');
    return old.replace('</section></main>', `${lobbyGrid(teams)}</section></main>`);
  };

  window.settingsPage = function() {
    return shell(`${header('Tournament settings', 'Manage event identity, participant rules, audience display and quick links.')}
      <section class="card control-box settings-card"><h2>Quick links</h2><p class="sub">Copy these links to share with teams or open the projector.</p><div class="share-links"><div><span>Participant link</span><code>${esc(location.origin)}/participant</code><button class="btn tiny" onclick="copyText(location.origin+'/participant')">Copy participant link</button></div><div><span>Projector view link</span><code>${esc(location.origin)}/audience</code><button class="btn tiny light" onclick="copyText(location.origin+'/audience')">Copy projector link</button></div></div></section>
      <section class="card control-box settings-card"><h2>Event & participant page branding</h2><div class="field"><label>Quiz / event name</label><input value="${esc(S.quizName || 'QUIZ MASTER')}" onchange="setBrandValue('quizName',this.value)"></div><div class="field"><label>Participant page title</label><input value="${esc(S.portalName || S.quizName || 'QUIZ MASTER')}" onchange="setBrandValue('portalName',this.value)"></div><div class="field"><label>Quiz master / host name</label><input value="${esc(S.hostName || 'Quiz Host')}" onchange="setBrandValue('hostName',this.value)"></div><div class="host-photo-setting"><div>${S.hostPhotoUrl ? `<img class="host-preview" src="${esc(S.hostPhotoUrl)}" alt="Host photo preview">` : `<div class="host-preview host-initials">${esc(hostInitials(S.hostName || 'Quiz Host'))}</div>`}</div><div class="field"><label>Quiz master photo</label><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="uploadHostPhoto(this.files[0])"><small class="sub">Image up to 1.8 MB.</small><input type="url" placeholder="Or paste a public photo link" value="${esc((S.hostPhotoUrl || '').startsWith('/media/') ? '' : S.hostPhotoUrl || '')}" onchange="setBrandValue('hostPhotoUrl',this.value)"></div></div>
      <div class="field rules-editor"><label for="rulesText">Rules and conditions shown before teams begin</label><textarea id="rulesText" rows="5" maxlength="1500">${esc(S.rulesText || 'Work as a team. Keep your team and round passwords private. Submitted answers cannot be changed. Stay on the quiz page and follow the host’s instructions.')}</textarea><button class="btn tiny" onclick="saveRulesText()">Save rules</button></div><div class="switch-row"><div><strong>Show leaderboard to audience</strong><div class="sub">The projector refreshes automatically.</div></div><button class="switch ${S.leaderboard ? 'on' : ''}" onclick="toggleBoard()" aria-label="Toggle leaderboard"></button></div><div class="export-card"><strong>Download participant answers</strong><p>Includes each team’s answer, correct answer, points and answer time.</p>${btn('↓ Export all answers CSV', 'exportAnswers()', 'tiny')}</div></section>`, 'Settings');
  };
  window.saveRulesText = async function() { const previous = S.rulesText; S.rulesText = $('rulesText')?.value.trim() || ''; const ok = await persistPopup(null); if (!ok) { S.rulesText = previous; return; } render(); toast('Rules saved.'); };

  window.copyText = async function(text) {
    try { await navigator.clipboard.writeText(String(text)); toast('Link copied to clipboard.'); }
    catch { const box = document.createElement('textarea'); box.value = String(text); box.style.position = 'fixed'; box.style.opacity = '0'; document.body.append(box); box.select(); const ok = document.execCommand('copy'); box.remove(); toast(ok ? 'Link copied to clipboard.' : String(text)); }
  };

  window.startPolling = function() {
    baseStartPolling(); clearInterval(displayTimer);
    clearInterval(window.__qmLockMonitor);
    if (role === 'audience' || role === 'participant') displayTimer = setInterval(() => {
      document.querySelectorAll('.projector-timer[data-deadline], #roundTimer').forEach(el => {
        const deadline = Number(el.dataset.deadline || activeRound?.deadlineAt); if (!deadline) return;
        const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        if (el.id === 'roundTimer') el.innerHTML = `${fmtLeft(deadline)} <span>remaining</span>`;
        else { el.firstChild.textContent = fmtLeft(deadline); el.classList.toggle('urgent', remain <= 3); }
      });
    }, 250);
    if (role === 'participant' && TEAM_TOKEN) window.__qmLockMonitor = setInterval(async () => {
      if (S.phase !== 'play') return;
      try {
        const d = await api('/api/team/state'), previous = activeRound?.participantLocked, r = (d.state.rounds || []).find(x => Number(x.n) === Number(activeRound?.n));
        S = Object.assign(S, d.state, { team:d.team, answers:d.answers, revealAnswers:d.revealAnswers, phase:'play', role:'participant' });
        if (!r?.active) { activeRound = null; activeQuestionSet = []; S.phase = 'waiting'; render(); startPolling(); return; }
        if (activeRound) { activeRound.deadlineAt = r.deadlineAt; activeRound.participantLocked = !!r.participantLocked; }
        if (previous !== !!r.participantLocked) render();
      } catch {}
    }, 1800);
  };

  window.startClock = function() {
    baseStartClock(); clearInterval(countdownPulse);
    countdownPulse = setInterval(() => {
      if (S.phase !== 'play' || !activeRound?.deadlineAt) return;
      const remain = Math.max(0, Math.ceil((activeRound.deadlineAt - Date.now()) / 1000));
      const el = $('roundTimer'); if (el) el.classList.toggle('urgent', remain <= 3);
      if (remain >= 1 && remain <= 3 && !hapticsSeen.has(remain)) { hapticsSeen.add(remain); try { navigator.vibrate?.(70); } catch {} }
    }, 200);
  };

  window.confirmSubmitRound = function() {
    const answered = (activeQuestionSet || []).filter(q => String(draftAnswers[q.id] || '').trim()).length;
    showEnhancementModal(`<div class="modal-icon">✓</div><div class="eyebrow">FINAL CHECK</div><h2>Submit your answers?</h2><p>You have answered ${answered} of ${(activeQuestionSet || []).length} questions. Once submitted, your answers are locked and cannot be edited.</p><div class="modal-actions"><button class="btn light" onclick="closeEnhancementModal()">Go back</button><button class="btn" onclick="closeEnhancementModal();submitRound(true)">Submit and lock</button></div>`);
  };
  window.submitRound = function(auto = false) {
    if (!auto) return window.confirmSubmitRound();
    if (autoSubmissionScheduled) return;
    autoSubmissionScheduled = true;
    const closeBeforeDeadline = setInterval(() => {
      const remain = activeRound?.deadlineAt ? Math.ceil((activeRound.deadlineAt - Date.now()) / 1000) : 0;
      if (remain <= 1 || S.phase !== 'play') { clearInterval(closeBeforeDeadline); autoSubmissionScheduled = false; if (S.phase === 'play') baseSubmitRound(true); }
    }, 80);
  };

  window.openAnswerStatus = function() {
    const rows = (S.answers || []).filter(a => a.correct !== null && a.correct !== undefined);
    const right = rows.filter(a => a.correct).length, wrong = rows.length - right;
    showEnhancementModal(`<div class="owl-mascot" aria-hidden="true">🦉</div><div class="eyebrow">TEAM SCORECARD</div><h2>Your answer status</h2><div class="score-summary"><span><b>${right}</b>Correct</span><span><b>${wrong}</b>Incorrect</span><span><b>${rows.reduce((sum,a)=>sum+(Number(a.points)||0),0)}</b>Points</span></div><div class="score-answers">${rows.map(a=>`<article><strong>${esc(a.question_text || a.question_id)}</strong><span class="${a.correct?'score-good':'score-bad'}">${a.correct?'Correct':'Incorrect'}</span><small>Your answer: ${esc(a.answer || 'No answer')}${S.revealAnswers ? ` · Correct: ${esc(a.correct_answer || '')}` : ''}</small></article>`).join('') || '<p>No submitted answers yet.</p>'}</div><div class="modal-actions"><button class="btn" onclick="closeEnhancementModal()">Close</button></div>`);
  };

  window.roundFeedback = function() {
    const rows = (S.answers || []).filter(a => a.correct !== null && a.correct !== undefined);
    if (!rows.length) return '';
    const right = rows.filter(a => a.correct).length, wrong = rows.length - right;
    return `<button class="mascot-hint" onclick="openAnswerStatus()"><span class="owl-mini">🦉</span><span><strong>Tap to check your answer status</strong><small>${right} correct · ${wrong} incorrect</small></span><i>Open scorecard →</i></button>`;
  };

  window.roundCard = function(r) {
    const qcount=(S.questions||[]).filter(q=>questionRound(q)===r.n).length;
    const lines=(S.teams||[]).map(t=>({t,p:S.passwords?.[`${r.n}-${t.code}`],direct:!!S.roundAccess?.[`${r.n}-${t.code}`]}));
    const ready=(S.readyByRound?.[String(r.n)]||[]).filter(code=>S.teams.some(t=>t.code===code)).length;
    const allDirect=!!S.teams.length&&S.teams.every(t=>S.roundAccess?.[`${r.n}-${t.code}`]);
    return `<article class="card round-card round-card-modern ${r.active?'round-is-live':''}"><div class="round-top"><div class="round-title"><span class="round-n">${r.n}</span><div><strong>${esc(r.name)}</strong><small>${qcount} questions · ${roundMinutes(r.time)} minutes · ${ready}/${S.teams.length} ready</small></div></div><span class="badge ${r.active?'live':''}">${esc(r.status||'Locked')}</span></div><div class="form-grid round-fields"><div class="field"><label>Round name</label><input value="${esc(r.name)}" onchange="setRound(${r.n},'name',this.value)"></div><div class="field"><label>Time limit (minutes)</label><input type="number" min="1" max="240" value="${roundMinutes(r.time)}" onchange="setRound(${r.n},'time',this.value)"></div><div class="field"><label>Default points</label><input type="number" min="0" value="${Number(r.points??10)}" onchange="setRound(${r.n},'points',this.value)"></div></div>${r.n>1?`<label class="access-toggle"><input type="checkbox" ${r.passwordRequired===false?'':'checked'} onchange="togglePasswordMode(${r.n},this.checked)"> Require team passwords for this round</label><div class="row-actions">${btn(allDirect?'Require passwords from all teams':'Grant direct access to all teams',`toggleAllTeamAccess(${r.n})`,'tiny light')}</div>`:''}<div class="round-access-control"><span class="access-state ${r.active?(r.participantLocked?'locked':'unlocked'):''}">${r.active?(r.participantLocked?'🔒 Participant screens locked':'● Participant screens unlocked'):'Participant access opens when this round starts'}</span><div class="row-actions">${r.active?btn(r.participantLocked?'🔓 Unlock participant screens':'🔒 Lock participant screens',`toggleParticipantLock(${r.n})`,r.participantLocked?'tiny unlock-action':'tiny lock-action'):r.status==='Completed'?'<span class="sub">Round complete · Waiting for admin</span>':r.n===1?btn('▶ Start Round 1',`startRound(${r.n})`,'tiny'):btn('▶ Start round',`openRoundForAll(${r.n})`,'tiny')}${r.n>1?btn('↓ Password sheet',`downloadRoundPasswords(${r.n})`,'tiny light'):''}</div></div>${r.n>1?`<details class="password-list"><summary>Team access · grant individually or review passwords</summary>${lines.map(({t,p,direct})=>`<div>${logo(t,25)}<strong>${esc(t.name)}</strong><code>${direct||r.passwordRequired===false?'Direct access':esc(p||'Password generated when round starts')}</code><button class="small-link" onclick="toggleTeamAccess(${r.n},${jsarg(t.code)})">${direct?'Require password':'Grant direct access'}</button></div>`).join('')}</details>`:''}</article>`;
  };

  window.toggleParticipantLock = async function(n) {
    const r=(S.rounds||[]).find(x=>Number(x.n)===Number(n)); if(!r?.active)return;
    if(r.participantLocked){r.participantLocked=false;r.deadlineAt=Date.now()+Math.max(1000,Number(r.remainingMs)||roundDurationMs(r));delete r.remainingMs;delete r.lockedAt;}
    else {r.remainingMs=Math.max(1000,Number(r.deadlineAt||0)-Date.now());r.participantLocked=true;r.lockedAt=Date.now();r.deadlineAt=null;}
    const ok=await persistPopup(null);if(!ok)return;render();toast(r.participantLocked?'Participant screens locked. The round timer is paused.':'Participant screens unlocked. The round timer is running.');
  };

  window.removeTeam = function(code) {
    const team=(S.teams||[]).find(t=>t.code===code); if(!team)return;
    showEnhancementModal(`<div class="modal-icon danger-icon">⌫</div><div class="eyebrow">TEAM ACCESS</div><h2>Remove ${esc(team.name)}?</h2><p>This team will no longer be able to sign in. Its submitted answers will remain in the export under the team name.</p><div class="modal-actions"><button class="btn light" onclick="closeEnhancementModal()">Keep team</button><button class="btn danger-button" onclick="closeEnhancementModal();removeTeamConfirmed(${jsarg(code)})">Remove team</button></div>`);
  };
  window.removeTeamConfirmed = async function(code) {
    const team=(S.teams||[]).find(t=>t.code===code);if(!team)return;
    const previous=JSON.parse(JSON.stringify(S));
    S.archivedTeams=[...(S.archivedTeams||[]).filter(t=>t.code!==code),{code,name:team.name}];
    S.teams=S.teams.filter(t=>t.code!==code);
    for(const map of [S.passwords,S.roundAccess,S.verifiedRounds])if(map)for(const key of Object.keys(map))if(key.endsWith(`-${code}`))delete map[key];
    for(const round of Object.keys(S.readyByRound||{}))S.readyByRound[round]=(S.readyByRound[round]||[]).filter(x=>x!==code);
    if(S.presence)delete S.presence[code];
    if(!await persistPopup(null)){S=previous;render();return;}
    render();toast(`${team.name} removed. Past answers are still available in the export.`);
  };
  window.deleteQuestion = function(id) {
    const q=(S.questions||[]).find(x=>String(x.id)===String(id));if(!q)return;
    showEnhancementModal(`<div class="modal-icon danger-icon">⌫</div><div class="eyebrow">QUESTION BANK</div><h2>Delete this question?</h2><p>${esc(q.text)}</p><div class="modal-actions"><button class="btn light" onclick="closeEnhancementModal()">Cancel</button><button class="btn danger-button" onclick="closeEnhancementModal();deleteQuestionConfirmed(${jsarg(id)})">Delete question</button></div>`);
  };
  window.deleteQuestionConfirmed = async function(id) {
    const previous=JSON.parse(JSON.stringify(S));
    S.questions=(S.questions||[]).filter(q=>String(q.id)!==String(id));
    (S.rounds||[]).forEach(r=>r.q=S.questions.filter(q=>questionRound(q)===r.n).length);
    if(String(S.projectedQuestionId)===String(id))S.projectedQuestionId=null;
    if(!await persistPopup(null)){S=previous;render();return;}
    render();toast('Question deleted.');
  };
  window.setRoundCount = function() {
    const count=Math.max(1,Math.min(20,Math.floor(Number($('roundCount')?.value)||1))),current=(S.rounds||[]).length;
    if(count<current){const removing=(S.questions||[]).filter(q=>questionRound(q)>count).length;if(removing){showEnhancementModal(`<div class="modal-icon danger-icon">!</div><div class="eyebrow">ROUND SETUP</div><h2>Remove ${current-count} round${current-count===1?'':'s'}?</h2><p>${removing} question${removing===1?'':'s'} in the removed rounds will also be deleted. Rounds with submitted answers or an active round cannot be removed.</p><div class="modal-actions"><button class="btn light" onclick="closeEnhancementModal()">Cancel</button><button class="btn danger-button" onclick="closeEnhancementModal();applyRoundCount(${count})">Remove rounds</button></div>`);return;}}
    const saved=window.confirm;window.confirm=()=>true;try{baseSetRoundCount();}finally{window.confirm=saved;}
  };
  window.applyRoundCount = function(count) { const saved=window.confirm;window.confirm=()=>true;try{$('roundCount').value=String(count);baseSetRoundCount();}finally{window.confirm=saved;} };

  const originalStartRound = window.startRound;
  window.startRound = function(n) {
    hapticsSeen.clear(); autoSubmissionScheduled = false;
    originalStartRound(n);
    const r=(S.rounds||[]).find(x=>Number(x.n)===Number(n));
    if(r?.active){r.participantLocked=true;r.remainingMs=roundDurationMs(r);r.deadlineAt=null;r.lockedAt=Date.now();save();render();toast(`${r.name} started locked. Unlock participant screens when you are ready.`);}
  };
  window.markReady = function(n) { if (!sessionStorage.getItem('quizMasterRulesAccepted')) { showRulesModal(); return; } return baseMarkReady(n); };
  window.enterRound = function(n) { if (!sessionStorage.getItem('quizMasterRulesAccepted')) { showRulesModal(); return; } hapticsSeen.clear(); autoSubmissionScheduled = false; return baseEnterRound(n); };
  window.endRound = (function(base) { return function(n) { closeEnhancementModal(); return base(n); }; })(window.endRound);

  function showEnhancementModal(markup) {
    closeEnhancementModal(); const modal = document.createElement('div'); modal.className = 'enhance-overlay'; modal.id = 'enhanceModal';
    modal.innerHTML = `<section class="enhance-modal">${markup}</section>`; document.body.append(modal);
    requestAnimationFrame(() => modal.classList.add('visible'));
  }
  window.closeEnhancementModal = function() { const modal = document.getElementById('enhanceModal') || document.getElementById('rulesModal'); if (!modal) return; modal.classList.remove('visible'); setTimeout(() => modal.remove(), 180); };
  function addEnhancementStyles() {
    if (document.getElementById('qmEnhancementStyles')) return;
    const style = document.createElement('style'); style.id = 'qmEnhancementStyles'; style.textContent = `
      .share-links{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}.share-links>div{display:grid;gap:10px;padding:16px;border:1px solid var(--line);border-radius:14px;background:#fbfaff}.share-links span{font-size:11px;font-weight:800;color:var(--muted)}.share-links code{font-size:11px;overflow-wrap:anywhere;color:#5e50c8}.rules-editor{margin-top:20px}.rules-editor textarea{width:100%;padding:12px;border:1px solid var(--line);border-radius:11px;font:inherit;resize:vertical;color:var(--ink)}
      .lobby-panel{max-width:1150px;margin:20px auto;padding:clamp(18px,3vw,28px);border:1px solid #2b2d3c;border-radius:18px;background:linear-gradient(145deg,#1d2030,#202538)}.lobby-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}.lobby-title h2{color:white}.lobby-count{color:#bdb7ff;background:#302d49;border-radius:30px;padding:8px 12px;font-size:12px;font-weight:800}.lobby-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:12px}.lobby-team{display:grid;justify-items:center;gap:8px;padding:16px 10px;border:1px solid color-mix(in srgb,var(--team-color) 45%,#343748);border-radius:15px;background:color-mix(in srgb,var(--team-color) 12%,#232638);color:white;animation:teamArrive .4s both;animation-delay:calc(var(--join-index)*35ms)}.lobby-team .team-logo{box-shadow:0 5px 20px color-mix(in srgb,var(--team-color) 24%,transparent)}.lobby-team strong{font-size:13px;text-align:center}.lobby-team span:last-child{font-size:10px;color:#b3b5c1}.lobby-empty{grid-column:1/-1;padding:24px;text-align:center;color:#a8aaba}.projector-host{max-width:1150px;margin:0 auto 18px;color:#21263a;background:linear-gradient(110deg,#24283a,#292b41);border-color:#383b52}.projector-host strong,.projector-host span{color:#f2f2fb!important}.projector-host small{color:#babbd0!important}.projector-timer{float:right;display:grid;justify-items:center;gap:3px;min-width:122px;padding:11px 15px;border-radius:14px;background:#292d40;color:white;font:800 28px Manrope;box-shadow:inset 0 0 0 1px #41465e}.projector-timer small{font:700 9px 'DM Sans',sans-serif;letter-spacing:1px;color:#aeb1c4}.projector-timer.urgent,.timer.urgent{color:#fff;background:#b92843;box-shadow:0 0 18px #ff29466e;animation:redPulse .7s infinite alternate}
      .enhance-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:#171929a8;opacity:0;transition:opacity .18s ease;backdrop-filter:blur(6px)}.enhance-overlay.visible{opacity:1}.enhance-modal{width:min(480px,100%);max-height:min(84vh,750px);overflow:auto;padding:28px;border-radius:22px;background:#fff;box-shadow:0 25px 90px #090b1880;transform:translateY(12px) scale(.98);transition:transform .2s ease}.visible .enhance-modal{transform:translateY(0) scale(1)}.enhance-modal h2{font-size:22px;margin:4px 0 10px}.enhance-modal p{color:#777b90;line-height:1.65}.enhance-modal .modal-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#eceaff;color:#6353d4;font-size:22px;margin-bottom:14px}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:22px}.owl-mascot{font-size:48px;animation:owlBob 2.2s ease-in-out infinite;transform-origin:center}.mascot-hint{width:100%;display:flex;align-items:center;gap:12px;margin:20px 0 0;padding:14px 16px;border:1px solid #e6e2ff;border-radius:16px;background:linear-gradient(110deg,#f8f6ff,#f0fbf8);text-align:left;cursor:pointer}.mascot-hint:hover{transform:translateY(-2px);box-shadow:0 12px 28px #3d38731a}.owl-mini{font-size:34px;animation:owlBob 2.2s ease-in-out infinite}.mascot-hint>span:nth-child(2){display:grid;gap:4px;flex:1}.mascot-hint strong{font-size:12px;color:#292d43}.mascot-hint small{font-size:10px;color:#85899a}.mascot-hint i{font-style:normal;color:#6655d7;font-size:11px;font-weight:800}.score-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}.score-summary span{display:grid;gap:5px;text-align:center;padding:12px 6px;background:#f7f6fc;border-radius:12px;color:#828598;font-size:10px}.score-summary b{font-size:22px;color:#282c41}.score-answers{display:grid;gap:8px}.score-answers article{display:grid;gap:6px;padding:12px;border:1px solid #eeeef3;border-radius:12px}.score-answers article strong{font-size:12px}.score-answers small{color:#777b8c}.score-good{color:#229b70}.score-bad{color:#c84457}.focus-note{position:fixed;left:50%;bottom:18px;z-index:900;transform:translate(-50%,18px);opacity:0;padding:12px 16px;border-radius:12px;background:#812e40;color:#fff;box-shadow:0 9px 30px #0003;transition:.2s}.focus-note.visible{opacity:1;transform:translate(-50%,0)}
      @keyframes teamArrive{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes redPulse{from{box-shadow:0 0 6px #ff29464a}to{box-shadow:0 0 23px #ff2946c9}}@keyframes owlBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-5px) rotate(3deg)}}@media(max-width:650px){.share-links{grid-template-columns:1fr}.lobby-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.projector-timer{float:none;width:max-content;margin:0 0 14px}.mascot-hint i{display:none}.enhance-modal{padding:23px}}@media(prefers-reduced-motion:reduce){.lobby-team,.owl-mascot,.owl-mini,.projector-timer.urgent,.timer.urgent{animation:none!important}.enhance-overlay,.enhance-modal{transition:none}}
    `; document.head.append(style);
  }
  window.addEventListener('DOMContentLoaded', addEnhancementStyles, { once: true }); addEnhancementStyles();

  const oldRender = window.render;
  window.render = function() {
    oldRender(); addEnhancementStyles();
    if (role === 'participant' && TEAM_TOKEN && S.phase !== 'play' && !sessionStorage.getItem('quizMasterRulesAccepted')) showRulesModal();
    if (role === 'participant' && S.phase === 'play') {
      armFocusWarning();
      if(activeRound?.participantLocked){if(!document.getElementById('roundLockOverlay')){const overlay=document.createElement('div');overlay.id='roundLockOverlay';overlay.className='enhance-overlay visible';overlay.innerHTML='<section class="enhance-modal lock-modal"><div class="modal-icon lock-icon">🔒</div><div class="eyebrow">HOST CONTROL</div><h2>Round paused by your host</h2><p>Your answers are saved on this device while participant screens are locked. Wait here; the timer is paused and your team can continue when the host unlocks the round.</p><span class="lock-wait-pulse">Waiting for unlock…</span></section>';document.body.append(overlay);}}
      else document.getElementById('roundLockOverlay')?.remove();
    } else document.getElementById('roundLockOverlay')?.remove();
  };
  function showRulesModal() {
    if (document.getElementById('rulesModal')) return;
    const modal = document.createElement('div'); modal.className = 'enhance-overlay'; modal.id = 'rulesModal';
    modal.innerHTML = `<section class="enhance-modal"><div class="modal-icon">✦</div><div class="eyebrow">BEFORE YOU BEGIN</div><h2>Rules and conditions</h2><p>${esc(S.rulesText || 'Work as a team. Keep your team and round passwords private. Submitted answers cannot be changed. Stay on the quiz page and follow the host’s instructions.').replaceAll('\n','<br>')}</p><p>Fullscreen and vibration may be unavailable on some devices. You can still continue if your browser does not support them.</p><div class="modal-actions"><button class="btn light" onclick="leaveTeam()">Leave</button><button class="btn" onclick="acceptQuizRules()">I understand · Continue</button></div></section>`;
    document.body.append(modal); requestAnimationFrame(() => modal.classList.add('visible'));
  }
  window.acceptQuizRules = async function() {
    sessionStorage.setItem('quizMasterRulesAccepted', 'yes');
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); } catch {}
    try { navigator.vibrate?.(25); } catch {}
    closeEnhancementModal();
  };
  let focusWarningTimer;
  function armFocusWarning() {
    if (!window.__qmFocusBound) {
      window.__qmFocusBound = true;
      document.addEventListener('visibilitychange', () => { if (role === 'participant' && S.phase === 'play' && document.hidden) showFocusWarning(); });
      document.addEventListener('fullscreenchange', () => { if (role === 'participant' && S.phase === 'play' && !document.fullscreenElement) showFocusWarning(); });
    }
  }
  function showFocusWarning() {
    let note = document.getElementById('focusNote'); if (!note) { note = document.createElement('div'); note.id = 'focusNote'; note.className = 'focus-note'; note.textContent = 'Please stay on the quiz screen while your round is active.'; document.body.append(note); }
    note.classList.add('visible'); clearTimeout(focusWarningTimer); focusWarningTimer = setTimeout(() => note.classList.remove('visible'), 2600);
  }

  function addLockAndColorStyles() {
    if(document.getElementById('qmLockColorStyles'))return;
    const style=document.createElement('style');style.id='qmLockColorStyles';style.textContent=`
      .round-access-control{margin-top:15px;padding:14px 15px;border:1px solid #e6e5f0;border-radius:15px;background:linear-gradient(115deg,#faf9ff,#f3faf9)}.round-access-control .row-actions{margin-top:9px}.access-state{font-size:11px;font-weight:750;color:#7c8192}.access-state.locked{color:#b34457}.access-state.unlocked{color:#258767}.lock-action{background:linear-gradient(120deg,#a93c55,#d85c68)!important;box-shadow:0 6px 18px #bd465522!important}.unlock-action{background:linear-gradient(120deg,#168969,#38b897)!important;box-shadow:0 6px 18px #23a7832c!important}.round-card-modern{position:relative;overflow:hidden;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}.round-card-modern:before{content:'';position:absolute;inset:0 auto 0 0;width:4px;background:linear-gradient(#7666e9,#36b69c);opacity:.35}.round-card-modern:hover{transform:translateY(-3px);box-shadow:0 18px 42px #43436a17!important}.round-card-modern.round-is-live{border-color:#c9c3ff}.participant-lock-notice{margin:18px auto 8px;max-width:460px;padding:14px 16px;border:1px solid #f0d7dc;border-radius:13px;background:linear-gradient(110deg,#fff3f4,#fff9f0);color:#9f3549;font-size:12px;font-weight:750;animation:lockReveal .32s both}.lock-modal{text-align:center}.lock-modal .lock-icon{margin:0 auto 14px}.lock-wait-pulse{display:inline-block;margin-top:8px;padding:8px 12px;border-radius:20px;background:#fff2f2;color:#a93c55;font-size:11px;font-weight:800;animation:waitPulse 1.3s ease-in-out infinite}.danger-icon{background:linear-gradient(145deg,#fff0f1,#ffe6e9)!important;color:#bc3d51!important}.danger-button{background:linear-gradient(120deg,#b63a50,#d65265)!important;box-shadow:0 7px 18px #c743582c!important}.enhance-modal .eyebrow{margin-top:2px}.enhance-modal .danger-button:hover{box-shadow:0 10px 24px #c7435844!important}.score-answers article:hover,.share-links>div:hover{border-color:#bcb4ff;box-shadow:0 8px 22px #48437d12}.btn{transition:transform .18s ease,box-shadow .18s ease,filter .18s ease}.btn:hover{transform:translateY(-1px);filter:saturate(1.12);box-shadow:0 8px 20px #423a8728}.btn:active{transform:translateY(0) scale(.985)}input:focus,textarea:focus,select:focus{outline:3px solid #7566e925!important;border-color:#7767e8!important;box-shadow:0 0 0 1px #7767e8!important}@keyframes lockReveal{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}@keyframes waitPulse{50%{box-shadow:0 0 0 6px #e9525a12;opacity:.72}}@media(prefers-reduced-motion:reduce){.round-card-modern,.btn{transition:none!important}.round-card-modern:hover,.btn:hover{transform:none!important}.lock-wait-pulse{animation:none}}
    `;document.head.append(style);
  }
  addLockAndColorStyles();
})();
