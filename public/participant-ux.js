/* Participant quiz flow: clear status, dependable answer input, and safe retry behavior. */
(() => {
  const baseWaiting = window.participantWaiting;
  const baseEnterRound = window.enterRound;
  const baseSubmitRound = window.submitRound;
  let submitting = false;

  const draftKey = (round) => `quizMasterDraft:${S.team?.code || 'team'}:${Number(round)}`;
  const answeredCount = () => (activeQuestionSet || []).filter((q) => String(draftAnswers[q.id] || '').trim()).length;

  function updateAnswerProgress() {
    const count = answeredCount();
    const total = (activeQuestionSet || []).length;
    const label = document.querySelector('[data-answered-count]');
    const progress = document.querySelector('[data-answer-progress]');
    if (label) label.textContent = `${count} of ${total} answered`;
    if (progress) progress.style.width = `${total ? Math.round((count / total) * 100) : 0}%`;
  }

  function persistDraft() {
    if (activeRound?.n) sessionStorage.setItem(draftKey(activeRound.n), JSON.stringify(draftAnswers || {}));
  }

  window.participantWaiting = function () {
    let markup = baseWaiting();
    const progress = Number(String(S.team?.progress || '0/0').split('/')[0]) || 0;
    const next = (S.rounds || []).find((round) => Number(round.n) === progress + 1);
    const active = (S.rounds || []).find((round) => round.active && progress < Number(round.n));
    const current = active || next;
    if (current && Number(current.q || 0) === 0) {
      const message = `<aside class="participant-status-card participant-status-preparing" role="status"><span class="participant-status-icon">i</span><div><strong>Questions are being prepared</strong><p>${esc(current.name || `Round ${current.n}`)} does not have any questions yet. Your team can enter as soon as the host adds questions and opens the round.</p></div></aside>`;
      markup = markup.replace('<div class="progressline"', `${message}<div class="progressline"`);
    }
    return markup;
  };

  window.playPage = function () {
    const round = activeRound || {};
    const questions = activeQuestionSet || [];
    const locked = !!round.participantLocked;
    if (!questions.length) {
      return `<header class="qp-header"><a class="qp-brand" href="/participant"><span>QM</span><b>${esc(S.portalName || S.quizName || 'QUIZ MASTER')}</b></a><span class="qp-pill">TEAM QUIZ</span></header><main class="qp-shell"><section class="qp-empty card"><span class="qp-empty-icon">!</span><div class="eyebrow">${esc(round.name || 'ROUND')}</div><h1>Questions aren’t available yet</h1><p>The host has not added questions to this round. Your answers have not been changed. Stay on this page or return to your team lobby.</p><button class="btn" type="button" onclick="returnToTeamLobby()">Return to team lobby</button></section></main>`;
    }
    const count = answeredCount();
    const cards = questions.map((q, i) => {
      const options = Array.isArray(q.options) ? q.options : [];
      const selected = String(draftAnswers[q.id] || '');
      const control = options.length
        ? `<div class="qp-options" role="group" aria-label="Answer choices">${options.map((option, index) => `<button type="button" class="qp-option ${selected === option ? 'is-selected' : ''}" data-qm-answer="1" data-question-id="${esc(q.id)}" data-answer-value="${esc(option)}" aria-pressed="${selected === option}" ${locked || submitting ? 'disabled' : ''}><span class="qp-option-key">${String.fromCharCode(65 + index)}</span><span>${esc(option)}</span><span class="qp-option-check" aria-hidden="true">✓</span></button>`).join('')}</div>`
        : `<label class="qp-answer-label" for="answer-${i}">Your answer</label><input class="qp-text-answer" id="answer-${i}" type="text" autocomplete="off" maxlength="2000" data-qm-typed="1" data-question-id="${esc(q.id)}" value="${esc(selected)}" placeholder="Type your answer here" ${locked || submitting ? 'disabled' : ''}>`;
      return `<article class="qp-question card ${locked ? 'is-locked' : ''}" data-question-card="${esc(q.id)}"><div class="qp-question-top"><span class="qp-question-number">QUESTION ${String(i + 1).padStart(2, '0')}</span><span class="qp-points">${Number(q.points) || 0} points</span></div>${mediaMarkup(q.mediaUrl, q.mediaType)}<h2>${esc(q.text || `Question ${i + 1}`)}</h2>${control}</article>`;
    }).join('');
    return `<header class="qp-header"><div class="qp-brand"><span>QM</span><div><b>${esc(S.portalName || S.quizName || 'QUIZ MASTER')}</b><small>${esc(S.team?.name || 'Team')} · ${esc(round.name || 'Round')}</small></div></div><div class="qp-header-tools"><span class="qp-pill">${questions.length} QUESTIONS</span><div class="qp-timer" id="roundTimer">--:-- <small>remaining</small></div></div></header><main class="qp-shell"><section class="qp-session"><div><span class="eyebrow">${esc(round.name || 'LIVE ROUND')}</span><h1>Work together. Choose carefully.</h1><p>Your answers stay on this screen until you submit. Submitted answers are locked.</p></div><div class="qp-session-team">${logo(S.team, 42)}<span><small>PLAYING AS</small><strong>${esc(S.team?.name || 'Your team')}</strong></span></div></section>${locked ? `<aside class="qp-lock-banner" role="status"><span>🔒</span><div><strong>The host has paused this round</strong><p>Your answers on this screen are kept. You can continue when the host unlocks participant screens.</p></div></aside>` : ''}<section class="qp-progress card"><div><strong data-answered-count>${count} of ${questions.length} answered</strong><span>Answer at your team’s pace before the timer ends.</span></div><div class="qp-progress-track" aria-hidden="true"><i data-answer-progress style="width:${Math.round((count / questions.length) * 100)}%"></i></div></section><div class="qp-question-list">${cards}</div><section class="qp-submit card"><div><strong>Ready to submit?</strong><p>Your team can submit once. Blank answers are recorded as unanswered.</p></div><button class="btn qp-submit-button" id="submitRoundButton" type="button" onclick="submitRound()" ${locked || submitting ? 'disabled' : ''}>${submitting ? 'Submitting…' : 'Review and submit'}</button></section><p class="qp-footnote">Answers are private to your team until the round is complete.</p></main>`;
  };

  window.returnToTeamLobby = async function () {
    activeRound = null;
    activeQuestionSet = [];
    S.phase = 'waiting';
    try { await refreshTeam(); } catch {}
    render();
    startPolling();
  };

  window.enterRound = async function (round) {
    await baseEnterRound(round);
    if (S.phase !== 'play' || !activeRound) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey(activeRound.n)) || '{}');
      draftAnswers = Object.assign({}, saved, draftAnswers || {});
    } catch { draftAnswers = draftAnswers || {}; }
    render();
    if (lockedNow()) render();
  };

  function lockedNow() { return !!activeRound?.participantLocked; }

  window.submitRound = async function (automatic = false) {
    if (!automatic) {
      if (lockedNow()) return toast('The host has paused this round. Your answers are saved on this screen.');
      return window.confirmSubmitRound ? window.confirmSubmitRound() : baseSubmitRound(false);
    }
    if (submitting || !activeRound || !activeQuestionSet?.length) return;
    if (lockedNow()) return toast('The host has paused this round. Your answers are saved on this screen.');
    submitting = true;
    render();
    const roundNumber = Number(activeRound.n);
    const answers = activeQuestionSet.map((q) => ({ questionId: q.id, answer: draftAnswers[q.id] || '', elapsedMs: Math.max(0, Date.now() - roundStartedAt) }));
    try {
      await api('/api/team/submit-round', 'POST', { round: roundNumber, answers });
      sessionStorage.removeItem(draftKey(roundNumber));
      draftAnswers = {};
      activeRound = null;
      activeQuestionSet = [];
      submitting = false;
      await refreshTeam();
      render();
      toast('Answers submitted and locked.');
      startPolling();
    } catch (error) {
      submitting = false;
      const message = String(error?.message || 'Submission failed. Your answers are still on this screen.');
      if (/time has expired|round is closed|already locked/i.test(message)) {
        sessionStorage.removeItem(draftKey(roundNumber));
        activeRound = null;
        activeQuestionSet = [];
        draftAnswers = {};
        try { await refreshTeam(); } catch {}
        S.phase = 'waiting';
      } else {
        try {
          const state = await api('/api/team/state');
          S = Object.assign(S, state.state, { team: state.team, answers: state.answers, revealAnswers: state.revealAnswers, phase: 'play', role: 'participant' });
          const current = (S.rounds || []).find((item) => Number(item.n) === roundNumber);
          if (current) activeRound.participantLocked = !!current.participantLocked;
        } catch {}
        persistDraft();
      }
      render();
      toast(message);
    }
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-qm-answer="1"]');
    if (!button || lockedNow() || submitting) return;
    const id = button.dataset.questionId;
    draftAnswers[id] = button.dataset.answerValue || '';
    document.querySelectorAll(`[data-question-card="${CSS.escape(id)}"] [data-qm-answer="1"]`).forEach((option) => {
      const selected = option.dataset.answerValue === draftAnswers[id];
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
    persistDraft();
    updateAnswerProgress();
  });

  document.addEventListener('input', (event) => {
    const input = event.target.closest('[data-qm-typed="1"]');
    if (!input || lockedNow() || submitting) return;
    draftAnswers[input.dataset.questionId] = input.value;
    persistDraft();
    updateAnswerProgress();
  });

  function addStyles() {
    if (document.getElementById('qmParticipantUxStyles')) return;
    const style = document.createElement('style');
    style.id = 'qmParticipantUxStyles';
    style.textContent = `
      .qp-header{min-height:78px;padding:12px max(calc((100vw - 1060px)/2),22px);display:flex;justify-content:space-between;align-items:center;gap:16px;background:#fff;border-bottom:1px solid #e9eaf0}
      .qp-brand{display:flex;align-items:center;gap:11px;color:#20243a;text-decoration:none}.qp-brand>span:first-child{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#7565ee,#526bd5);color:#fff;font-weight:900;font-size:18px}.qp-brand>div{display:grid;gap:3px}.qp-brand b{font-size:14px}.qp-brand small{font-size:11px;color:#6d7387}.qp-header-tools{display:flex;align-items:center;gap:10px}.qp-pill{padding:8px 11px;border-radius:999px;background:#f0efff;color:#5749c4;font-size:10px;font-weight:800;letter-spacing:.06em}.qp-timer{min-width:108px;padding:9px 12px;border:1px solid #e6e8f0;border-radius:12px;background:#fff;color:#252a40;font-size:18px;font-weight:850;text-align:center;box-shadow:0 5px 16px #24294908}.qp-timer small{display:block;color:#777d90;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}
      .qp-shell{width:min(900px,100%);margin:30px auto;padding:0 20px 52px}.qp-session{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:23px 25px;border:1px solid #e7e9f1;border-radius:20px;background:linear-gradient(120deg,#f6f4ff,#f1faf8);box-shadow:0 14px 36px #2932520b}.qp-session h1{font-size:clamp(22px,3vw,30px);letter-spacing:-.04em}.qp-session p{margin:7px 0 0;color:#656c81;font-size:13px}.qp-session-team{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e6e8ef;border-radius:14px;background:#fff;white-space:nowrap}.qp-session-team>span{display:grid;gap:3px}.qp-session-team small{font-size:9px;color:#858a9a;font-weight:800;letter-spacing:.09em}.qp-session-team strong{font-size:12px;color:#30364d}
      .qp-progress{margin:16px 0;padding:15px 18px}.qp-progress>div:first-child{display:flex;justify-content:space-between;align-items:center;gap:12px}.qp-progress strong{font-size:12px;color:#343950}.qp-progress span{font-size:11px;color:#73798c}.qp-progress-track{height:6px;margin-top:11px;overflow:hidden;border-radius:99px;background:#ececf3}.qp-progress-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#7462ed,#35a99b);transition:width .2s ease}
      .qp-question-list{display:grid;gap:14px}.qp-question{padding:22px 24px;border:1px solid #e8eaf1;border-radius:18px;box-shadow:0 8px 25px #22294108}.qp-question h2{margin:10px 0 18px;font-size:clamp(18px,2.5vw,22px);line-height:1.45;color:#252a40}.qp-question-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.qp-question-number{font-size:10px;color:#6561bd;font-weight:900;letter-spacing:.12em}.qp-points{padding:6px 9px;border-radius:999px;background:#f3f2ff;color:#5c51c9;font-size:10px;font-weight:800}.qp-options{display:grid;grid-template-columns:1fr 1fr;gap:10px}.qp-option{min-height:56px;display:grid;grid-template-columns:32px 1fr 20px;align-items:center;gap:10px;padding:10px 13px;border:1px solid #e1e4ed;border-radius:13px;background:#fff;color:#383e53;text-align:left;font-size:13px;line-height:1.45;transition:border-color .15s,background .15s,transform .15s}.qp-option:hover:not(:disabled){border-color:#9b91ec;background:#faf9ff;transform:translateY(-1px)}.qp-option-key{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:#f1f2f7;color:#60667a;font-size:11px;font-weight:900}.qp-option-check{opacity:0;color:#fff}.qp-option.is-selected{border-color:#6c5ce7;background:#f5f3ff;box-shadow:0 0 0 2px #6c5ce718}.qp-option.is-selected .qp-option-key{background:#6c5ce7;color:#fff}.qp-option.is-selected .qp-option-check{opacity:1;width:19px;height:19px;display:grid;place-items:center;border-radius:50%;background:#26a17f;font-size:11px}.qp-answer-label{display:block;margin-bottom:7px;color:#6d7387;font-size:11px;font-weight:800}.qp-text-answer{width:100%;min-height:49px;padding:12px 14px;border:1px solid #dfe2eb;border-radius:12px;color:#252a40;background:#fff;font:inherit}.qp-text-answer:focus{outline:3px solid #7363ed33;border-color:#7363ed}.qp-question .question-media{max-width:100%;max-height:420px;object-fit:contain;border-radius:13px}.qp-lock-banner{display:flex;gap:12px;align-items:flex-start;margin:16px 0;padding:15px 17px;border:1px solid #f0d8ad;border-radius:15px;background:#fff8eb;color:#764b12}.qp-lock-banner>span{font-size:20px}.qp-lock-banner strong{font-size:13px}.qp-lock-banner p{margin:4px 0 0;color:#856b48;font-size:12px;line-height:1.5}.qp-question.is-locked{opacity:.82}.qp-option:disabled,.qp-text-answer:disabled{cursor:not-allowed;opacity:.62;background:#f6f6f8}
      .qp-submit{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-top:16px;padding:18px 20px}.qp-submit strong{font-size:14px}.qp-submit p{margin:5px 0 0;color:#73798c;font-size:11px}.qp-submit-button{min-width:185px}.qp-submit-button:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}.qp-footnote{text-align:center;color:#82879a;font-size:10px;margin:14px 0}.participant-status-card{display:flex;gap:11px;align-items:flex-start;margin:17px 0;padding:15px;border:1px solid #e5e7f0;border-radius:14px;background:#f8f8fc;text-align:left}.participant-status-card strong{font-size:12px;color:#363c53}.participant-status-card p{margin:5px 0 0;color:#6d7387;font-size:11px;line-height:1.55}.participant-status-icon,.qp-empty-icon{width:25px;height:25px;flex:none;display:grid;place-items:center;border-radius:50%;background:#ebe9ff;color:#5e52ca;font-weight:900}.qp-empty{max-width:600px;margin:50px auto;padding:34px;text-align:center}.qp-empty-icon{width:42px;height:42px;margin:0 auto 17px;font-size:18px}.qp-empty h1{font-size:23px}.qp-empty p{color:#6d7387;line-height:1.65;max-width:450px;margin:11px auto 20px}
      @media(max-width:620px){.qp-header{min-height:68px;padding:10px 14px}.qp-brand>span:first-child{width:36px;height:36px}.qp-brand b{font-size:12px}.qp-brand small{font-size:10px}.qp-header-tools{gap:6px}.qp-pill{display:none}.qp-timer{min-width:88px;padding:7px 9px;font-size:16px}.qp-shell{margin:16px auto;padding:0 12px 35px}.qp-session{align-items:flex-start;flex-direction:column;padding:18px}.qp-session-team{align-self:stretch}.qp-progress>div:first-child{align-items:flex-start;flex-direction:column;gap:4px}.qp-question{padding:18px 15px}.qp-options{grid-template-columns:1fr;gap:8px}.qp-option{min-height:52px}.qp-submit{align-items:stretch;flex-direction:column}.qp-submit-button{width:100%}}
      @media(prefers-reduced-motion:reduce){.qp-option,.qp-progress-track i{transition:none}}
    `;
    document.head.append(style);
  }

  document.addEventListener('DOMContentLoaded', addStyles, { once: true });
  addStyles();
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#app').forEach((root) => {
      const observer = new MutationObserver(() => {
        const locked = S.phase === 'play' && !!activeRound?.participantLocked;
        root.querySelectorAll('[data-qm-answer="1"], [data-qm-typed="1"]').forEach((control) => { control.disabled = locked || submitting; });
        const submit = root.querySelector('#submitRoundButton');
        if (submit) submit.disabled = locked || submitting;
      });
      observer.observe(root, { childList: true, subtree: true });
    });
  }, { once: true });
})();
