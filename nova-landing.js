/* ═══════════════════════════════════════════════════════════════
   NovaOps AI · CINEMATIC MOTION ENGINE v2
   Cursor · Hero canvas · Scroll reveal · Counters · Filmstrip
   Live feed · Nav · Burger · Parallax
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. MAGNETIC CURSOR ──────────────────────────────────────── */
  function initCursor() {
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring || reduced) return;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left  = mx + 'px';
      dot.style.top   = my + 'px';
    }, { passive: true });

    /* Ring lags behind with lerp */
    function animRing() {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animRing);
    }
    requestAnimationFrame(animRing);

    /* Hover states */
    document.querySelectorAll('a,button,[data-cursor-hover]').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    document.addEventListener('mouseleave', () => { mx = -200; my = -200; });
  }

  /* ── 2. HERO CANVAS — light orange aurora particles ──────────── */
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || reduced) return;
    const ctx = canvas.getContext('2d');

    let W, H;
    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* Floating orange/amber particles */
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      alpha: Math.random() * 0.35 + 0.08,
      hue: Math.random() > 0.6 ? 25 : 35, /* orange or amber */
    }));

    /* Subtle blobs */
    const blobs = [
      { x: 0.12, y: 0.18, r: 0.45, c: 'rgba(249,115,22,0.07)', dx: 0.00010, dy: 0.00007 },
      { x: 0.82, y: 0.22, r: 0.38, c: 'rgba(251,146,60,0.06)', dx:-0.00008, dy: 0.00009 },
      { x: 0.50, y: 0.75, r: 0.52, c: 'rgba(253,186,116,0.05)',dx: 0.00007, dy:-0.00008 },
    ];

    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);

      /* Blobs */
      blobs.forEach(b => {
        const bx = (b.x + Math.sin(t * b.dx * 3000 + b.r) * 0.10) * W;
        const by = (b.y + Math.cos(t * b.dy * 3000 + b.r) * 0.08) * H;
        const br = b.r * Math.min(W, H) * 0.7;
        const g  = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, b.c);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      /* Particles */
      particles.forEach(p => {
        p.x = (p.x + p.vx + 1) % 1;
        p.y = (p.y + p.vy + 1) % 1;
        const px = p.x * W, py = p.y * H;
        const g  = ctx.createRadialGradient(px, py, 0, px, py, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue},100%,55%,${p.alpha})`);
        g.addColorStop(1, 'hsla(0,0%,100%,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      t++;
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ── 3. HERO TEXT REVEAL ─────────────────────────────────────── */
  function initHeroReveal() {
    const lines = document.querySelectorAll('.hero-h1 .line-inner');
    if (!lines.length) return;
    setTimeout(() => {
      lines.forEach(l => l.classList.add('visible'));
    }, 150);
  }

  /* ── 4. NAV ──────────────────────────────────────────────────── */
  function initNav() {
    const nav = document.getElementById('nl-nav');
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 5. BURGER ───────────────────────────────────────────────── */
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
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── 6. SCROLL REVEAL (IntersectionObserver) ─────────────────── */
  function initReveal() {
    const els = document.querySelectorAll(
      '.fade-up, .fade-left, .fade-right, .scale-in'
    );
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -60px 0px' });

    els.forEach(el => io.observe(el));
  }

  /* ── 7. COUNTER ANIMATION ────────────────────────────────────── */
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
        const dec    = parseInt(el.dataset.dec) || 0;
        const dur    = 1800;
        const start  = performance.now();

        function step(now) {
          const prog  = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - prog, 4);
          el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
          if (prog < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => io.observe(el));
  }

  /* ── 8. LIVE DASHBOARD FEED ──────────────────────────────────── */
  function initDashboardFeed() {
    const feed = document.getElementById('hd-feed');
    if (!feed || reduced) return;

    const events = [
      { dot: '#10B981', text: 'Lead auto-replied — Sarah K.',   time: 'just now' },
      { dot: '#6366F1', text: 'Follow-up sent — Michael T.',    time: '2m ago'   },
      { dot: '#F97316', text: 'Client onboarded — Apex Media',  time: '5m ago'   },
      { dot: '#EC4899', text: 'CRM stage updated — 3 deals',    time: '8m ago'   },
      { dot: '#22D3EE', text: 'Weekly report delivered',        time: '12m ago'  },
      { dot: '#10B981', text: 'New lead captured — David M.',   time: 'just now' },
      { dot: '#F59E0B', text: 'Pitch generated — Orbit Corp',   time: '1m ago'   },
      { dot: '#6366F1', text: 'GTM plan created — Launchify',   time: '3m ago'   },
    ];

    let idx = 0;
    setInterval(() => {
      const ev  = events[idx % events.length];
      const row = document.createElement('div');
      row.className = 'pm-feed-row';
      row.style.cssText = 'opacity:0;transform:translateY(-10px);transition:opacity 0.45s ease,transform 0.45s ease';
      row.innerHTML = `
        <span class="pm-feed-dot" style="background:${ev.dot}"></span>
        <span class="pm-feed-txt">${ev.text}</span>
        <span class="pm-feed-time">${ev.time}</span>
      `;
      const rows = feed.querySelectorAll('.pm-feed-row');
      if (rows.length >= 4) {
        const old = rows[rows.length - 1];
        old.style.opacity   = '0';
        old.style.transform = 'translateY(10px)';
        setTimeout(() => old.remove(), 380);
      }
      feed.prepend(row);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        row.style.opacity   = '1';
        row.style.transform = 'translateY(0)';
      }));
      idx++;
    }, 2600);
  }

  /* ── 9. FILMSTRIP DRAG SCROLL ────────────────────────────────── */
  function initFilmstrip() {
    const strip = document.getElementById('filmstrip');
    if (!strip) return;

    let isDown = false, startX, scrollLeft;

    strip.addEventListener('mousedown', e => {
      isDown = true;
      strip.style.cursor = 'grabbing';
      startX = e.pageX - strip.offsetLeft;
      scrollLeft = strip.scrollLeft;
    });
    strip.addEventListener('mouseleave', () => { isDown = false; strip.style.cursor = 'grab'; });
    strip.addEventListener('mouseup',    () => { isDown = false; strip.style.cursor = 'grab'; });
    strip.addEventListener('mousemove',  e => {
      if (!isDown) return;
      e.preventDefault();
      const x    = e.pageX - strip.offsetLeft;
      const walk = (x - startX) * 1.4;
      strip.scrollLeft = scrollLeft - walk;
    });

    /* Touch support */
    let touchStart;
    strip.addEventListener('touchstart', e => { touchStart = e.touches[0].pageX; }, { passive: true });
    strip.addEventListener('touchmove',  e => {
      if (touchStart === undefined) return;
      strip.scrollLeft -= (e.touches[0].pageX - touchStart);
      touchStart = e.touches[0].pageX;
    }, { passive: true });
  }

  /* ── 10. ACTIVE NAV LINK ──────────────────────────────────────── */
  function initActiveNav() {
    const links    = document.querySelectorAll('.nav-links a[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    if (!links.length || !sections.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`));
      });
    }, { threshold: 0.35 });

    sections.forEach(s => io.observe(s));
  }

  /* ── 11. FEATURE VISUAL PARALLAX ON SCROLL ───────────────────── */
  function initFeatureParallax() {
    const visuals = document.querySelectorAll('.feat-visual');
    if (!visuals.length || reduced) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
          e.target.style.transform  = 'translateY(0) scale(1)';
        }
      });
    }, { threshold: 0.2 });

    visuals.forEach(v => {
      v.style.transform = 'translateY(32px) scale(0.98)';
      io.observe(v);
    });
  }

  /* ── 12. SMOOTH SCROLL ───────────────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ── 13. HERO VISUAL TILT (mouse follow) ─────────────────────── */
  function initHeroTilt() {
    const visual = document.querySelector('.hero-visual');
    if (!visual || reduced) return;

    window.addEventListener('mousemove', e => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      visual.style.transform = `perspective(1200px) rotateX(${6 - dy * 2}deg) rotateY(${dx * 1.5}deg)`;
    }, { passive: true });
  }

  /* ── 14. FILMSTRIP AUTO-SCROLL HINT ─────────────────────────── */
  function initFilmstripHint() {
    const strip = document.getElementById('filmstrip');
    if (!strip || reduced) return;

    /* Gently nudge 1px to hint at scrollability after 1.5s */
    setTimeout(() => {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        strip.scrollTo({ left: 1, behavior: 'smooth' });
        setTimeout(() => strip.scrollTo({ left: 0, behavior: 'smooth' }), 600);
      }, { threshold: 0.5 });
      io.observe(strip);
    }, 1500);
  }

  /* ── BOOT ───────────────────────────────────────────────────── */
  function boot() {
    initCursor();
    initHeroCanvas();
    initHeroReveal();
    initNav();
    initBurger();
    initReveal();
    initCounters();
    initDashboardFeed();
    initFilmstrip();
    initActiveNav();
    initFeatureParallax();
    initSmoothScroll();
    initHeroTilt();
    initFilmstripHint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
