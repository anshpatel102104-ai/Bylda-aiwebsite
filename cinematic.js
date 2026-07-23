/* ============================================================
   cinematic.js — Bylda Cinematic Interactivity Layer
   ============================================================ */
(function () {
  'use strict';

  if (window.__byldaCinematicLoaded) return;
  window.__byldaCinematicLoaded = true;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile       = window.matchMedia('(max-width: 768px)').matches;
  const supportsHover  = window.matchMedia('(hover: hover)').matches;

  /* ---------- helpers ---------- */
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  /* ============================================================
     1. STARFIELD CANVAS
     ============================================================ */
  function initStars() {
    if (prefersReduced) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'cin-stars';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let stars = [], shooting = [], W, H, dpr = Math.min(devicePixelRatio || 1, 2);

    function resize() {
      W = canvas.width  = innerWidth  * dpr;
      H = canvas.height = innerHeight * dpr;
      canvas.style.width  = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';

      const count = isMobile ? 90 : 220;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 1.6 + 0.2,        // depth → size + speed
        tw: Math.random() * Math.PI * 2,       // twinkle phase
        s: Math.random() * 0.5 + 0.2,          // twinkle speed
        c: Math.random() < 0.7
            ? '255,255,255'
            : (Math.random() < 0.5 ? '156,194,255' : '200,170,255')
      }));
    }
    resize();
    addEventListener('resize', resize, { passive: true });

    function spawnShooting() {
      if (shooting.length > 2) return;
      shooting.push({
        x: Math.random() * W * 0.6,
        y: Math.random() * H * 0.4,
        vx: (3 + Math.random() * 4) * dpr,
        vy: (1.5 + Math.random() * 2) * dpr,
        life: 1
      });
    }
    let shootTimer = setInterval(spawnShooting, 4500);

    let mx = W / 2, my = H / 2;
    addEventListener('mousemove', e => {
      mx = e.clientX * dpr; my = e.clientY * dpr;
    }, { passive: true });

    function loop(t) {
      ctx.clearRect(0, 0, W, H);
      // parallax offset based on mouse
      const ox = (mx - W / 2) * 0.01;
      const oy = (my - H / 2) * 0.01;

      for (const s of stars) {
        s.tw += s.s * 0.04;
        const a = 0.4 + Math.sin(s.tw) * 0.4;
        const r = s.z * 1.4 * dpr;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.c},${a})`;
        ctx.arc(s.x - ox * s.z, s.y - oy * s.z, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // shooting stars
      for (let i = shooting.length - 1; i >= 0; i--) {
        const sh = shooting[i];
        sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.012;
        if (sh.life <= 0 || sh.x > W || sh.y > H) { shooting.splice(i, 1); continue; }
        const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 12, sh.y - sh.vy * 12);
        grad.addColorStop(0, `rgba(255,255,255,${sh.life})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * 12, sh.y - sh.vy * 12);
        ctx.stroke();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ============================================================
     2. MOUSE SPOTLIGHT + CUSTOM CURSOR
     ============================================================ */
  function initPointerFX() {
    if (prefersReduced || !supportsHover || isMobile) return;

    const spot = document.createElement('div');
    spot.id = 'cin-spotlight';
    document.body.appendChild(spot);

    const cursor = document.createElement('div');
    cursor.id = 'cin-cursor';
    document.body.appendChild(cursor);

    let tx = innerWidth / 2, ty = innerHeight / 2;
    let cx = tx, cy = ty;
    let sx = tx, sy = ty;

    addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
    }, { passive: true });

    function tick() {
      cx += (tx - cx) * 0.35;
      cy += (ty - cy) * 0.35;
      sx += (tx - sx) * 0.10;
      sy += (ty - sy) * 0.10;
      cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      spot.style.left = sx + 'px';
      spot.style.top  = sy + 'px';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // grow on interactive elements
    const interactive = 'a, button, .tool-chip, .product-orbit-card, .price-orb, .journey-orb, .testi-orb-card, input, textarea, [role="button"]';
    document.addEventListener('mouseover', e => {
      if (e.target.closest && e.target.closest(interactive)) cursor.classList.add('cin-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest && e.target.closest(interactive)) cursor.classList.remove('cin-hover');
    });
  }

  /* ============================================================
     3. SCROLL PROGRESS BAR
     ============================================================ */
  function initProgress() {
    const bar = document.createElement('div');
    bar.id = 'cin-progress';
    document.body.appendChild(bar);

    let raf = false;
    function update() {
      raf = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const pct = max > 0 ? (scrollY / max) * 100 : 0;
      bar.style.width = pct + '%';
    }
    addEventListener('scroll', () => {
      if (!raf) { raf = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ============================================================
     4. NAV SCROLL STATE
     ============================================================ */
  function initNavScroll() {
    let nav;
    function bind() {
      nav = document.getElementById('siteNav');
      if (!nav) return false;
      const onScroll = () => nav.classList.toggle('cin-scrolled', scrollY > 24);
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return true;
    }
    if (!bind()) {
      // site.js injects nav async — retry
      const tries = setInterval(() => { if (bind()) clearInterval(tries); }, 80);
      setTimeout(() => clearInterval(tries), 4000);
    }
  }

  /* ============================================================
     5. SCROLL-REVEAL — auto-tag sections + observe
     ============================================================ */
  function initReveal() {
    if (prefersReduced) return;

    // Auto-mark common content blocks
    const autoSel = [
      '.stage-header',
      '.product-orbit-card',
      '.connect-orb-card',
      '.testi-orb-card',
      '.price-orb',
      '.stat-chip',
      '.result-chip',
      '.journey-orb',
      '.hero-eyebrow-v2',
      '.cta-cluster',
      '.scroll-hint',
      '.stage-label'
    ];
    $$(autoSel.join(',')).forEach(el => {
      if (!el.hasAttribute('data-cin-reveal')) el.setAttribute('data-cin-reveal', '');
    });

    // Auto-stagger known group containers
    [
      '.tool-chips',
      '.stat-rail',
      '.results-rail',
      '.pricing-orbit',
      '.journey-orbit',
      '.testi-orbit',
      '.product-split-v2',
      '.connect-orbit'
    ].forEach(sel => {
      $$(sel).forEach(el => el.setAttribute('data-cin-stagger', ''));
    });

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('cin-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    $$('[data-cin-reveal], [data-cin-stagger]').forEach(el => io.observe(el));
  }

  /* ============================================================
     6. 3D TILT CARDS
     ============================================================ */
  function initTilt() {
    if (prefersReduced || !supportsHover || isMobile) return;

    const sel = '.product-orbit-card, .connect-orb-card, .testi-orb-card, .price-orb, .journey-orb, .stat-chip, .result-chip';
    $$(sel).forEach(card => {
      card.classList.add('cin-tilt');
      const max = 6; // degrees

      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top)  / r.height;
        const ry = (px - 0.5) *  max * 2;
        const rx = (py - 0.5) * -max * 2;
        card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ============================================================
     7. MAGNETIC CTAs
     ============================================================ */
  function initMagnetic() {
    if (prefersReduced || !supportsHover || isMobile) return;

    $$('.cta-primary-v2, .btn-primary, .cta-secondary-v2').forEach(btn => {
      const strength = btn.classList.contains('cta-secondary-v2') ? 8 : 14;

      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.transform = `translate(${dx * strength}px, ${dy * strength}px) translateY(-3px) scale(1.02)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ============================================================
     8. ANIMATED COUNTERS — for stat numbers
     ============================================================ */
  function initCounters() {
    if (prefersReduced) return;

    const targets = $$('.stat-chip .num, .result-chip .num');
    if (!targets.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
        const raw = el.textContent.trim();
        // parse "$14k+" / "10" / "<90s" / "14d" / "3 Days"
        const m = raw.match(/(\d+(?:\.\d+)?)/);
        if (!m) return;
        const final = parseFloat(m[1]);
        if (final < 2) return; // skip tiny numbers
        const suffix = raw.slice(raw.indexOf(m[1]) + m[1].length);
        const prefix = raw.slice(0, raw.indexOf(m[1]));
        const dur = 1400;
        const start = performance.now();
        function step(now) {
          const t = clamp((now - start) / dur, 0, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const cur = (final * eased);
          const display = final >= 10 ? Math.round(cur) : cur.toFixed(1).replace(/\.0$/, '');
          el.textContent = prefix + display + suffix;
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = raw;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    targets.forEach(t => io.observe(t));
  }

  /* ============================================================
     9. PARALLAX PLANETS (on scroll + mouse)
     ============================================================ */
  function initPlanetParallax() {
    if (prefersReduced || isMobile) return;
    const planets = $$('.planet, .planet-sun, .planet-mercury, .planet-venus, .planet-earth, .planet-mars');
    if (!planets.length) return;

    let mx = 0, my = 0;
    addEventListener('mousemove', e => {
      mx = (e.clientX / innerWidth - 0.5);
      my = (e.clientY / innerHeight - 0.5);
    }, { passive: true });

    function tick() {
      planets.forEach((p, i) => {
        const depth = (i % 3 + 1) * 8;
        p.style.setProperty('--tx', `${mx * depth}px`);
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ============================================================
     10. CTA RIPPLE on click
     ============================================================ */
  function initRipple() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.cta-primary-v2, .btn-primary, .cta-secondary-v2, .product-card-cta');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(r.width, r.height);
      ripple.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
        width:${size}px;height:${size}px;
        left:${e.clientX - r.left - size / 2}px;
        top:${e.clientY - r.top - size / 2}px;
        background:radial-gradient(circle,rgba(255,255,255,.55),transparent 60%);
        transform:scale(0);opacity:1;
        animation:cin-ripple .65s ease-out forwards;
        z-index:0;`;
      const cs = getComputedStyle(btn);
      if (cs.position === 'static') btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });

    // inject keyframes once
    if (!document.getElementById('cin-ripple-kf')) {
      const s = document.createElement('style');
      s.id = 'cin-ripple-kf';
      s.textContent = '@keyframes cin-ripple{to{transform:scale(2.4);opacity:0}}';
      document.head.appendChild(s);
    }
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    initProgress();
    initStars();
    initPointerFX();
    initNavScroll();
    initReveal();
    initTilt();
    initMagnetic();
    initCounters();
    initPlanetParallax();
    initRipple();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
