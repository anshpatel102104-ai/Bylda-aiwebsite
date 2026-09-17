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

  /* ---------- the plotter ----------
     Glowing points are a dark-ground idiom. On paper they read as specks
     of dust, which is what the previous field looked like once the page
     went light. Paper wants ink, so this is a pen plotter: conversation
     traces written left to right in a single hairline, with a mark left
     wherever a signal is detected, then allowed to dry and fade.

     It is the product's own instrument. Bylda reads a conversation as it
     runs and marks the behaviour that mattered; that is exactly what the
     background now draws.

     The waveform is layered sines at unrelated frequencies rather than
     random noise — noise jitters frame to frame and reads as static,
     where a sum of sines reads as something measured. */
  if (!reduced) (() => {
    const cv = $("#plotter");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, running = true, raf = 0, live = false;

    const cs = getComputedStyle(document.body);
    const chan = (n, f) => (cs.getPropertyValue(n).trim() || f);
    const INK = chan("--particle-ink", "96 104 124");
    const ACCENT = chan("--particle-blue", "61 85 216");

    /* Fewer, longer traces. The cost of this field is stroking long
       hairlines across the canvas, not computing them — baking the
       polylines changed nothing measurable, so the lever is trace count,
       and a quieter field suits a light ground anyway. */
    const LANES = () => clamp(Math.round(H / 200), 3, 5);
    let traces = [];

    /* One trace: a baseline, a shape, a set of moments worth marking, and
       its own clock. Every value is fixed at birth so the line is stable
       while it is being drawn — a trace that rewrites itself as the pen
       moves is not a recording of anything. */
    function make(lane, lanes) {
      const band = 1 / lanes;
      const harmonics = [];
      for (let i = 0; i < 3; i++) {
        harmonics.push({
          k: 1.4 + Math.random() * 5.5,
          a: 0.16 + Math.random() * 0.5,
          p: Math.random() * Math.PI * 2,
        });
      }
      // Two to four detected signals, never at the very ends of the run.
      const marks = [];
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) marks.push(0.12 + Math.random() * 0.76);
      marks.sort((a, b) => a - b);
      return {
        y: band * (lane + 0.5) + (Math.random() - 0.5) * band * 0.34,
        amp: 0.018 + Math.random() * 0.03,
        harmonics,
        marks,
        draw: 7 + Math.random() * 7,     // seconds to write the line
        hold: 2.4 + Math.random() * 2.6, // seconds before it fades
        fade: 3.4 + Math.random() * 2,
        offset: Math.random() * 14,
      };
    }
    function stock() {
      const n = LANES();
      traces = [];
      for (let i = 0; i < n; i++) traces.push(make(i, n));
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

    const shape = (tr, f) => {
      let v = 0;
      for (const h of tr.harmonics) v += Math.sin(f * Math.PI * 2 * h.k + h.p) * h.a;
      // A slow envelope so the line is quiet at the edges and busiest in
      // the middle, the way a conversation is.
      return v * Math.sin(Math.min(1, Math.max(0, f)) * Math.PI);
    };

    /* A trace never changes shape once it is born, so its polyline is baked
       to pixels once instead of re-running three sines per sample on every
       frame. That was the whole cost of this field: 7 traces x 190 samples
       x 3 sines, 60 times a second, to redraw a line that had not moved. */
    const SAMPLES = 150;
    function bake(tr) {
      const pts = new Float32Array((SAMPLES + 1) * 2);
      const baseY = tr.y * H;
      const amp = tr.amp * H;
      for (let i = 0; i <= SAMPLES; i++) {
        const f = i / SAMPLES;
        pts[i * 2] = f * W;
        pts[i * 2 + 1] = baseY + shape(tr, f) * amp;
      }
      tr.pts = pts;
      tr.markPts = tr.marks.map((m) => [m * W, baseY + shape(tr, m) * amp]);
    }

    function drawTrace(tr, age) {
      const total = tr.draw + tr.hold + tr.fade;
      if (age > total) return;
      const p = clamp(age / tr.draw, 0, 1);
      const alpha = age < tr.draw + tr.hold
        ? 1
        : clamp(1 - (age - tr.draw - tr.hold) / tr.fade, 0, 1);
      if (alpha <= 0.01) return;

      if (!tr.pts) bake(tr);
      const pts = tr.pts;
      const upto = Math.max(1, Math.round(SAMPLES * p));

      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 1; i <= upto; i++) ctx.lineTo(pts[i * 2], pts[i * 2 + 1]);
      ctx.strokeStyle = `rgb(${INK} / ${0.3 * alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Signals, marked as the pen passes them.
      for (let mi = 0; mi < tr.marks.length; mi++) {
        const m = tr.marks[mi];
        if (m > p) break;
        const since = clamp((p - m) * tr.draw / 0.55, 0, 1);
        const x = tr.markPts[mi][0], y = tr.markPts[mi][1];
        ctx.beginPath();
        ctx.moveTo(x, y - 7 * since);
        ctx.lineTo(x, y + 7 * since);
        ctx.strokeStyle = `rgb(${ACCENT} / ${0.34 * since * alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 1.9 * since, 0, 7);
        ctx.fillStyle = `rgb(${ACCENT} / ${0.6 * since * alpha})`;
        ctx.fill();
      }

      // The pen itself, while it is still writing.
      if (p < 1) {
        const x = pts[upto * 2], y = pts[upto * 2 + 1];
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, 7);
        ctx.fillStyle = `rgb(${ACCENT} / ${0.75 * alpha})`;
        ctx.fill();
      }
    }

    function draw(now) {
      raf = 0;
      if (!running) return;
      if (!W || !H) { if (!size()) { schedule(); return; } }
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < traces.length; i++) {
        const tr = traces[i];
        const total = tr.draw + tr.hold + tr.fade;
        const age = (t + tr.offset) % total;
        // Re-roll a lane the moment it wraps, so the field never repeats.
        if (age < tr.lastAge) {
          const fresh = make(i, traces.length);
          fresh.offset = tr.offset;
          traces[i] = fresh;
          fresh.lastAge = age;
          drawTrace(fresh, age);
          continue;
        }
        tr.lastAge = age;
        drawTrace(tr, age);
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
