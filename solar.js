/* ══════════════════════════════════════════════════════════════
   Bylda · SOLAR SYSTEM v2.0
   - Nav orbital rocket (rides hover, fires on click)
   - Warp page transitions (hyperspace tunnel)
   - Scroll-driven solar journey (rocket flies between planets)
   - Magnetic everything, reduced-motion safe
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  /* ── ROCKET SVG ──────────────────────────────────────────── */
  const ROCKET_SVG = `
<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="solarBody" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F0F6FF"/>
      <stop offset="55%" stop-color="#B7CCFF"/>
      <stop offset="100%" stop-color="#7BA0FF"/>
    </linearGradient>
    <linearGradient id="solarFin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7DD3FC"/>
      <stop offset="100%" stop-color="#4B8BF4"/>
    </linearGradient>
    <radialGradient id="solarWindow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#67E8F9"/>
      <stop offset="60%" stop-color="#4B8BF4"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
    <linearGradient id="solarFlame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD166"/>
      <stop offset="55%" stop-color="#FF8A3D"/>
      <stop offset="100%" stop-color="#7DD3FC" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g class="rocket-flame" transform="translate(100 175)">
    <path d="M0 0 C -22 30 -14 70 0 88 C 14 70 22 30 0 0 Z" fill="url(#solarFlame)"/>
    <path d="M0 6 C -10 24 -6 54 0 68 C 6 54 10 24 0 6 Z" fill="#FFD166"/>
  </g>
  <path d="M58 150 L40 178 L70 168 Z" fill="url(#solarFin)"/>
  <path d="M142 150 L160 178 L130 168 Z" fill="url(#solarFin)"/>
  <path d="M70 60 Q70 20 100 8 Q130 20 130 60 L130 160 Q130 172 118 174 L82 174 Q70 172 70 160 Z"
        fill="url(#solarBody)" stroke="#1e293b" stroke-width="2"/>
  <line x1="100" y1="60" x2="100" y2="160" stroke="rgba(30,41,59,.25)" stroke-width="1"/>
  <circle cx="100" cy="78" r="18" fill="url(#solarWindow)" stroke="#1e293b" stroke-width="2"/>
  <circle cx="94" cy="72" r="5" fill="rgba(255,255,255,.7)"/>
  <rect x="70" y="118" width="60" height="6" fill="#7DD3FC"/>
  <rect x="70" y="128" width="60" height="2" fill="#67E8F9" opacity=".7"/>
  <ellipse cx="100" cy="14" rx="4" ry="6" fill="#FFD166"/>
</svg>`;

  /* ══════════════════════════════════════════════════════════
     1. ORBITAL NAV ROCKET — rides hover targets
     ══════════════════════════════════════════════════════════ */
  function mountNavRocket() {
    if (reduced || isMobile) return;
    const nav = document.querySelector('.site-nav');
    if (!nav) { setTimeout(mountNavRocket, 200); return; }
    if (nav.querySelector('.nav-orbital')) return;

    const orbital = document.createElement('div');
    orbital.className = 'nav-orbital';
    orbital.innerHTML = ROCKET_SVG;
    nav.style.position = 'relative';
    nav.appendChild(orbital);

    const links = nav.querySelectorAll('.nav-links a, .nav-brand');
    let activeTimer;

    function moveTo(el) {
      const navRect = nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const x = elRect.left - navRect.left + elRect.width / 2 - 18;
      const y = elRect.top - navRect.top - 30;
      orbital.style.left = x + 'px';
      orbital.style.top  = y + 'px';
      orbital.classList.add('show');
    }

    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        clearTimeout(activeTimer);
        moveTo(link);
      });
    });

    nav.addEventListener('mouseleave', () => {
      activeTimer = setTimeout(() => orbital.classList.remove('show'), 300);
    });

    // On load, park rocket on the active nav link (matches current pathname)
    const current = location.pathname.replace(/\/$/, '') || '/';
    let activeLink = null;
    links.forEach(a => {
      if (a.tagName !== 'A') return;
      const href = (a.getAttribute('href') || '').replace(/\/$/, '');
      if (!activeLink && href && (href === current || (current === '/' && href === '/'))) {
        activeLink = a;
        a.classList.add('active');
      }
    });
    if (activeLink) {
      setTimeout(() => moveTo(activeLink), 600);
    }
  }

  /* ══════════════════════════════════════════════════════════
     2. WARP PAGE TRANSITIONS — click any internal nav link
     ══════════════════════════════════════════════════════════ */
  function mountWarpTransitions() {
    if (reduced) return;
    if (document.getElementById('warp-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'warp-overlay';
    overlay.className = 'warp-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="warp-flash"></div>
      <canvas id="warp-canvas"></canvas>
      <div class="warp-rocket">${ROCKET_SVG}</div>
    `;
    document.body.appendChild(overlay);

    const canvas = overlay.querySelector('#warp-canvas');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let warpAnimId;

    function setupCanvas() {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      stars = [];
      for (let i = 0; i < 220; i++) {
        stars.push({
          x: (Math.random() - 0.5) * canvas.width,
          y: (Math.random() - 0.5) * canvas.height,
          z: Math.random() * canvas.width,
          pz: 0
        });
      }
    }
    function drawWarp() {
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      const speed = 28;
      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z < 1) {
          s.x = (Math.random() - 0.5) * canvas.width;
          s.y = (Math.random() - 0.5) * canvas.height;
          s.z = canvas.width;
          s.pz = s.z;
        }
        const sx = (s.x / s.z) * canvas.width;
        const sy = (s.y / s.z) * canvas.width;
        const px = (s.x / s.pz) * canvas.width;
        const py = (s.y / s.pz) * canvas.width;
        const r = (1 - s.z / canvas.width) * 3 * window.devicePixelRatio;

        const grad = ctx.createLinearGradient(px, py, sx, sy);
        grad.addColorStop(0, 'rgba(125,211,252,0)');
        grad.addColorStop(.5, 'rgba(103,232,249,.7)');
        grad.addColorStop(1, '#fff');
        ctx.strokeStyle = grad;
        ctx.lineWidth = r;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      warpAnimId = requestAnimationFrame(drawWarp);
    }

    function activate(href) {
      setupCanvas();
      overlay.classList.add('active');
      drawWarp();
      // Navigate after warp peak
      setTimeout(() => {
        cancelAnimationFrame(warpAnimId);
        window.location.href = href;
      }, 850);
    }

    // Intercept all internal nav clicks
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (a.target === '_blank') return;
      // Only same-origin internal links
      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.hash) return;
      } catch (_) { return; }
      // Skip if user holds modifier
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      // Fire click rocket from button location
      fireClickRocket(e.clientX, e.clientY);
      setTimeout(() => activate(href), 200);
    }, true);

    window.addEventListener('resize', () => {
      if (overlay.classList.contains('active')) setupCanvas();
    });
  }

  /* Fire a small rocket from the click point */
  function fireClickRocket(x, y) {
    const r = document.createElement('div');
    r.className = 'click-rocket';
    r.innerHTML = ROCKET_SVG;
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    document.body.appendChild(r);
    requestAnimationFrame(() => r.classList.add('fly'));
    setTimeout(() => r.remove(), 1100);
  }

  /* ══════════════════════════════════════════════════════════
     3. SCROLL ROCKET — flies the homepage solar journey
     ══════════════════════════════════════════════════════════ */
  function mountScrollRocket() {
    if (reduced || isMobile) return;
    const stages = document.querySelectorAll('.planet-stage');
    if (stages.length < 2) return;

    const rocket = document.createElement('div');
    rocket.className = 'scroll-rocket';
    rocket.innerHTML = ROCKET_SVG;
    document.body.appendChild(rocket);

    // Path: rocket moves along a winding path through the page
    // We compute waypoints from each stage center
    function getWaypoints() {
      const wps = [];
      stages.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const left = i % 2 === 0
          ? window.innerWidth * 0.78  // right side on even stages
          : window.innerWidth * 0.18; // left side on odd
        wps.push({ y: top + r.height * 0.5, x: left });
      });
      return wps;
    }

    let wps = getWaypoints();
    let lastY = 0;

    function update() {
      const sc = window.scrollY + window.innerHeight * 0.5;
      // Find segment
      let segI = 0;
      for (let i = 0; i < wps.length - 1; i++) {
        if (sc >= wps[i].y && sc <= wps[i + 1].y) { segI = i; break; }
        if (sc > wps[wps.length - 1].y) segI = wps.length - 2;
      }
      const a = wps[segI], b = wps[segI + 1] || wps[segI];
      const t = Math.max(0, Math.min(1, (sc - a.y) / Math.max(1, (b.y - a.y))));
      // Curved path with sin
      const easeT = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = a.x + (b.x - a.x) * easeT;
      const y = a.y + (b.y - a.y) * easeT;

      // Rocket angle based on direction of travel
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI - 90;

      // Convert page-y to viewport-y
      const vy = y - window.scrollY;
      // Hide rocket when off-screen
      const visible = vy > -80 && vy < window.innerHeight + 80;
      rocket.style.opacity = visible ? '1' : '0';
      rocket.style.transform = `translate(${x - 40}px, ${vy - 40}px) rotate(${angle}deg)`;

      // Trail particles when moving fast
      const speed = Math.abs(window.scrollY - lastY);
      if (speed > 8 && Math.random() < .35) spawnTrail(x, vy);
      lastY = window.scrollY;
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { wps = getWaypoints(); update(); });
    setTimeout(() => { wps = getWaypoints(); update(); }, 500);
  }

  function spawnTrail(x, y) {
    const t = document.createElement('div');
    t.className = 'rocket-trail';
    t.style.left = (x - 4) + 'px';
    t.style.top = (y + 30) + 'px';
    document.body.appendChild(t);
    let scale = 1, opacity = .9;
    const start = performance.now();
    function tick(now) {
      const dt = now - start;
      scale = 1 + dt / 400;
      opacity = .9 - dt / 700;
      if (opacity < 0) { t.remove(); return; }
      t.style.transform = `scale(${scale})`;
      t.style.opacity = opacity;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════════════════════════
     4. NAV SCROLLED STATE
     ══════════════════════════════════════════════════════════ */
  function mountNavScroll() {
    const nav = document.querySelector('.site-nav');
    if (!nav) { setTimeout(mountNavScroll, 200); return; }
    function onScroll() {
      if (window.scrollY > 30) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ══════════════════════════════════════════════════════════
     5. PAGE ARRIVAL ANIMATION
     ══════════════════════════════════════════════════════════ */
  function mountPageArrival() {
    if (reduced) return;
    const main = document.querySelector('main, .container, body > section:first-of-type');
    // We use a body-level class instead so it works everywhere
    document.body.classList.add('page-arriving');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('arrived');
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════════════════════ */
  function boot() {
    mountNavRocket();
    mountWarpTransitions();
    mountScrollRocket();
    mountNavScroll();
    mountPageArrival();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
