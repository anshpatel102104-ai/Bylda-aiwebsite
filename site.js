/* site.js — AI Business OS shared nav/footer + utilities */
(function () {
  'use strict';

  const ANN_BAR_HTML = `
<div class="ann-bar" id="annBar" role="banner">
  <div class="ann-bar-inner">
    <a href="https://app.launchpad.nova-ops.space/signup?plan=Starter" class="ann-bar-link" target="_blank" rel="noopener">
      🚀 Nova OPS is live — claim your free account today
    </a>
    <button class="ann-bar-close" id="annBarClose" aria-label="Dismiss announcement">✕</button>
  </div>
</div>`;

  const ANN_BAR_CSS = `
.ann-bar{position:fixed;top:0;left:0;right:0;background:#0e0a24;border-bottom:1px solid rgba(139,92,246,.28);padding:.45rem 1.75rem;z-index:1001;display:flex;align-items:center;justify-content:center}
.ann-bar-inner{display:flex;align-items:center;justify-content:center;gap:1rem;max-width:1200px;width:100%}
.ann-bar-link{color:rgba(255,255,255,.88);font-size:.78rem;font-weight:600;text-decoration:none;transition:color .15s;flex:1;text-align:center}
.ann-bar-link:hover{color:var(--teal)}
.ann-bar-close{background:none;border:none;color:rgba(255,255,255,.45);cursor:pointer;font-size:.9rem;padding:.25rem .4rem;line-height:1;flex-shrink:0;transition:color .15s}
.ann-bar-close:hover{color:rgba(255,255,255,.9)}`;

  const WAITLIST_HTML = `
<section class="waitlist-section">
  <div class="container-sm">
    <div class="waitlist-inner">
      <h3 class="waitlist-heading">Stay in the loop</h3>
      <p class="waitlist-sub">Get updates on new tools, automations, and Nova OPS news.</p>
      <form class="waitlist-form" id="waitlistForm" novalidate>
        <input type="email" id="waitlistEmail" class="waitlist-input" placeholder="you@example.com" required autocomplete="email">
        <button type="submit" class="btn btn-primary">Notify Me</button>
      </form>
      <p class="waitlist-confirm" id="waitlistConfirm">✓ You're on the list!</p>
    </div>
  </div>
</section>`;

  const WAITLIST_CSS = `
.waitlist-section{padding:4rem 1.75rem;background:var(--bg-2,#080617);border-top:1px solid var(--border)}
.waitlist-inner{text-align:center;max-width:480px;margin:0 auto}
.waitlist-heading{font-size:1.6rem;font-weight:800;color:#fff;margin-bottom:.45rem}
.waitlist-sub{color:var(--text-2);font-size:.9rem;margin-bottom:1.5rem}
.waitlist-form{display:flex;gap:.65rem;max-width:420px;margin:0 auto}
.waitlist-input{flex:1;padding:.65rem 1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);color:#fff;font-size:.875rem;font-family:inherit;outline:none;transition:border-color .15s}
.waitlist-input::placeholder{color:var(--text-3)}
.waitlist-input:focus{border-color:var(--teal)}
.waitlist-confirm{display:none;color:var(--green);font-size:.875rem;margin-top:.75rem}
@media(max-width:480px){.waitlist-form{flex-direction:column}}`;

  const NAV_HTML = `
<nav class="site-nav" id="siteNav" aria-label="Main navigation">
  <div class="nav-inner">
    <a class="nav-brand" href="/" aria-label="AI Business OS home">
      <span class="os-dot"></span>
      <span class="os-name">AI Business OS</span>
    </a>
    <div class="nav-links" role="menubar">
      <span class="nav-has-drop" role="none">
        <a href="/launchpad" role="menuitem">Launchpad</a>
        <div class="nav-drop" aria-label="Launchpad tools">
          <div class="nav-drop-section">Build</div>
          <a href="/tools/idea-validator"><span class="drop-icon">💡</span>Idea Validator</a>
          <a href="/tools/pitch-generator"><span class="drop-icon">🎤</span>Pitch Generator</a>
          <a href="/tools/gtm-strategy-builder"><span class="drop-icon">🗺️</span>GTM Strategy Builder</a>
          <a href="/tools/kill-my-idea"><span class="drop-icon">☠️</span>Kill My Idea</a>
          <a href="/tools/funding-readiness-score"><span class="drop-icon">💰</span>Funding Readiness Score</a>
          <hr>
          <a href="/launchpad" style="color:var(--teal);font-weight:600">View all 10 tools →</a>
        </div>
      </span>
      <span class="nav-has-drop" role="none">
        <a href="/nova" role="menuitem">Nova OS</a>
        <div class="nav-drop" aria-label="Nova operations">
          <div class="nav-drop-section">Operate</div>
          <a href="/operations/crm-pipeline"><span class="drop-icon">📊</span>CRM Pipeline</a>
          <a href="/operations/lead-capture"><span class="drop-icon">🧲</span>Lead Capture</a>
          <a href="/operations/automation-workflows"><span class="drop-icon">⚡</span>Automation Workflows</a>
          <a href="/operations/follow-up-booking"><span class="drop-icon">📅</span>Follow-Up &amp; Booking</a>
          <a href="/operations/client-onboarding"><span class="drop-icon">🤝</span>Client Onboarding</a>
          <hr>
          <a href="/nova" style="color:var(--blue);font-weight:600">View all systems →</a>
        </div>
      </span>
      <a href="/how-it-works" role="menuitem">How It Works</a>
      <a href="/pricing" role="menuitem">Pricing</a>
      <a href="/about" role="menuitem">About</a>
      <a href="/faq" role="menuitem">FAQ</a>
    </div>
    <div class="nav-ctas">
      <a href="https://app.launchpad.nova-ops.space/login" class="btn btn-outline btn-sm">Log In</a>
      <a href="https://app.launchpad.nova-ops.space/signup?plan=Starter" class="btn btn-primary btn-sm">Get Started</a>
    </div>
    <button class="nav-hamburger" id="navHamburger" aria-label="Toggle menu" aria-expanded="false" aria-controls="navMobile">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<div class="nav-mobile" id="navMobile" aria-hidden="true">
  <a href="/">Home</a>
  <div class="nav-mobile-section">Launchpad</div>
  <a href="/launchpad">All Launchpad Tools</a>
  <a href="/tools/idea-validator">💡 Idea Validator</a>
  <a href="/tools/pitch-generator">🎤 Pitch Generator</a>
  <a href="/tools/gtm-strategy-builder">🗺️ GTM Strategy Builder</a>
  <a href="/tools/kill-my-idea">☠️ Kill My Idea</a>
  <a href="/tools/funding-readiness-score">💰 Funding Readiness Score</a>
  <a href="/tools/first-10-customers-finder">🎯 First 10 Customers</a>
  <a href="/tools/business-plan-generator">📋 Business Plan Generator</a>
  <a href="/tools/investor-email-writer">✉️ Investor Email Writer</a>
  <a href="/tools/idea-vs-idea">⚖️ Idea vs Idea</a>
  <a href="/tools/landing-page-creator">🖥️ Landing Page Creator</a>
  <hr>
  <div class="nav-mobile-section">Nova OS</div>
  <a href="/nova">All Nova Systems</a>
  <a href="/operations/crm-pipeline">📊 CRM Pipeline</a>
  <a href="/operations/lead-capture">🧲 Lead Capture</a>
  <a href="/operations/automation-workflows">⚡ Automation Workflows</a>
  <a href="/operations/follow-up-booking">📅 Follow-Up &amp; Booking</a>
  <a href="/operations/client-onboarding">🤝 Client Onboarding</a>
  <a href="/operations/reporting-dashboard">📈 Reporting Dashboard</a>
  <hr>
  <a href="/how-it-works">How It Works</a>
  <a href="/pricing">Pricing</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
  <div style="padding:.75rem .9rem 0;display:flex;flex-direction:column;gap:.5rem">
    <a href="https://app.launchpad.nova-ops.space/login" class="btn btn-outline btn-full" style="display:flex;justify-content:center">Log In</a>
    <a href="https://app.launchpad.nova-ops.space/signup?plan=Starter" class="btn btn-primary btn-full" style="display:flex;justify-content:center">Get Started →</a>
  </div>
</div>`;

  const FOOTER_HTML = `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-logo">
        <span class="os-dot" style="width:8px;height:8px;border-radius:50%;background:var(--grad);display:inline-block"></span>
        <span class="os-name" style="background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:800;font-size:.95rem;letter-spacing:-.01em">AI Business OS</span>
      </div>
      <p>From idea to automated business — Launchpad builds it, Nova runs it.</p>
    </div>
    <div class="footer-col">
      <h5>Launchpad</h5>
      <a href="/tools/idea-validator">Idea Validator</a>
      <a href="/tools/pitch-generator">Pitch Generator</a>
      <a href="/tools/gtm-strategy-builder">GTM Strategy</a>
      <a href="/tools/kill-my-idea">Kill My Idea</a>
      <a href="/tools/funding-readiness-score">Funding Score</a>
      <a href="/launchpad" style="color:var(--teal)">All 10 tools →</a>
    </div>
    <div class="footer-col">
      <h5>Nova OS</h5>
      <a href="/operations/crm-pipeline">CRM Pipeline</a>
      <a href="/operations/lead-capture">Lead Capture</a>
      <a href="/operations/automation-workflows">Automations</a>
      <a href="/operations/follow-up-booking">Follow-Up &amp; Booking</a>
      <a href="/operations/client-onboarding">Client Onboarding</a>
      <a href="/nova" style="color:var(--blue)">All systems →</a>
    </div>
    <div class="footer-col">
      <h5>Platform</h5>
      <a href="/how-it-works">How It Works</a>
      <a href="/pricing">Pricing</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© <span id="footerYear"></span> NovaOps AI. All rights reserved.</p>
    <p>Built for founders. Powered by AI.</p>
  </div>
</footer>`;

  function inject(id, html, where) {
    const el = document.getElementById(id);
    if (el) { el.outerHTML = html; return; }
    document.body.insertAdjacentHTML(where, html);
  }

  function initNav() {
    const nav = document.getElementById('siteNav');
    if (!nav) return;
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 24), { passive: true });
    nav.classList.toggle('scrolled', window.scrollY > 24);

    const btn = document.getElementById('navHamburger');
    const menu = document.getElementById('navMobile');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-hidden', String(!open));
      });
      document.addEventListener('click', e => {
        if (!nav.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          menu.setAttribute('aria-hidden', 'true');
        }
      });
    }

    const path = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
      const href = (a.getAttribute('href') || '').replace(/\/$/, '') || '/';
      if (href && href !== '/' && path.startsWith(href)) a.classList.add('active');
      if (href === '/' && path === '/') a.classList.add('active');
    });
  }

  function initReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  }

  /* Cursor-follow glow on cards */
  function initCardGlow() {
    const cards = document.querySelectorAll('.card, .tool-card, .pc, .pricing-card, .feature-tile, .testi-card, .pain-card, .connect-side');
    if (!cards.length) return;
    cards.forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
      c.addEventListener('pointerleave', () => {
        c.style.setProperty('--mx', '50%');
        c.style.setProperty('--my', '0%');
      });
    });
  }

  /* Count-up for numeric stats when they enter view */
  function initCountUp() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const dur = 1400;
        const start = performance.now();
        const from = 0;
        function tick(now) {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          const val = from + (target - from) * eased;
          el.textContent = prefix + (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
  }

  /* Parallax orbs — gentle mouse-based movement */
  function initParallax() {
    const orbs = document.querySelectorAll('.orb, .aurora-bg::before, .parallax');
    if (!orbs.length) return;
    let rx = 0, ry = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', e => {
      rx = (e.clientX / window.innerWidth - .5) * 24;
      ry = (e.clientY / window.innerHeight - .5) * 24;
    });
    (function loop() {
      tx += (rx - tx) * .06;
      ty += (ry - ty) * .06;
      document.querySelectorAll('.orb').forEach((o, i) => {
        const depth = i % 2 === 0 ? 1 : -1;
        o.style.transform = `translate3d(${tx * depth}px, ${ty * depth}px, 0)`;
      });
      requestAnimationFrame(loop);
    })();
  }

  function initAnnBar() {
    const bar = document.getElementById('annBar');
    if (!bar) return;
    if (sessionStorage.getItem('novaops_ann_dismissed')) {
      bar.remove();
      return;
    }
    function applyOffset() {
      const h = bar.getBoundingClientRect().height;
      const nav = document.getElementById('siteNav');
      const mob = document.getElementById('navMobile');
      if (nav) nav.style.top = h + 'px';
      if (mob) mob.style.top = (h + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64)) + 'px';
      document.body.style.paddingTop = h + 'px';
    }
    applyOffset();
    window.addEventListener('resize', applyOffset, { passive: true });
    document.getElementById('annBarClose').addEventListener('click', () => {
      sessionStorage.setItem('novaops_ann_dismissed', '1');
      bar.remove();
      const nav = document.getElementById('siteNav');
      const mob = document.getElementById('navMobile');
      if (nav) nav.style.top = '';
      if (mob) mob.style.top = '';
      document.body.style.paddingTop = '';
      window.removeEventListener('resize', applyOffset);
    });
  }

  function initWaitlist() {
    const form = document.getElementById('waitlistForm');
    const confirm = document.getElementById('waitlistConfirm');
    if (!form || !confirm) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('waitlistEmail').value.trim();
      if (!email) return;
      console.log('[NovaOPS Waitlist] Email submitted:', email);
      form.style.display = 'none';
      confirm.style.display = 'block';
    });
  }

  /* FAQ toggle helper (for any page using .faq-q OR .faq-question) */
  function initFaq() {
    // Legacy .faq-q selector
    document.querySelectorAll('.faq-q').forEach(q => {
      if (q.dataset.bound) return;
      q.dataset.bound = '1';
      q.addEventListener('click', () => q.parentElement.classList.toggle('open'));
    });
    // Design-system .faq-question selector (used in faq.html, pricing.html, index.html)
    document.querySelectorAll('.faq-question').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (!item) return;
        const isOpen = item.classList.contains('open');
        // Close all siblings
        item.closest('.faq-list, section, .faq-section')
          ?.querySelectorAll('.faq-item.open')
          .forEach(el => el.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  /* Premium FAQ accordion (.faq-acc-trigger / .faq-acc-item) */
  function initFaqAcc() {
    document.querySelectorAll('.faq-acc-trigger').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-acc-item');
        const isOpen = item.classList.contains('open');
        item.closest('.faq-acc, .faq-group')
          ?.querySelectorAll('.faq-acc-item.open')
          .forEach(el => el.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  /* Custom cursor */
  function initCustomCursor() {
    const dot  = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;
    if (window.matchMedia('(hover: none)').matches) return;

    let mx = -200, my = -200, rx = -200, ry = -200;

    document.addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a, button, .btn, .card, .tool-card, .faq-acc-trigger, .feature-tile').forEach(el => {
      el.addEventListener('mouseenter', () => { dot.classList.add('hovered'); ring.classList.add('hovered'); });
      el.addEventListener('mouseleave', () => { dot.classList.remove('hovered'); ring.classList.remove('hovered'); });
    });
  }

  /* Scroll progress bar */
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    function update() {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (total > 0 ? scrolled / total * 100 : 0) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* Magnetic buttons — subtle pull toward cursor */
  function initMagneticBtns() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.btn-primary, .btn-nv, .btn-lp').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r  = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  / 2)) * 0.28;
        const dy = (e.clientY - (r.top  + r.height / 2)) * 0.28;
        btn.style.transform = `translate(${dx}px, ${dy}px) translateY(-2px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* FAQ sidebar active state on scroll */
  function initFaqSidebar() {
    const links = document.querySelectorAll('.faq-nav-link[href^="#"]');
    if (!links.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const link = document.querySelector(`.faq-nav-link[href="#${e.target.id}"]`);
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    links.forEach(l => {
      const target = document.querySelector(l.getAttribute('href'));
      if (target) io.observe(target);
    });
  }

  function setYear() {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* AI call utility */
  window.callAI = async function(system, userMsg, outputEl, renderFn) {
    const API = 'https://launchpad-api.dpatel0729.workers.dev';
    outputEl.style.display = 'block';
    outputEl.innerHTML = '<div style="display:flex;justify-content:center;padding:2.5rem"><div class="spinner"></div></div>';
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1600, system, messages: [{ role: 'user', content: userMsg }] })
      });
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      if (!text) throw new Error('empty');
      outputEl.innerHTML = renderFn ? renderFn(text) : renderSections(text, 'RESULT');
    } catch {
      outputEl.innerHTML = '<div class="out-card"><div class="alert alert-red">Something went wrong — please try again.</div></div>';
    }
  };

  window.renderSections = function(text, label, accentClass) {
    const cls = accentClass || 'eyebrow-lp';
    const sections = text.split(/\n(?=##\s)/);
    let html = `<div class="out-card"><p class="eyebrow ${cls}" style="margin-bottom:1rem">${label}</p>`;
    sections.forEach(s => {
      const lines = s.trim().split('\n');
      const heading = lines[0].replace(/^#+\s*/, '');
      const body = lines.slice(1).join('\n').trim()
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, s => `<ul>${s}</ul>`);
      if (heading || body) {
        html += `<section>${heading ? `<h4>${heading.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h4>` : ''}${body ? `<div>${body}</div>` : ''}</section>`;
      }
    });
    return html + '</div>';
  };

  function injectStyles(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* Auto-load Cinematic Layer (CSS + JS) on every page */
  function loadCinematic() {
    if (!document.querySelector('link[href="/cinematic.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/cinematic.css';
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src="/cinematic.js"]') && !window.__novaCinematicLoaded) {
      const s = document.createElement('script');
      s.src = '/cinematic.js';
      s.defer = true;
      document.head.appendChild(s);
    }
  }

  function init() {
    loadCinematic();
    injectStyles('ann-bar-css', ANN_BAR_CSS);
    injectStyles('waitlist-css', WAITLIST_CSS);

    // Only inject nav + ann-bar + footer if the page doesn't already have its own <nav>
    // Pages like pricing, launchpad, faq, contact etc. have their own nav — skip to avoid double-nav
    var pageHasOwnNav = !!document.querySelector('nav');
    if (!pageHasOwnNav) {
      document.body.insertAdjacentHTML('afterbegin', ANN_BAR_HTML);
      inject('site-nav-placeholder', NAV_HTML, 'afterbegin');
      inject('site-footer-placeholder', WAITLIST_HTML + FOOTER_HTML, 'beforeend');
      initAnnBar();
      initNav();
    }

    initReveal();
    initCardGlow();
    initCountUp();
    initParallax();
    initFaq();
    initFaqAcc();
    initFaqSidebar();
    initWaitlist();
    setYear();
    /* legacy interactivity replaced by /cinematic.js */
    /* initScrollProgress(); initCustomCursor(); initMagneticBtns(); */
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();


/* ── Nav & UI — injected by site audit ──────────────────────── */
(function() {
  /* ── Navigation scroll state ─────────────────────────────── */
    (function() {
      var nav = document.getElementById('nav');
      function onScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 20);
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    })();

    /* ── Dropdown menus ──────────────────────────────────────── */
    (function() {
      var dropdowns = document.querySelectorAll('.nav-dropdown');
      dropdowns.forEach(function(dd) {
        var trigger = dd.querySelector('.nav-dropdown-trigger');
        trigger.addEventListener('click', function(e) {
          e.stopPropagation();
          var isOpen = dd.classList.contains('open');
          dropdowns.forEach(function(d) {
            d.classList.remove('open');
            d.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
          });
          if (!isOpen) {
            dd.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
          }
        });
      });
      document.addEventListener('click', function() {
        dropdowns.forEach(function(d) {
          d.classList.remove('open');
          d.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
        });
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          dropdowns.forEach(function(d) {
            d.classList.remove('open');
            d.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
          });
        }
      });
    })();

    /* ── Mobile menu ─────────────────────────────────────────── */
    (function() {
      var toggle = document.getElementById('mobile-toggle');
      var menu   = document.getElementById('mobile-menu');
      var isOpen = false;

      function openMenu() {
        isOpen = true;
        menu.classList.add('open');
        menu.setAttribute('aria-hidden', 'false');
        toggle.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
      function closeMenu() {
        isOpen = false;
        menu.classList.remove('open');
        menu.setAttribute('aria-hidden', 'true');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }

      toggle.addEventListener('click', function() {
        isOpen ? closeMenu() : openMenu();
      });

      menu.querySelectorAll('a').forEach(function(a) {
        a.addEventListener('click', closeMenu);
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) closeMenu();
      });
    })();

    /* ── Scroll reveal ───────────────────────────────────────── */
    (function() {
      var opts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Cascade children
            entry.target.querySelectorAll('.reveal-child').forEach(function(child) {
              child.classList.add('visible');
            });
          }
        });
      }, opts);

      document.querySelectorAll('.reveal').forEach(function(el) {
        observer.observe(el);
      });
    })();
})();
