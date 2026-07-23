/* bylda-promo.js — Waitlist promo popups (welcome + exit intent) */
(function () {
  'use strict';

  if (window.__byldaPromoLoaded) return;
  window.__byldaPromoLoaded = true;

  const KEY_WELCOME = 'bylda_promo_welcome';
  const KEY_EXIT = 'bylda_promo_exit';
  const WAITLIST_URL = '/waitlist';

  const CSS = `
.np-backdrop{position:fixed;inset:0;background:rgba(5,3,18,.72);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .25s ease}
.np-backdrop.np-visible{opacity:1}
.np-box{background:#0c0820;border:1px solid rgba(168,85,247,.38);border-radius:22px;max-width:430px;width:100%;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.8),0 0 0 1px rgba(168,85,247,.12),inset 0 1px 0 rgba(255,255,255,.04);transform:scale(.88) translateY(24px);transition:transform .35s cubic-bezier(.34,1.56,.64,1);position:relative}
.np-backdrop.np-visible .np-box{transform:scale(1) translateY(0)}

.np-hero{padding:30px 26px 22px;background:linear-gradient(160deg,#130a2e 0%,#1e0848 55%,#2d0a5e 100%);text-align:center;position:relative;overflow:hidden}
.np-hero::before{content:'';position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:300px;height:180px;background:radial-gradient(ellipse,rgba(168,85,247,.22) 0%,transparent 70%);pointer-events:none}
.np-close{position:absolute;top:12px;right:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5);width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.78rem;transition:all .15s;z-index:1;line-height:1}
.np-close:hover{background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.2)}

.np-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(250,204,21,.12);border:1px solid rgba(250,204,21,.3);color:#fbbf24;font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:14px}
.np-badge::before{content:'⚡';font-size:.65rem}
.np-hero h2{font-size:1.6rem;font-weight:800;color:#fff;line-height:1.18;margin:0 0 10px;letter-spacing:-.025em;font-family:'Space Grotesk','Inter',system-ui,sans-serif}
.np-hero h2 em{font-style:normal;background:linear-gradient(135deg,#c084fc,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.np-hero p{font-size:.85rem;color:rgba(255,255,255,.65);line-height:1.55;margin:0}

.np-deal{background:rgba(168,85,247,.1);border:1px dashed rgba(168,85,247,.35);border-radius:12px;margin:16px 22px 0;padding:11px 15px;display:flex;align-items:flex-start;gap:11px}
.np-deal-icon{font-size:1.4rem;line-height:1;flex-shrink:0;margin-top:1px}
.np-deal-text{font-size:.8rem;color:rgba(255,255,255,.75);line-height:1.5}
.np-deal-text strong{color:#d8b4fe;display:block;font-size:.88rem;font-weight:700;margin-bottom:2px;letter-spacing:-.01em}

.np-body{padding:20px 22px 22px}
.np-form{display:flex;flex-direction:column;gap:9px}
.np-label{font-size:.72rem;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.04em;text-transform:uppercase;margin-bottom:1px}
.np-email{width:100%;padding:12px 15px;background:rgba(255,255,255,.06);border:1px solid rgba(168,85,247,.22);border-radius:11px;color:#fff;font-size:.875rem;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}
.np-email::placeholder{color:rgba(255,255,255,.28)}
.np-email:focus{border-color:rgba(168,85,247,.55);box-shadow:0 0 0 3px rgba(168,85,247,.1)}
.np-email.np-error{border-color:#f87171;box-shadow:0 0 0 3px rgba(248,113,113,.1)}

.np-cta{width:100%;padding:14px;background:linear-gradient(135deg,#7e22ce,#9333ea,#a855f7);border:none;border-radius:11px;color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;transition:opacity .15s,transform .15s;font-family:inherit;letter-spacing:-.01em;box-shadow:0 4px 20px rgba(168,85,247,.4)}
.np-cta:hover{opacity:.92;transform:translateY(-1px);box-shadow:0 6px 28px rgba(168,85,247,.5)}
.np-cta:active{transform:translateY(0)}

.np-social{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:4px;font-size:.72rem;color:rgba(255,255,255,.3)}
.np-social::before,.np-social::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07)}
.np-skip{text-align:center;margin-top:10px}
.np-skip button{background:none;border:none;font-size:.73rem;color:rgba(255,255,255,.3);cursor:pointer;transition:color .15s;font-family:inherit;padding:2px}
.np-skip button:hover{color:rgba(255,255,255,.6)}

.np-success{text-align:center;padding:12px 0 4px}
.np-success-icon{font-size:2.2rem;margin-bottom:10px}
.np-success p{color:rgba(255,255,255,.85);font-size:.875rem;line-height:1.6}
.np-success strong{color:#86efac}

.np-timer{font-size:.7rem;color:rgba(250,204,21,.65);text-align:center;margin-top:6px}
.np-timer strong{color:#fbbf24}

@media(max-width:480px){.np-hero h2{font-size:1.35rem}.np-body{padding:16px}.np-hero{padding:24px 18px 18px}.np-deal{margin:12px 18px 0}}
`;

  function injectStyles() {
    if (document.getElementById('bylda-promo-css')) return;
    const s = document.createElement('style');
    s.id = 'bylda-promo-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function buildPromo(cfg) {
    const backdrop = document.createElement('div');
    backdrop.className = 'np-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', cfg.ariaLabel);
    backdrop.innerHTML = `
<div class="np-box">
  <div class="np-hero">
    <button class="np-close" aria-label="Close offer">✕</button>
    <div class="np-badge">${cfg.badge}</div>
    <h2>${cfg.headline}</h2>
    <p>${cfg.sub}</p>
  </div>
  <div class="np-deal">
    <div class="np-deal-icon">${cfg.dealIcon}</div>
    <div class="np-deal-text"><strong>${cfg.dealTitle}</strong>${cfg.dealBody}</div>
  </div>
  <div class="np-body">
    <div class="np-form" id="np-form-${cfg.id}">
      <label class="np-label" for="np-email-${cfg.id}">Your email</label>
      <input type="email" class="np-email" id="np-email-${cfg.id}" placeholder="you@yourcompany.com" autocomplete="email">
      <button class="np-cta" id="np-cta-${cfg.id}">${cfg.ctaLabel}</button>
      <div class="np-social">No credit card · Cancel anytime · Free forever</div>
      <div class="np-skip"><button type="button">No thanks, I'll pass on this deal</button></div>
    </div>
    <div class="np-success" id="np-success-${cfg.id}" style="display:none">
      <div class="np-success-icon">🎉</div>
      <p>You're in! Redirecting you to your <strong>free account</strong>…</p>
    </div>
  </div>
</div>`;

    document.body.appendChild(backdrop);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => backdrop.classList.add('np-visible'));
    });

    function dismiss() {
      backdrop.classList.remove('np-visible');
      setTimeout(() => backdrop.remove(), 280);
    }

    backdrop.querySelector('.np-close').addEventListener('click', dismiss);
    backdrop.querySelector('.np-skip button').addEventListener('click', dismiss);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) dismiss(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', esc); }
    }, { once: true });

    const emailEl = backdrop.querySelector(`#np-email-${cfg.id}`);
    const ctaEl = backdrop.querySelector(`#np-cta-${cfg.id}`);
    const formEl = backdrop.querySelector(`#np-form-${cfg.id}`);
    const successEl = backdrop.querySelector(`#np-success-${cfg.id}`);

    function submit() {
      const email = (emailEl?.value || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEl?.classList.add('np-error');
        emailEl?.focus();
        setTimeout(() => emailEl?.classList.remove('np-error'), 1400);
        return;
      }
      ctaEl.disabled = true;
      ctaEl.textContent = 'Securing your spot…';
      formEl.style.display = 'none';
      successEl.style.display = 'block';
      const dest = WAITLIST_URL + '?ref=promo-' + cfg.id + '&email=' + encodeURIComponent(email);
      setTimeout(() => { window.location.href = dest; }, 1800);
    }

    ctaEl?.addEventListener('click', submit);
    emailEl?.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

    setTimeout(() => emailEl?.focus(), 350);
  }

  function showWelcomePromo() {
    if (sessionStorage.getItem(KEY_WELCOME)) return;
    sessionStorage.setItem(KEY_WELCOME, '1');

    buildPromo({
      id: 'welcome',
      ariaLabel: 'Welcome offer — get free AI tools',
      badge: 'Limited Time Offer',
      headline: 'Get 20 AI Tools <em>Free</em>',
      sub: 'Join 500+ founders on the waitlist for the AI Operating System that runs your business.',
      dealIcon: '🚀',
      dealTitle: 'Founding-member pricing + priority access',
      dealBody: ' — locked in for everyone who joins the waitlist.',
      ctaLabel: 'Join the Waitlist →',
    });
  }

  function showExitPromo() {
    if (sessionStorage.getItem(KEY_EXIT) || sessionStorage.getItem(KEY_WELCOME)) return;
    sessionStorage.setItem(KEY_EXIT, '1');

    buildPromo({
      id: 'exit',
      ariaLabel: 'Exit offer — don\'t leave empty-handed',
      badge: 'Wait — Before You Go',
      headline: "Don't Lose Your <em>Spot</em> in Line",
      sub: 'Access opens in waves — waitlist members get first invites to all 20 AI tools and automation systems.',
      dealIcon: '🎁',
      dealTitle: 'Priority access + bonus automation templates',
      dealBody: ' — no credit card required, ever.',
      ctaLabel: 'Save My Spot →',
    });
  }

  function init() {
    injectStyles();

    // Welcome popup after 12 seconds
    const welcomeTimer = setTimeout(showWelcomePromo, 12000);

    // Exit-intent: mouse leaves viewport from the top
    let exitArmed = false;
    function onMouseLeave(e) {
      if (exitArmed || e.clientY > 10) return;
      exitArmed = true;
      clearTimeout(welcomeTimer); // cancel welcome if exit fires first
      setTimeout(showExitPromo, 150);
      document.removeEventListener('mouseleave', onMouseLeave);
    }

    // Arm exit-intent after 3 seconds (avoid false positives on load)
    setTimeout(() => {
      document.addEventListener('mouseleave', onMouseLeave);
    }, 3000);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
