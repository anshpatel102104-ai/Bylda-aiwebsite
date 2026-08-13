/* ============================================================
   BYLDA OS — motion engine
   Vanilla, dependency-free. Every module mounts only if its
   DOM is present, and stands down for reduced motion.
   ============================================================ */
(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* central rAF loop for scroll-driven scenes */
  const scenes = [];
  let ticking = false;
  function frame() {
    ticking = false;
    for (const fn of scenes) fn();
  }
  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  addEventListener("scroll", requestFrame, { passive: true });
  addEventListener("resize", requestFrame, { passive: true });

  /* ---------- nav ---------- */
  (() => {
    const nav = $(".nav");
    if (!nav) return;
    let lastY = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      nav.classList.toggle("is-scrolled", y > 24);
      if (Math.abs(y - lastY) > 6) {
        nav.classList.toggle("is-hidden", y > lastY && y > 320 && !document.body.classList.contains("menu-open"));
        lastY = y;
      }
    }, { passive: true });

    const burger = $(".nav-burger");
    if (burger) burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open);
    });
    $$(".menu a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  })();

  /* ---------- reveal on scroll ---------- */
  (() => {
    // stagger: parents distribute delays to children
    $$("[data-stagger]").forEach(parent => {
      const step = parseFloat(parent.dataset.stagger) || 0.08;
      [...parent.children].forEach((el, i) => el.style.setProperty("--d", `${(i * step).toFixed(2)}s`));
    });
    const targets = $$("[data-reveal], [data-mask], .window, .meter");
    if (!targets.length) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("is-inview"); io.unobserve(e.target); }
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(t => io.observe(t));
  })();

  /* ---------- parallax [data-plx] ---------- */
  if (!reduced) (() => {
    const els = $$("[data-plx]");
    if (!els.length) return;
    const items = els.map(el => ({ el, f: parseFloat(el.dataset.plx) || 0.15 }));
    scenes.push(() => {
      const vh = innerHeight;
      for (const { el, f } of items) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0, ${(-c * f * 100).toFixed(2)}px, 0)`;
      }
    });
    requestFrame();
  })();

  /* ---------- tilt + specular pointer light ---------- */
  if (!reduced && matchMedia("(pointer: fine)").matches) (() => {
    $$("[data-tilt]").forEach(el => {
      let raf = null;
      el.addEventListener("pointermove", e => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-2px)`;
        });
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    // pointer light on glass + windows
    document.addEventListener("pointermove", e => {
      const el = e.target.closest(".glass, .window");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--gx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    }, { passive: true });
  })();

  /* ---------- counters [data-count] ---------- */
  (() => {
    const els = $$("[data-count]");
    if (!els.length) return;
    const fmt = (n, dec) => n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const dec = (el.dataset.count.split(".")[1] || "").length;
        if (reduced) { el.textContent = fmt(target, dec); continue; }
        const t0 = performance.now(), dur = 1700;
        const tick = now => {
          const p = clamp((now - t0) / dur, 0, 1);
          el.textContent = fmt(target * (1 - Math.pow(1 - p, 4)), dec);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.6 });
    els.forEach(el => io.observe(el));
  })();

  /* ---------- ghost particles (hero canvas) ---------- */
  const heroState = { dissolve: 0 };
  if (!reduced) (() => {
    const cv = $("#particles");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let W, H, dpr, parts = [], running = true;

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(n) {
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.5,
        s: 0.08 + Math.random() * 0.35,          // base upward drift
        w: Math.random() * Math.PI * 2,           // wander phase
        a: 0.12 + Math.random() * 0.4,
        blue: Math.random() < 0.28,
      }));
    }
    function draw(now) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      const boost = 1 + heroState.dissolve * 7;
      for (const p of parts) {
        p.y -= p.s * boost;
        p.x += Math.sin(now / 2400 + p.w) * 0.16;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        const alpha = p.a * (1 - heroState.dissolve * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = p.blue
          ? `rgba(67,88,216,${alpha * 0.7})`
          : `rgba(90,96,112,${alpha * 0.45})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    size(); spawn(Math.min(110, Math.round(W / 14)));
    addEventListener("resize", () => { size(); spawn(Math.min(110, Math.round(W / 14))); }, { passive: true });
    new IntersectionObserver(([e]) => {
      const was = running;
      running = e.isIntersecting;
      if (running && !was) requestAnimationFrame(draw);
    }).observe(cv);
    requestAnimationFrame(draw);
  })();

  /* ---------- hero dissolve on scroll ---------- */
  if (!reduced) (() => {
    const hero = $("#hero");
    if (!hero) return;
    const inner = $(".hero-inner", hero);
    const cue = $(".scroll-cue", hero);
    scenes.push(() => {
      const p = clamp(scrollY / (innerHeight * 0.85), 0, 1);
      heroState.dissolve = p;
      if (inner) {
        inner.style.opacity = String(clamp(1 - p * 1.25, 0, 1));
        inner.style.transform = `translateY(${(-p * 70).toFixed(1)}px)`;
        inner.style.filter = p > 0.02 ? `blur(${(p * 7).toFixed(1)}px)` : "";
      }
      if (cue) cue.style.opacity = String(clamp(1 - p * 3, 0, 1));
    });
    requestFrame();
  })();

  /* ---------- task storm (the problem) ---------- */
  (() => {
    const storm = $("#storm");
    if (!storm) return;
    const layer = $(".storm-chips", storm);
    const ghost = $(".storm-ghost", storm);
    const head = $(".storm-head", storm);
    const intro = $(".storm-intro", storm);
    const LABELS = [
      "Update deal", "Write notes", "Create follow-up", "Change stage",
      "Email prospect", "Log call", "Schedule meeting", "Set reminder",
      "Update forecast", "Add contact", "Sync calendar", "Tag account",
      "Draft recap", "Update amount", "Move to Q3", "Assign task",
      "Log activity", "Enter MEDDIC", "Update close date", "Add next step",
    ];
    const N = 46;
    const chips = [];
    for (let i = 0; i < N; i++) {
      const el = document.createElement("span");
      el.className = "storm-chip";
      el.textContent = LABELS[i % LABELS.length];
      layer.appendChild(el);
      chips.push({
        el,
        // resting position, % of viewport
        x: 6 + Math.random() * 88,
        y: 12 + Math.random() * 74,
        rot: (Math.random() - 0.5) * 26,
        t: (i / N) * 0.5,                       // arrival threshold
        drift: Math.random() * Math.PI * 2,
        scale: 0.85 + Math.random() * 0.45,
      });
    }
    if (reduced) {
      // static composition: a modest pile + resolved headline
      chips.forEach((c, i) => {
        if (i > 14) { c.el.style.display = "none"; return; }
        c.el.style.cssText = `left:${c.x}%;top:${c.y}%;opacity:.35;transform:rotate(${c.rot}deg)`;
      });
      if (ghost) ghost.style.opacity = "1";
      if (head) head.style.opacity = "1";
      return;
    }
    scenes.push(() => {
      const r = storm.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = clamp(-r.top / total, 0, 1);
      if (r.bottom < 0 || r.top > innerHeight) return;
      const now = performance.now();
      if (intro) intro.style.opacity = String(clamp(1 - p * 6, 0, 1));

      for (const c of chips) {
        // arrival: fly in from above; absorption: converge to center
        const arrive = clamp((p - c.t) / 0.1, 0, 1);
        const absorb = clamp((p - 0.62) / 0.24, 0, 1);
        if (arrive <= 0) { c.el.style.opacity = "0"; continue; }
        const ax = c.x, ay = lerp(c.y - 60, c.y, 1 - Math.pow(1 - arrive, 3));
        const jx = Math.sin(now / 1900 + c.drift) * 0.6;
        const jy = Math.cos(now / 2300 + c.drift) * 0.8;
        const x = lerp(ax + jx, 50, Math.pow(absorb, 1.4));
        const y = lerp(ay + jy, 52, Math.pow(absorb, 1.4));
        const s = c.scale * (1 - absorb * 0.92);
        const o = arrive * (1 - Math.pow(absorb, 2.2)) * 0.95;
        c.el.style.opacity = o.toFixed(2);
        c.el.style.transform =
          `translate(-50%,-50%) rotate(${(c.rot * (1 - absorb)).toFixed(1)}deg) scale(${s.toFixed(3)})`;
        c.el.style.left = x.toFixed(2) + "%";
        c.el.style.top = y.toFixed(2) + "%";
      }
      if (ghost) {
        const g = clamp((p - 0.55) / 0.2, 0, 1);
        const swallow = 1 + Math.sin(clamp((p - 0.62) / 0.24, 0, 1) * Math.PI) * 0.06;
        ghost.style.opacity = g.toFixed(2);
        ghost.style.transform =
          `translate(-50%,-50%) scale(${(lerp(0.55, 1, 1 - Math.pow(1 - g, 3)) * swallow).toFixed(3)})`;
      }
      if (head) {
        const h = clamp((p - 0.84) / 0.13, 0, 1);
        head.style.opacity = h.toFixed(2);
        head.style.transform = `translateY(${((1 - h) * 44).toFixed(1)}px)`;
      }
      requestFrame(); // keep jitter alive while pinned
    });
    requestFrame();
  })();

  /* ---------- horizontal storytelling ---------- */
  (() => {
    const wrap = $("#hscroll");
    if (!wrap) return;
    const track = $(".hs-track", wrap);
    const scenesEls = $$(".hs-scene", wrap);
    const dots = $$(".hs-progress i", wrap);
    if (reduced) { scenesEls.forEach(s => s.classList.add("is-on")); return; }
    scenes.push(() => {
      const r = wrap.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = clamp(-r.top / total, 0, 1);
      if (r.bottom < 0 || r.top > innerHeight) return;
      const shift = p * (track.scrollWidth - wrap.clientWidth);
      track.style.transform = `translate3d(${(-shift).toFixed(1)}px,0,0)`;
      const idx = Math.min(scenesEls.length - 1, Math.floor(p * scenesEls.length + 0.12));
      scenesEls.forEach((s, i) => s.classList.toggle("is-on", i <= idx));
      dots.forEach((d, i) => d.classList.toggle("on", i === idx));
    });
    requestFrame();
  })();

  /* ---------- typewriter [data-type="a | b | c"] ---------- */
  if (!reduced) (() => {
    $$("[data-type]").forEach(el => {
      const phrases = el.dataset.type.split("|").map(s => s.trim()).filter(Boolean);
      if (!phrases.length) return;
      let pi = 0, ci = 0, del = false;
      el.textContent = "";
      (function tick() {
        const cur = phrases[pi];
        ci += del ? -1 : 1;
        el.textContent = cur.slice(0, ci);
        let wait = del ? 26 : 46 + Math.random() * 40;
        if (!del && ci === cur.length) { wait = 2100; del = phrases.length > 1; }
        else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 350; }
        setTimeout(tick, wait);
      })();
    });
  })();

  /* ---------- replay (product live demo) ---------- */
  (() => {
    const rp = $("#replay");
    if (!rp) return;
    const steps = $$("[data-rp]", rp).sort((a, b) => (+a.dataset.rp) - (+b.dataset.rp));
    if (!steps.length) return;
    if (reduced) { steps.forEach(s => s.classList.add("rp-on")); return; }
    const typeInto = el => {
      const txt = el.dataset.text || "";
      el.textContent = "";
      let i = 0;
      (function t() {
        if (!el.closest(".rp-on")) return;      // reset happened
        el.textContent = txt.slice(0, ++i);
        if (i < txt.length) setTimeout(t, 22 + Math.random() * 26);
      })();
    };
    let started = false;
    function run() {
      steps.forEach(s => s.classList.remove("rp-on"));
      let acc = 600;
      steps.forEach(s => {
        acc += +(s.dataset.rpDelay || 900);
        setTimeout(() => {
          s.classList.add("rp-on");
          $$(".rp-type", s).forEach(typeInto);
        }, acc);
      });
      setTimeout(run, acc + 5200);
    }
    new IntersectionObserver(([e], io) => {
      if (e.isIntersecting && !started) { started = true; run(); io.disconnect(); }
    }, { threshold: 0.3 }).observe(rp);
  })();

  /* ---------- ROI calculator ---------- */
  (() => {
    const roi = $("#roi");
    if (!roi) return;
    const inp = {
      reps: $("#roi-reps"), hours: $("#roi-hours"),
      deal: $("#roi-deal"), deals: $("#roi-deals"),
    };
    const out = {
      reps: $("#roi-reps-v"), hours: $("#roi-hours-v"),
      deal: $("#roi-deal-v"), deals: $("#roi-deals-v"),
      saved: $("#roi-saved"), value: $("#roi-value"), pipe: $("#roi-pipe"),
    };
    if (!inp.reps) return;
    const money = n => "$" + Math.round(n).toLocaleString("en-US");
    function calc() {
      const reps = +inp.reps.value, hours = +inp.hours.value;
      const deal = +inp.deal.value, deals = +inp.deals.value;
      if (out.reps) out.reps.textContent = reps;
      if (out.hours) out.hours.textContent = hours + " hrs";
      if (out.deal) out.deal.textContent = money(deal);
      if (out.deals) out.deals.textContent = deals;
      const hoursSaved = reps * hours * 0.8 * 46;                 // 80% of admin, 46 selling weeks
      const value = hoursSaved * 65;                              // loaded cost of a selling hour
      const pipe = reps * deals * deal * 12 * 0.08;               // 8% more closed from recovered time
      if (out.saved) out.saved.textContent = Math.round(hoursSaved).toLocaleString("en-US");
      if (out.value) out.value.textContent = money(value);
      if (out.pipe) out.pipe.textContent = money(pipe);
      Object.values(inp).forEach(i => {
        const p = ((i.value - i.min) / (i.max - i.min)) * 100;
        i.style.setProperty("--p", p + "%");
      });
    }
    Object.values(inp).forEach(i => i && i.addEventListener("input", calc));
    calc();
  })();

  /* ---------- accordion ---------- */
  $$(".acc-item").forEach(item => {
    const q = $(".acc-q", item), a = $(".acc-a", item);
    if (!q || !a) return;
    q.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open);
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
    });
  });

  /* ---------- billing toggle (pricing) ---------- */
  (() => {
    const t = $("#billing-toggle");
    if (!t) return;
    const prices = $$("[data-monthly]");
    t.addEventListener("click", () => {
      const annual = t.classList.toggle("on");
      t.setAttribute("aria-pressed", annual);
      prices.forEach(p => { p.textContent = annual ? p.dataset.annual : p.dataset.monthly; });
      $$(".billing-note").forEach(n => n.classList.toggle("on", annual));
    });
  })();

  /* ---------- waitlist form (client-side confirm) ---------- */
  (() => {
    const form = $(".js-waitlist-form");
    if (!form) return;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const btn = $("button[type=submit]", form);
      if (btn) { btn.disabled = true; btn.textContent = "Joining…"; }
      setTimeout(() => {
        form.classList.add("is-sent");
        const ok = $(".form-done", form.parentElement);
        if (ok) ok.classList.add("on");
      }, 900);
    });
  })();

  /* ---------- hero product demo (index) ----------
     A tabbed replica of the real app surfaces. It autoplays through
     them until the visitor takes control, then stays where they put it.
     Everything mounts from the DOM, so removing the markup removes the
     module. Stands down for reduced motion (panels still switch, just
     without the theatre).                                            */
  (() => {
    const app = $(".app");
    if (!app) return;
    const tabs = $$(".rail-item[role=tab]", app);
    const panels = $$(".app-panel", app);
    if (!tabs.length || !panels.length) return;

    const DWELL = 7000;
    const statusChip = $(".window-status", app);
    const pathEl = $(".app-path", app);
    const ROUTES = { brief: " / morning-brief", deal: " / deals", call: " / conversations", coach: " / coaching" };
    const STATUS = {
      brief: ["chip--good", "CRM SYNCED"],
      deal:  ["chip--blue", "SCORING"],
      call:  ["chip--risk", "RECORDING"],
      coach: ["chip--good", "REVIEWED"]
    };

    // per-account intelligence, keyed off the brief's deal cards
    const ACCOUNTS = {
      halcyon:   { name: "Halcyon Health", amount: "$184k", score: 82, win: 82, champion: 74, pressure: 38, committee: 4,
                   note: "CFO ADDED FROM CALL 14 SEP · “FINANCE SIGNS OFF”" },
      northwind: { name: "Northwind", amount: "$92k", score: 91, win: 91, champion: 86, pressure: 22, committee: 3,
                   note: "ROLLOUT TO THREE REGIONS CONFIRMED 02 OCT · EXPANSION SIZED" },
      atlas:     { name: "Atlas Freight", amount: "$57k", score: 64, win: 64, champion: 51, pressure: 44, committee: 4,
                   note: "VP FINANCE JOINED THREAD 06 OCT · MAPPED TO COMMITTEE" }
    };

    let current = "brief";
    let autoplay = !reduced;
    let dwellTimer = null;
    let paused = false;
    let runToken = 0;              // invalidates in-flight panel animations

    /* ----- panel choreography ----- */

    function setDeal(key) {
      const a = ACCOUNTS[key];
      if (!a) return;
      $$("[data-deal]", app).forEach(el => {
        const f = el.dataset.deal;
        if (f in a) el.textContent = a[f];
      });
      $$("[data-meter]", app).forEach(el => {
        el.style.setProperty("--w", a[el.dataset.meter] + "%");
      });
    }

    function typeInto(el, text, token) {
      return new Promise(resolve => {
        if (reduced) { el.textContent = text; resolve(); return; }
        el.textContent = "";
        el.classList.add("is-typing");
        let i = 0;
        const step = () => {
          if (token !== runToken) { el.classList.remove("is-typing"); return resolve(); }
          // 2 chars a tick keeps a three-line transcript inside its dwell
          el.textContent = text.slice(0, (i += 2));
          if (i < text.length) return setTimeout(step, 16);
          el.classList.remove("is-typing");
          resolve();
        };
        step();
      });
    }

    const wait = (ms, token) => new Promise(r => setTimeout(() => r(token === runToken), ms));

    async function playCall(token) {
      const panel = $('[data-panel="call"]', app);
      const msgs = $$(".msg", panel);
      const signals = $$("[data-signal]", panel);
      const rec = $("[data-rec]", panel);
      const fields = $("[data-fields]", app);

      msgs.forEach(m => { m.classList.remove("is-on"); $(".say", m).textContent = ""; });
      signals.forEach(c => c.classList.remove("is-on"));

      // recording clock
      let sec = 0;
      if (rec) rec.textContent = "00:00";
      const clock = setInterval(() => {
        if (token !== runToken) return clearInterval(clock);
        sec++;
        if (rec) rec.textContent =
          String((sec / 60) | 0).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
      }, 1000);

      for (let i = 0; i < msgs.length; i++) {
        if (token !== runToken) break;
        msgs[i].classList.add("is-on");
        await typeInto($(".say", msgs[i]), msgs[i].dataset.say || "", token);
        if (!(await wait(180, token))) break;
        // each line the phantom understands lights a signal + a CRM write
        const chip = signals[i];
        if (chip) chip.classList.add("is-on");
        if (fields) fields.textContent = 8 + (i + 1) * 2;
      }
      if (token === runToken && signals[3]) {
        if (await wait(400, token)) {
          signals[3].classList.add("is-on");
          if (fields) fields.textContent = 14;
        }
      }
    }

    function activate(name, byUser) {
      if (!STATUS[name]) return;
      current = name;
      runToken++;
      const token = runToken;

      tabs.forEach(t => {
        const on = t.dataset.tab === name;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(p => {
        const on = p.dataset.panel === name;
        p.classList.toggle("is-on", on);
        p.hidden = !on;
      });

      if (statusChip) {
        const [cls, text] = STATUS[name];
        statusChip.className = "chip window-status " + cls;
        statusChip.innerHTML = '<span class="dot"></span>' + text;
      }
      if (pathEl) pathEl.textContent = ROUTES[name];

      if (name === "call") playCall(token);
      if (byUser) stopAutoplay();
      else scheduleNext();
    }

    /* ----- autoplay ----- */

    function armTimer() {
      const tab = tabs.find(t => t.dataset.tab === current);
      if (!tab) return;
      tabs.forEach(t => t.classList.remove("is-counting"));
      void tab.offsetWidth;                     // restart the countdown animation
      tab.style.setProperty("--dwell", DWELL + "ms");
      tab.classList.add("is-counting");
    }

    function scheduleNext() {
      clearTimeout(dwellTimer);
      if (!autoplay || paused) return;
      armTimer();
      dwellTimer = setTimeout(() => {
        const i = tabs.findIndex(t => t.dataset.tab === current);
        activate(tabs[(i + 1) % tabs.length].dataset.tab, false);
      }, DWELL);
    }

    function stopAutoplay() {
      autoplay = false;
      clearTimeout(dwellTimer);
      tabs.forEach(t => t.classList.remove("is-counting"));
      const foot = $(".rail-foot", app);
      if (foot) foot.textContent = "Click any surface";
    }

    /* ----- input ----- */

    tabs.forEach(tab => {
      tab.addEventListener("click", () => activate(tab.dataset.tab, true));
      tab.addEventListener("keydown", e => {
        const i = tabs.indexOf(tab);
        let next = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % tabs.length;
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        tabs[next].focus();
        activate(tabs[next].dataset.tab, true);
      });
    });

    // a deal card opens that account's intelligence — the same jump the app makes
    $$(".deal[data-account]", app).forEach(card => {
      card.addEventListener("click", () => {
        setDeal(card.dataset.account);
        activate("deal", true);
        const t = tabs.find(x => x.dataset.tab === "deal");
        if (t) t.focus();
      });
    });

    // hovering or tabbing into the app holds the current surface
    const hold = on => { paused = on; on ? (clearTimeout(dwellTimer), tabs.forEach(t => t.classList.remove("is-counting"))) : scheduleNext(); };
    app.addEventListener("pointerenter", () => hold(true));
    app.addEventListener("pointerleave", () => hold(false));
    app.addEventListener("focusin", () => hold(true));
    app.addEventListener("focusout", e => { if (!app.contains(e.relatedTarget)) hold(false); });
    document.addEventListener("visibilitychange", () => hold(document.hidden));

    // don't run the demo to an empty room
    const io = new IntersectionObserver(([e]) => hold(!e.isIntersecting), { threshold: 0.15 });
    io.observe(app);

    if (reduced) {
      stopAutoplay();
      const foot = $(".rail-foot", app);
      if (foot) foot.textContent = "Click any surface";
    }
    activate("brief", false);
  })();

  /* ---------- misc ---------- */
  $$("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
  $$('input[type="range"]').forEach(i => {
    const set = () => i.style.setProperty("--p", (((i.value - i.min) / (i.max - i.min)) * 100) + "%");
    i.addEventListener("input", set); set();
  });
})();
