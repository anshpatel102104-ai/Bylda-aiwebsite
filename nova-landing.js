/* ═══════════════════════════════════════════════════════════════
   LaunchpadNova · CINEMATIC MOTION ENGINE
   Handles: canvas aurora bg, scroll reveal, counters, nav, burger
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. AURORA CANVAS BACKGROUND ─────────────────────────────
     Soft animated gradient blobs — GPU-friendly, no Three.js needed */
  function initCanvas() {
    const canvas = document.getElementById('nl-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H;
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* Blob definitions — position (%), radius, color */
    const blobs = [
      { x:0.15, y:0.20, r:0.55, c:'rgba(249,115,22,0.16)',  dx:0.00012, dy:0.00008 },
      { x:0.80, y:0.15, r:0.45, c:'rgba(251,146,60,0.11)',  dx:-0.00009,dy:0.00011 },
      { x:0.50, y:0.70, r:0.60, c:'rgba(253,186,116,0.09)', dx:0.00008, dy:-0.00010},
      { x:0.10, y:0.80, r:0.40, c:'rgba(255,255,255,0.04)', dx:0.00010, dy:-0.00007},
      { x:0.90, y:0.65, r:0.38, c:'rgba(234,88,12,0.10)',   dx:-0.00011,dy:-0.00009},
    ];

    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);

      blobs.forEach(b => {
        /* Slow sine drift */
        const bx = (b.x + Math.sin(t * b.dx * 3000 + b.r) * 0.12) * W;
        const by = (b.y + Math.cos(t * b.dy * 3000 + b.r) * 0.10) * H;
        const br = b.r * Math.min(W, H) * 0.8;

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        grad.addColorStop(0, b.c);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      t++;
      requestAnimationFrame(draw);
    }

    if (!reduced) requestAnimationFrame(draw);
  }

  /* ── 2. NAV SCROLL BEHAVIOR ───────────────────────────────── */
  function initNav() {
    const nav = document.getElementById('nl-nav');
    if (!nav) return;

    let last = 0;
    function onScroll() {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 20);
      last = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 3. BURGER MENU ─────────────────────────────────────────── */
  function initBurger() {
    const nav    = document.getElementById('nl-nav');
    const burger = document.getElementById('nl-burger');
    const menu   = document.getElementById('nl-mobile-menu');
    if (!burger || !menu) return;

    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── 4. SCROLL REVEAL (Intersection Observer) ──────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-scale');
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    els.forEach(el => io.observe(el));
  }

  /* ── 5. COUNTER ANIMATION ────────────────────────────────────
     Animates [data-count] elements from 0 to their target value  */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el     = e.target;
        const target = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const dec    = el.dataset.dec    || 0;
        const dur    = 1600; /* ms */
        const start  = performance.now();

        function step(now) {
          const prog = Math.min((now - start) / dur, 1);
          /* Ease-out expo */
          const eased = 1 - Math.pow(1 - prog, 4);
          const val   = target * eased;
          el.textContent = prefix + val.toFixed(dec) + suffix;
          if (prog < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => io.observe(el));
  }

  /* ── 6. HERO WORD STAGGER ─────────────────────────────────── */
  function initHeroStagger() {
    const h1 = document.querySelector('.hero-h1');
    if (!h1 || reduced) return;

    /* Wrap each word in a span for stagger, preserving line breaks */
    h1.querySelectorAll('span,em,strong').forEach(inner => {
      const words = inner.textContent.trim().split(' ');
      inner.innerHTML = words.map(w =>
        `<span class="word" style="display:inline-block;overflow:hidden"><span class="word-inner" style="display:inline-block;transform:translateY(100%);opacity:0;transition:transform 0.65s cubic-bezier(0.16,1,0.3,1),opacity 0.65s cubic-bezier(0.16,1,0.3,1)">${w}</span></span> `
      ).join('');
    });

    /* Trigger after a brief delay */
    setTimeout(() => {
      h1.querySelectorAll('.word-inner').forEach((el, i) => {
        setTimeout(() => {
          el.style.transform = 'translateY(0)';
          el.style.opacity   = '1';
        }, i * 60);
      });
    }, 200);
  }

  /* ── 7. DASHBOARD LIVE FEED ANIMATION ────────────────────────
     Cycles new activity rows into the dashboard mockup           */
  function initDashboardFeed() {
    const feed = document.getElementById('hd-feed');
    if (!feed || reduced) return;

    const events = [
      { dot: '#10B981', text: 'Lead auto-replied — Sarah K.',    time: 'just now' },
      { dot: '#6366F1', text: 'Follow-up sent — Michael T.',     time: '2m ago'   },
      { dot: '#F59E0B', text: 'Client onboarded — Apex Media',   time: '5m ago'   },
      { dot: '#EC4899', text: 'CRM stage updated — 3 deals',     time: '8m ago'   },
      { dot: '#22D3EE', text: 'Weekly report delivered',         time: '12m ago'  },
      { dot: '#10B981', text: 'New lead captured — David M.',    time: 'just now' },
    ];

    let idx = 0;
    setInterval(() => {
      const ev  = events[idx % events.length];
      const row = document.createElement('div');
      row.className = 'hd-row';
      row.style.cssText = 'opacity:0;transform:translateY(-8px);transition:opacity 0.4s ease,transform 0.4s ease';
      row.innerHTML = `
        <span class="hd-row-dot" style="background:${ev.dot}"></span>
        <span class="hd-row-text">${ev.text}</span>
        <span class="hd-row-time">${ev.time}</span>
      `;

      /* Remove oldest row if more than 4 */
      const rows = feed.querySelectorAll('.hd-row');
      if (rows.length >= 4) {
        const old = rows[rows.length - 1];
        old.style.opacity = '0';
        old.style.transform = 'translateY(8px)';
        setTimeout(() => old.remove(), 350);
      }

      feed.prepend(row);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          row.style.opacity   = '1';
          row.style.transform = 'translateY(0)';
        });
      });

      idx++;
    }, 2800);
  }

  /* ── 8. SMOOTH ACTIVE NAV LINK ──────────────────────────────── */
  function initActiveNav() {
    const links    = document.querySelectorAll('.nav-links a[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    if (!links.length || !sections.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
      });
    }, { threshold: 0.4 });

    sections.forEach(s => io.observe(s));
  }

  /* ── 9. FLOATING CARD PARALLAX (subtle mouse follow) ─────────── */
  function initParallax() {
    const floats = document.querySelectorAll('.float-card');
    if (!floats.length || reduced) return;

    window.addEventListener('mousemove', (e) => {
      const mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      floats.forEach((el, i) => {
        const depth = (i + 1) * 4;
        el.style.transform = `translate(${mx * depth}px, ${my * depth}px)`;
      });
    }, { passive: true });
  }

  /* ── BOOT ───────────────────────────────────────────────────── */
  function boot() {
    initCanvas();
    initNav();
    initBurger();
    initReveal();
    initCounters();
    initHeroStagger();
    initDashboardFeed();
    initActiveNav();
    initParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
