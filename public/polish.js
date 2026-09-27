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
      @media(prefers-reduced-motion:reduce){
        .enhance-overlay,.enhance-modal{transition:none!important}
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
})();
