/* ============================================================
   BYLDA — signal layer (homepage)

   The trace field behind the hero, plus the two small pieces of markup
   the CSS needs and the page should not have to hard-code: the headline
   split into lines, and the outcome column classified by what it says.

   The field draws the page's own sentence — every conversation leaves a
   trace. A trace appears, travels a curved path, and resolves into an
   outcome; the path is only drawn once both ends exist, because a trace
   without an outcome is not yet evidence.

   Straight segments between hard dots were tried on an earlier build of
   this site and read as a constellation — rigid, angular, and nothing to
   do with the subject. Hence curves, a travelling head, and soft glow
   sprites rather than 1px arcs.
   ============================================================ */
(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- markup the CSS needs ---------- */

  // Split the h1 on its <br> so each line can arrive on its own beat.
  (() => {
    const h = $(".hero .display");
    if (!h || h.querySelector(".ln")) return;
    const parts = h.innerHTML.split(/<br\s*\/?>/i);
    if (parts.length < 2) return;
    h.innerHTML = parts.map((p) => `<span class="ln">${p}</span>`).join("");
  })();

  // Classify each outcome by what it actually is. Kept here rather than
  // in the HTML so that editing the copy cannot leave a stale class
  // behind saying a stalled deal was a win.
  (() => {
    const WARN = /stall|lost|slip|no decision|went dark|churn/i;
    const GOOD = /won|advanced|booked|closed|signed|renewed|expanded/i;
    $$(".graph-o").forEach((el) => {
      const t = el.textContent;
      if (WARN.test(t)) el.classList.add("graph-o--warn");
      else if (GOOD.test(t)) el.classList.add("graph-o--good");
    });
  })();

  /* ---------- the trace field ---------- */
  if (!reduced) (() => {
    const cv = $("#tracefield");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, running = true, raf = 0, live = false;

    const cs = getComputedStyle(cv.closest(".phantom") || document.body);
    const chan = (n, f) => (cs.getPropertyValue(n).trim() || f);
    const INK = chan("--particle-ink", "96 104 124");
    const BLUE = chan("--particle-blue", "61 85 216");

    /* A glow is a sprite built once, not a radial gradient rebuilt every
       frame. The soft falloff is the whole point of it, and paying for
       that per particle per frame would cost far more than it is worth. */
    function sprite(rgb) {
      const c = document.createElement("canvas");
      const R = 32;
      c.width = c.height = R * 2;
      const g = c.getContext("2d");
      const grad = g.createRadialGradient(R, R, 0, R, R, R);
      grad.addColorStop(0, `rgb(${rgb} / 0.95)`);
      grad.addColorStop(0.25, `rgb(${rgb} / 0.45)`);
      grad.addColorStop(0.6, `rgb(${rgb} / 0.1)`);
      grad.addColorStop(1, `rgb(${rgb} / 0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, R * 2, R * 2);
      return c;
    }
    const inkGlow = sprite(INK);
    const blueGlow = sprite(BLUE);
    function glow(img, x, y, r, a) {
      if (a <= 0.004) return;
      ctx.globalAlpha = a;
      ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }

    const COUNT = () => clamp(Math.round(W / 62), 9, 24);
    let items = [];

    function make() {
      const x = 0.05 + Math.random() * 0.9;
      const y = 0.08 + Math.random() * 0.84;
      const ang = Math.random() * Math.PI * 2;
      const len = 0.055 + Math.random() * 0.085;
      // The control point is pushed off the chord's normal, sign varying,
      // so every path bows and no two bow the same way.
      const bow = (0.22 + Math.random() * 0.3) * (Math.random() < 0.5 ? -1 : 1);
      return {
        x, y,
        cx: clamp(x + Math.cos(ang) * len, 0.03, 0.97),
        cy: clamp(y + Math.sin(ang) * len * 0.72, 0.04, 0.96),
        bow,
        period: 11 + Math.random() * 8,
        offset: Math.random() * 20,
        r: 1.4 + Math.random() * 1.1,
      };
    }
    function stock() {
      const n = COUNT();
      while (items.length < n) items.push(make());
      if (items.length > n) items.length = n;
    }
    function size() {
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return false;
      const d = Math.min(devicePixelRatio || 1, 2);
      if (w === W && h === H && d === dpr) return true;
      W = w; H = h; dpr = d;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stock();
      return true;
    }

    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const qb = (a, b, c, t) => { const u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; };

    function draw(now) {
      raf = 0;
      if (!running) return;
      if (!W || !H) { if (!size()) { schedule(); return; } }
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const it of items) {
        const age = (it.offset + t) % it.period;
        const env = Math.min(clamp(age / 1.6, 0, 1), clamp((it.period - age) / 2.6, 0, 1));
        if (env <= 0.004) continue;

        const ex = it.x * W, ey = it.y * H;
        const gx = it.cx * W, gy = it.cy * H;
        const dx = gx - ex, dy = gy - ey;
        const mx = (ex + gx) / 2 - dy * it.bow;
        const my = (ey + gy) / 2 + dx * it.bow;

        glow(inkGlow, ex, ey, it.r * 5.5, 0.42 * env);

        const p = easeInOut(clamp((age - 1.7) / 2.6, 0, 1));
        if (p > 0) {
          const hx = qb(ex, mx, gx, p), hy = qb(ey, my, gy, p);
          ctx.beginPath();
          const STEPS = 18;
          for (let i = 0; i <= STEPS; i++) {
            const s = (i / STEPS) * p;
            const px = qb(ex, mx, gx, s), py = qb(ey, my, gy, s);
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          // Transparent at the trace, solid at the head: it reads as
          // something moving, not as a drawn edge.
          const grad = ctx.createLinearGradient(ex, ey, hx, hy);
          grad.addColorStop(0, `rgb(${BLUE} / 0)`);
          grad.addColorStop(0.55, `rgb(${BLUE} / ${0.09 * env})`);
          grad.addColorStop(1, `rgb(${BLUE} / ${0.32 * env})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          glow(blueGlow, hx, hy, it.r * 4.2, 0.42 * env * (p < 1 ? 1 : 0));
        }

        if (p >= 1) {
          const since = age - 4.3;
          const bloom = clamp(since / 0.9, 0, 1);
          const ring = Math.sin(clamp(since / 1.4, 0, 1) * Math.PI);
          glow(blueGlow, gx, gy, it.r * (6 + ring * 7), (0.14 + 0.46 * bloom) * env);
        }
      }

      if (!live) { live = true; cv.classList.add("is-live"); }
      schedule();
    }
    function schedule() { if (running && !raf) raf = requestAnimationFrame(draw); }

    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(cv);
    else addEventListener("resize", size, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size).catch(() => {});
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) schedule();
    }).observe(cv);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) schedule(); });
    schedule();
  })();
})();

/* ============================================================
   Scrollspy for the one-page nav.

   The top bar addresses sections of this page rather than other pages,
   so it should say where you are. Without that, an in-page nav is worse
   than a site nav: you click, the page moves, and nothing confirms it.
   ============================================================ */
(() => {
  "use strict";
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!links.length) return;

  const targets = links
    .map((a) => {
      const el = document.querySelector(a.getAttribute("href"));
      return el ? { a, el } : null;
    })
    .filter(Boolean);
  if (!targets.length) return;

  /* The nav is ordered for the argument, not for the scroll: Phantom Audit
     and Behavior Graph are listed before For Managers but appear after it
     in the document. Walking the links in nav order therefore marked the
     wrong section, so the spy sorts by document position first. */
  targets.sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  let current = null;
  const set = (a) => {
    if (a === current) return;
    if (current) current.removeAttribute("aria-current");
    if (a) a.setAttribute("aria-current", "true");
    current = a;
  };

  /* The section whose top has most recently passed under the nav is the
     one being read — steadier than intersection ratios, which flicker
     between two tall neighbours. */
  const NAV = 88;
  const pick = () => {
    let best = null;
    for (const t of targets) {
      if (t.el.getBoundingClientRect().top - NAV <= 0) best = t;
    }
    // Past the final section — the CTA and footer — nothing is current.
    const tail = targets[targets.length - 1].el.getBoundingClientRect();
    set(tail.bottom < 0 ? null : best ? best.a : null);
  };

  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; pick(); });
  }, { passive: true });
  pick();
})();
