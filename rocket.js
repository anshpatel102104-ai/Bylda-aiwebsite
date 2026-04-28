/* ──────────────────────────────────────────────────────────────
   NovaOps · ROCKET MOTION LAYER  v1.0
   Vanilla JS, zero deps. Boots after DOMContentLoaded.
   ────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  /* ── ROCKET SVG (reusable) ───────────────────────────────── */
  const ROCKET_SVG = `
<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="rkBody" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EAF1FF"/>
      <stop offset="55%" stop-color="#B7CCFF"/>
      <stop offset="100%" stop-color="#7BA0FF"/>
    </linearGradient>
    <linearGradient id="rkFin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#4B8BF4"/>
    </linearGradient>
    <radialGradient id="rkWindow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#67E8F9"/>
      <stop offset="60%" stop-color="#4B8BF4"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
    <linearGradient id="rkFlame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#FFD166"/>
      <stop offset="55%" stop-color="#FF8A3D"/>
      <stop offset="100%" stop-color="#FF3D7F" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rkFlame2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#FFD166"/>
      <stop offset="100%" stop-color="#FF8A3D" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- smoke puffs -->
  <g class="smoke">
    <circle cx="100" cy="200" r="14" fill="#8B5CF6" opacity=".25"/>
    <circle cx="80"  cy="208" r="10" fill="#4B8BF4" opacity=".22"/>
    <circle cx="120" cy="208" r="11" fill="#8B5CF6" opacity=".22"/>
  </g>

  <!-- flame -->
  <g class="flame" transform="translate(100 175)">
    <path d="M0 0 C -22 30 -14 70 0 88 C 14 70 22 30 0 0 Z" fill="url(#rkFlame)"/>
    <path d="M0 6 C -10 24 -6 54 0 68 C 6 54 10 24 0 6 Z" fill="url(#rkFlame2)"/>
  </g>

  <!-- fins -->
  <path d="M58 150 L40 178 L70 168 Z" fill="url(#rkFin)"/>
  <path d="M142 150 L160 178 L130 168 Z" fill="url(#rkFin)"/>

  <!-- body -->
  <path d="M70 60 Q70 20 100 8 Q130 20 130 60 L130 160 Q130 172 118 174 L82 174 Q70 172 70 160 Z"
        fill="url(#rkBody)" stroke="#1e293b" stroke-width="2"/>

  <!-- panel line -->
  <line x1="100" y1="60" x2="100" y2="160" stroke="rgba(30,41,59,.25)" stroke-width="1"/>

  <!-- window -->
  <circle cx="100" cy="78" r="18" fill="url(#rkWindow)" stroke="#1e293b" stroke-width="2"/>
  <circle cx="94"  cy="72" r="5" fill="rgba(255,255,255,.7)"/>

  <!-- body band -->
  <rect x="70" y="118" width="60" height="6" fill="#8B5CF6"/>
  <rect x="70" y="128" width="60" height="2" fill="#4B8BF4" opacity=".7"/>

  <!-- nose tip glow -->
  <ellipse cx="100" cy="14" rx="4" ry="6" fill="#FFD166" opacity=".9"/>
</svg>`;

  /* ── MOUNT COSMOS LAYER ──────────────────────────────────── */
  function mountCosmos() {
    if (document.getElementById('rk-cosmos')) return;

    const cosmos = document.createElement('div');
    cosmos.id = 'rk-cosmos';
    cosmos.className = 'rk-cosmos';
    cosmos.innerHTML = `
      <div class="rk-nebula a"></div>
      <div class="rk-nebula b"></div>
      <div class="rk-nebula c"></div>
      <canvas id="rk-stars"></canvas>
    `;
    document.body.prepend(cosmos);

    // Grain overlay
    const grain = document.createElement('div');
    grain.className = 'rk-grain';
    document.body.prepend(grain);

    if (!reduced) startStarfield();
  }

  /* ── STARFIELD CANVAS ────────────────────────────────────── */
  function startStarfield() {
    const canvas = document.getElementById('rk-stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, stars = [], shooting = [];
    const count = isMobile ? 80 : 180;

    function resize() {
      w = canvas.width  = window.innerWidth  * window.devicePixelRatio;
      h = canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width  = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    function seed() {
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 1.6 + .2,         // depth
          r: Math.random() * 1.4 + .3,
          tw: Math.random() * Math.PI * 2,     // twinkle phase
          c: Math.random() < .15 ? '#67E8F9' : Math.random() < .35 ? '#8B5CF6' : '#ffffff'
        });
      }
    }
    function spawnShooter() {
      if (shooting.length > 1) return;
      shooting.push({
        x: Math.random() * w * .4,
        y: Math.random() * h * .35,
        vx: 8 + Math.random() * 6,
        vy: 2 + Math.random() * 3,
        life: 0,
        max: 50 + Math.random() * 25
      });
    }
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(50, now - last); last = now;
      ctx.clearRect(0, 0, w, h);

      // Twinkling stars w/ slow parallax drift
      for (const s of stars) {
        s.tw += dt * .003 * s.z;
        const a = .35 + Math.abs(Math.sin(s.tw)) * .65;
        ctx.beginPath();
        ctx.fillStyle = s.c;
        ctx.globalAlpha = a;
        ctx.arc(s.x, s.y, s.r * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
        // very slow drift
        s.x -= dt * .005 * s.z;
        if (s.x < -2) s.x = w + 2;
      }
      ctx.globalAlpha = 1;

      // Shooting stars
      for (let i = shooting.length - 1; i >= 0; i--) {
        const sh = shooting[i];
        sh.life += dt * .06;
        sh.x += sh.vx * 1.4;
        sh.y += sh.vy * 1.4;
        const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 18, sh.y - sh.vy * 18);
        grad.addColorStop(0, 'rgba(255,255,255,.9)');
        grad.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * 18, sh.y - sh.vy * 18);
        ctx.stroke();
        if (sh.life > sh.max || sh.x > w || sh.y > h) shooting.splice(i, 1);
      }

      requestAnimationFrame(tick);
    }
    resize(); seed();
    window.addEventListener('resize', () => { resize(); seed(); });
    requestAnimationFrame(tick);
    setInterval(spawnShooter, 4200);
  }

  /* ── HERO ROCKET INJECTION ───────────────────────────────── */
  function mountHeroRockets() {
    const hero = document.querySelector('.home-hero, .page-hero, .tool-header, .hero, header.hero');
    if (!hero) return;
    if (hero.querySelector('.rk-rocket-stage')) return;

    const stage = document.createElement('div');
    stage.className = 'rk-rocket-stage';
    stage.innerHTML = `
      <div class="rk-orbit" aria-hidden="true"><span class="satellite"></span></div>
      <div class="rk-rocket left" aria-hidden="true">${ROCKET_SVG}</div>
      <div class="rk-rocket right" aria-hidden="true">${ROCKET_SVG}</div>
    `;
    // place at hero start so it doesn't push content
    hero.style.position = hero.style.position || 'relative';
    hero.appendChild(stage);
  }

  /* ── SCROLL PROGRESS BAR ─────────────────────────────────── */
  function mountScrollProgress() {
    if (document.querySelector('.rk-scroll-progress')) return;
    const bar = document.createElement('div');
    bar.className = 'rk-scroll-progress';
    document.body.appendChild(bar);
    let ticking = false;
    function update() {
      const sc = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (sc / max) * 100 : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ── CURSOR GLOW ─────────────────────────────────────────── */
  function mountCursor() {
    if (isMobile || reduced) return;
    if (document.querySelector('.rk-cursor')) return;
    const c = document.createElement('div');
    c.className = 'rk-cursor';
    document.body.appendChild(c);
    let tx = 0, ty = 0, x = 0, y = 0;
    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    function loop() {
      x += (tx - x) * .12;
      y += (ty - y) * .12;
      c.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ── REVEAL OBSERVER (auto-tag common elements) ──────────── */
  function mountReveals() {
    if (reduced) return;
    const SELECTORS = [
      'section h1', 'section h2', 'section h3',
      'section .lead', 'section p.lead',
      '.hero-eyebrow', '.eyebrow',
      '.hero-ctas', '.cta-row',
      '.tool-card', '.feature-card', '.pricing-card', '.product-card',
      '.industry-card', '.step', '.journey-step',
      '.testimonial-card', '.stat-card', '.out-card',
      '.hero-stats', '.pricing-strip',
      '.section-head', '.section-title'
    ];
    const seen = new WeakSet();
    document.querySelectorAll(SELECTORS.join(',')).forEach((el, i) => {
      if (seen.has(el)) return;
      seen.add(el);
      // Pick variant
      const variant = el.matches('.tool-card,.feature-card,.pricing-card,.product-card,.industry-card,.step,.journey-step,.testimonial-card,.stat-card')
        ? 'rk-reveal-scale'
        : 'rk-reveal';
      el.classList.add(variant);
    });

    // Auto-stagger grids
    document.querySelectorAll('.tool-grid, .feature-grid, .pricing-grid, .product-grid, .industry-grid, .stats-grid, .journey-track')
      .forEach(g => g.setAttribute('data-rk-stagger', ''));

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });

    document.querySelectorAll('.rk-reveal, .rk-reveal-fade, .rk-reveal-scale, .rk-reveal-left, .rk-reveal-right')
      .forEach(el => io.observe(el));
  }

  /* ── PARALLAX (data-rk-parallax="0.2") ───────────────────── */
  function mountParallax() {
    if (reduced || isMobile) return;
    const items = document.querySelectorAll('[data-rk-parallax]');
    if (!items.length) return;
    let ticking = false;
    function update() {
      const sc = window.scrollY;
      items.forEach(el => {
        const speed = parseFloat(el.dataset.rkParallax) || .15;
        el.style.transform = (el.dataset.rkBaseTransform || '') + ` translate3d(0, ${sc * speed * -1}px, 0)`;
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  }

  /* ── MAGNETIC BUTTONS ────────────────────────────────────── */
  function mountMagnetic() {
    if (reduced || isMobile) return;
    document.querySelectorAll('.btn-primary, .btn-lg, .btn-xl, .btn-outline').forEach(btn => {
      let raf;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          btn.style.transform = `translate(${x * .18}px, ${y * .25}px)`;
        });
      });
      btn.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        btn.style.transform = '';
      });
    });
  }

  /* ── 3D CARD TILT ────────────────────────────────────────── */
  function mountTilt() {
    if (reduced || isMobile) return;
    const cards = document.querySelectorAll('.tool-card, .feature-card, .product-card, .pricing-card, .industry-card');
    cards.forEach(card => {
      let raf;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateX(${y * -6}deg) rotateY(${x * 8}deg) translateY(-6px)`;
        });
      });
      card.addEventListener('mouseleave', () => { cancelAnimationFrame(raf); card.style.transform = ''; });
    });
  }

  /* ── CTA SECTION LAUNCH (rocket flies up on scroll) ─────── */
  function mountLaunchCTA() {
    // Skip hero + first content section, only target dedicated CTA blocks near page end
    const all = Array.from(document.querySelectorAll('section'));
    if (all.length < 3) return;
    const candidates = all.slice(-3); // last 3 sections only
    let target = null;
    candidates.forEach(s => {
      if (target) return;
      const cls = (s.className || '').toLowerCase();
      const t = (s.textContent || '').toLowerCase();
      const hasBigCta = !!s.querySelector('.btn-xl, .btn-lg.btn-primary');
      const isCtaBlock = cls.includes('cta') || cls.includes('final') || t.includes('claim your free account') || t.includes('ready to launch');
      if (hasBigCta && isCtaBlock) target = s;
    });
    if (!target) return;
    target.classList.add('rk-launch-cta');
    const r = document.createElement('div');
    r.className = 'rk-launch-rocket';
    r.innerHTML = ROCKET_SVG;
    target.appendChild(r);
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { target.classList.add('in'); io.disconnect(); } });
    }, { threshold: .35 });
    io.observe(target);
  }

  /* ── BOOT ────────────────────────────────────────────────── */
  function boot() {
    mountCosmos();
    mountScrollProgress();
    mountCursor();
    mountHeroRockets();
    mountReveals();
    mountParallax();
    mountMagnetic();
    mountTilt();
    mountLaunchCTA();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
