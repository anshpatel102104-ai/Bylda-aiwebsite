/* ============================================================
   BYLDA — Liquid Metal interactions (homepage)
   Vanilla, dependency-free. Each module mounts only if its DOM
   exists. Motion stands down for prefers-reduced-motion; every
   interaction still works, it just skips the theatre.
   Motion vocabulary: observe → detect → connect → explain.
   ============================================================ */
(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const wait = ms => new Promise(r => setTimeout(r, reduced ? 0 : ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* Run cb once when el scrolls into view. */
  function whenSeen(el, cb, threshold = 0.35) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { cb(); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); cb(); }
    }, { threshold });
    io.observe(el);
  }

  /* Deterministic pseudo-random, so waveforms look the same every visit. */
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  /* ---------- ready ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("is-ready")));

  /* ---------- pointer: grid lens + metal parallax ---------- */
  (() => {
    if (!finePointer || reduced) return;
    const root = document.documentElement;
    const metals = $$(".lq-metal svg");
    let x = innerWidth / 2, y = innerHeight / 3, raf = 0, armed = false;
    function paint() {
      raf = 0;
      root.style.setProperty("--mx", x + "px");
      root.style.setProperty("--my", y + "px");
      const dx = (x / innerWidth - 0.5), dy = (y / innerHeight - 0.5);
      for (const m of metals) m.style.transform = `translate3d(${dx * -14}px, ${dy * -10}px, 0)`;
    }
    addEventListener("pointermove", e => {
      x = e.clientX; y = e.clientY;
      if (!armed) { armed = true; document.body.classList.add("has-pointer"); }
      if (!raf) raf = requestAnimationFrame(paint);
    }, { passive: true });
  })();

  /* ---------- nav ---------- */
  (() => {
    const nav = $(".lq-nav");
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 24);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const burger = $(".lq-burger", nav), menu = $(".lq-menu", nav);
    if (!burger || !menu) return;
    const set = open => {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("open", open);
    };
    burger.addEventListener("click", () => set(burger.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  })();

  /* ---------- waveforms ---------- */
  $$("[data-wave]").forEach((wave, n) => {
    const count = wave.classList.contains("lq-wave--wide") ? (innerWidth < 640 ? 72 : 140) : (innerWidth < 640 ? 60 : 84);
    const r = rng(11 + n * 7);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const b = document.createElement("i");
      // speech-like envelope: phrases with quiet gaps between them
      const phrase = Math.sin(i / count * Math.PI * 9) * 0.5 + 0.5;
      b.style.setProperty("--h", (0.12 + phrase * 0.55 + r() * 0.33).toFixed(2));
      b.style.setProperty("--i", i);
      frag.appendChild(b);
    }
    wave.appendChild(frag);
    if (wave.dataset.mark) {
      const m = document.createElement("span");
      m.className = "mark";
      m.style.setProperty("--m", wave.dataset.mark);
      wave.appendChild(m);
    }
    wave._bars = $$("i", wave);
    wave._setProgress = p => wave._bars.forEach((b, i) => b.classList.toggle("past", i / wave._bars.length < p));
    if (!wave.closest("[data-seq]")) whenSeen(wave, () => wave.classList.add("drawn"), 0.2);
  });

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const CALL_LEN = 737; // 12:17

  /* ---------- hero call ---------- */
  (() => {
    const call = $("#hero-call");
    if (!call) return;
    const stage = call.parentElement;
    const card = $("#hero-insight");
    const link = $(".lq-link", stage);
    const linkPath = $("[data-link-path]", stage);
    const wave = $("[data-wave]", call);
    const lines = $$(".lq-line", call);
    const anchor = $("[data-anchor]", call);
    const detectTag = $("[data-detect]", anchor);
    const scan = $(".lq-scan", call);
    const status = $("[data-status]", call);
    const steps = $$("dl > div", card);
    card.setAttribute("data-seq-card", "");

    /* connection line from the objection row to the insight card */
    function drawLink() {
      if (!link || getComputedStyle(link).display === "none") return;
      const s = stage.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const x1 = a.right - s.left - 8, y1 = a.top - s.top + a.height / 2;
      const x2 = c.left - s.left + c.width * 0.35, y2 = c.top - s.top;
      const mx = x1 + 30;
      linkPath.setAttribute("d", `M${x1} ${y1} C${mx + 30} ${y1} ${x2} ${y1 + 20} ${x2} ${y2}`);
      const len = Math.ceil(linkPath.getTotalLength());
      link.style.setProperty("--len", len);
      let dot = $("circle", link);
      if (!dot) {
        dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("r", "3");
        link.appendChild(dot);
      }
      dot.setAttribute("cx", x1); dot.setAttribute("cy", y1);
    }

    async function play() {
      call.classList.add("on");
      await wait(500);
      wave.classList.add("drawn");
      await wait(450);
      lines[0].classList.add("on");
      await wait(300);
      lines[1].classList.add("on");
      wave._setProgress(0.547);
      await wait(250);
      // objection lands: freeze, flag, scan
      anchor.classList.add("flag");
      wave.classList.add("flag");
      scan.classList.add("run");
      await wait(900);
      detectTag.classList.add("on");
      await wait(220);
      drawLink();
      link.classList.add("on");
      await wait(450);
      card.classList.add("on");
      for (const s of steps) { await wait(260); s.classList.add("on"); }
      await wait(200);
      for (const l of lines.slice(2)) { l.classList.add("on"); await wait(160); }
      status.classList.add("done");
      $("span", status).textContent = "5 behaviors";
    }

    if (reduced) {
      call.classList.add("on");
      wave.classList.add("drawn");
      wave._setProgress(0.547);
      lines.forEach(l => l.classList.add("on"));
      anchor.classList.add("flag"); wave.classList.add("flag");
      detectTag.classList.add("on");
      card.classList.add("on"); steps.forEach(s => s.classList.add("on"));
      link.classList.add("on");
      status.classList.add("done"); $("span", status).textContent = "5 behaviors";
      requestAnimationFrame(drawLink);
    } else {
      setTimeout(play, 700);
    }
    addEventListener("resize", () => { if (link.classList.contains("on")) drawLink(); }, { passive: true });
    document.fonts?.ready.then(() => { if (link.classList.contains("on")) drawLink(); });

    /* tabs */
    const tabs = $$("[role=tab]", call);
    function select(tab) {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $("#" + t.dataset.tab).hidden = !on;
      });
      link.style.visibility = tab === tabs[0] ? "" : "hidden";
    }
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", e => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        const next = tabs[(i + d + tabs.length) % tabs.length];
        next.focus(); select(next);
      });
    });

    /* playback: moves the playhead through the excerpt */
    const btn = $("[data-play]", call), time = $("[data-time]", call);
    let playing = false, t0 = 0, p0 = 0.547, cur = p0, raf = 0;
    function tick(now) {
      const p = p0 + (now - t0) / 1000 / CALL_LEN;
      if (p >= 1) { stop(); return; }
      cur = p;
      wave._setProgress(p);
      time.textContent = `${fmt(p * CALL_LEN)} / 12:17`;
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      playing = false; cancelAnimationFrame(raf);
      btn.classList.remove("is-playing"); btn.setAttribute("aria-label", "Play call excerpt");
    }
    btn.addEventListener("click", () => {
      if (playing) { p0 = cur; stop(); return; }
      playing = true; t0 = performance.now();
      btn.classList.add("is-playing"); btn.setAttribute("aria-label", "Pause call excerpt");
      raf = requestAnimationFrame(tick);
    });
    wave.addEventListener("click", e => {
      const r = wave.getBoundingClientRect();
      p0 = cur = clamp((e.clientX - r.left) / r.width, 0, 1);
      wave._setProgress(p0);
      time.textContent = `${fmt(p0 * CALL_LEN)} / 12:17`;
      if (playing) t0 = performance.now();
    });

    /* "Hear better response" — spoken where the browser can, always shown as text */
    const hear = $("[data-say]", card), sayText = $(".lq-say-text", card);
    hear?.addEventListener("click", () => {
      sayText.textContent = "“" + hear.dataset.say + "”";
      sayText.hidden = false;
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(hear.dataset.say);
        u.rate = 0.95;
        speechSynthesis.speak(u);
      }
    });

    /* "See how Bylda thinks" */
    const overlay = $(".lq-think", call);
    const thinkLines = $(".lq-think-lines", call);
    const thinkPath = $("[data-think-path]", call);
    const chain = $(".lq-chain", overlay);
    $$("li", chain).forEach((li, i) => li.style.setProperty("--i", i));
    let thinking = false, restoreTimer = 0;

    function traceTags() {
      const c = call.getBoundingClientRect();
      const pts = $$("[data-think]", call).map(t => {
        const r = t.getBoundingClientRect();
        return [r.left - c.left - 6, r.top - c.top + r.height / 2];
      }).filter(p => p[0] > 0);
      if (pts.length < 2) return;
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = pts[i - 1], [x, y] = pts[i];
        d += ` C${px - 26} ${py + 10} ${x - 26} ${y - 10} ${x} ${y}`;
      }
      thinkPath.setAttribute("d", d);
      thinkLines.style.setProperty("--len", Math.ceil(thinkPath.getTotalLength()));
    }

    async function think() {
      if (thinking) return;
      thinking = true;
      select(tabs[0]);
      lines.forEach(l => l.classList.add("on"));
      call.classList.add("is-thinking");
      stage.classList.add("is-thinking");
      scan.classList.remove("run"); void scan.offsetWidth; scan.classList.add("run");
      const tags = $$("[data-think]", call);
      await wait(350);
      for (const t of tags) { t.classList.add("on"); await wait(170); }
      traceTags();
      await wait(1100);
      overlay.hidden = false;
      await wait(20);
      overlay.classList.add("on");
      chain.classList.add("on");
      $("[data-think-close]", overlay).focus({ preventScroll: true });
      restoreTimer = setTimeout(restore, reduced ? 12000 : 7500);
    }
    function restore() {
      clearTimeout(restoreTimer);
      overlay.classList.remove("on");
      chain.classList.remove("on");
      setTimeout(() => {
        overlay.hidden = true;
        call.classList.remove("is-thinking");
        stage.classList.remove("is-thinking");
        $$("[data-think]", call).forEach(t => t.classList.remove("on"));
        thinking = false;
      }, reduced ? 0 : 500);
    }
    $$("[data-think-trigger]").forEach(b => b.addEventListener("click", () => {
      if (innerWidth < 900) call.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      think();
    }));
    $("[data-think-close]", overlay).addEventListener("click", restore);
  })();

  /* ---------- what → why scrub ---------- */
  (() => {
    const sec = $("[data-scrub]");
    if (!sec) return;
    const mq = matchMedia("(min-width: 900px)");
    let raf = 0;
    function update() {
      raf = 0;
      if (!sec.classList.contains("is-scrub")) return;
      const r = sec.getBoundingClientRect();
      const span = r.height - innerHeight;
      const p = clamp(-r.top / (span || 1), 0, 1);
      sec.style.setProperty("--p", p.toFixed(3));
    }
    function mode() {
      const on = mq.matches && !reduced;
      sec.classList.toggle("is-scrub", on);
      if (!on) sec.style.setProperty("--p", "1");
      update();
    }
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    mq.addEventListener?.("change", mode);
    mode();
  })();

  /* ---------- open the call ---------- */
  (() => {
    const viewer = $("[data-viewer]");
    if (!viewer) return;
    const MOMENTS = {
      q: {
        tone: "info", tag: "Discovery question", ts: "06:31",
        what: "The rep asked a strong consequence question — the right move at the right time.",
        behavior: "Discovery depth",
        impact: "It surfaced the real constraint: cost. The next response decides whether it gets explored.",
        better: "Keep it. Then stay in discovery when the answer is uncomfortable."
      },
      price: {
        tone: "risk", tag: "Price resistance", ts: "06:42",
        what: "The prospect raised a price objection early, signaling budget concern.",
        behavior: "Price resistance",
        impact: "Conversation risk increased after the objection was not properly investigated.",
        better: "Acknowledge the objection, then ask a diagnostic question to uncover the actual constraint."
      },
      pace: {
        tone: "warn", tag: "Rushed response", ts: "06:44",
        what: "The rep started answering within half a second and sped up from 142 to 168 words per minute.",
        behavior: "Interruption · pace increase · overexplaining",
        impact: "Four options were offered before the constraint behind “too much” was known.",
        better: "Pause. Acknowledge. Ask: “Too much compared to what?” — then let them answer."
      },
      send: {
        tone: "risk", tag: "Prospect disengagement", ts: "07:52",
        what: "The prospect asked to receive material instead of continuing the conversation.",
        behavior: "Buyer withdrawal",
        impact: "“Send me something” without a booked next step is a pattern that often appears before stalled deals.",
        better: "Treat it as a signal, not a request. Ask what they would need to see to decide."
      },
      control: {
        tone: "risk", tag: "Control shift", ts: "07:55",
        what: "The prospect set the next step. The rep accepted it with no date, owner, or meeting.",
        behavior: "Control loss",
        impact: "The call ended without a commitment. Deal risk increased.",
        better: "“Happy to. So it’s useful — can we walk through it together Thursday at 2?”"
      }
    };
    const call = $(".lq-viewer-call", viewer);
    const card = $("[data-card]", viewer);
    const chain = $("[data-chain]", viewer);
    const hint = $("[data-hint]", viewer);
    const marks = $$("[data-moment]", viewer);
    const rows = $$(".lq-transcript--lg .lq-line", viewer);
    const status = $("[data-status]", call);
    const punch = $("[data-punch]");
    const nudge = $("[data-nudge]");
    $$("li", chain).forEach((li, i) => li.style.setProperty("--i", i));
    let picks = 0;

    function show(key, byUser) {
      const m = MOMENTS[key];
      if (!m) return;
      marks.forEach(b => b.classList.toggle("is-active", b.dataset.moment === key));
      marks.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.moment === key)));
      rows.forEach(r => { r.classList.remove("is-active", "risk", "warn", "info"); });
      const row = rows.find(r => r.dataset.for === key);
      row?.classList.add("is-active", m.tone);
      const tag = $("[data-f=tag]", card);
      tag.className = "lq-tag lq-tag--" + m.tone;
      tag.textContent = m.tag;
      for (const f of ["ts", "what", "behavior", "impact", "better"]) $(`[data-f=${f}]`, card).textContent = m[f];
      card.hidden = false;
      card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap");
      if (byUser) {
        picks++;
        if (picks === 2) offerNudge();
      }
    }

    async function reveal() {
      viewer.dataset.state = "seen";
      status.classList.remove("lq-status--idle");
      status.classList.add("done");
      $("span", status).textContent = "5 moments";
      chain.classList.add("on");
      await wait(700);
      show("price", false);
      hint.hidden = false;
      await wait(900);
      punch?.classList.add("on");
    }

    $("[data-reveal-call]", viewer).addEventListener("click", reveal);
    marks.forEach(b => b.addEventListener("click", () => { if (viewer.dataset.state === "seen") show(b.dataset.moment, true); }));
    rows.forEach(r => r.addEventListener("click", () => { if (viewer.dataset.state === "seen") show(r.dataset.for, true); }));

    /* contextual nudge — once per session, never over the form */
    function offerNudge() {
      if (!nudge) return;
      try { if (sessionStorage.getItem("lq-nudge")) return; sessionStorage.setItem("lq-nudge", "1"); } catch {}
      setTimeout(() => { nudge.hidden = false; }, reduced ? 0 : 1200);
    }
    $$("[data-nudge-close]").forEach(b => b.addEventListener("click", () => { nudge.hidden = true; }));
    whenSeen($("#join"), () => { if (nudge) nudge.hidden = true; }, 0.2);
  })();

  /* ---------- managers ---------- */
  (() => {
    const field = $("[data-field]");
    const story = $("[data-story]");
    if (!field || !story) return;
    const N = innerWidth < 640 ? 400 : 425;
    const HITS = { 57: "risk", 163: "warn", 248: "good", 331: "info" };
    const frag = document.createDocumentFragment();
    for (let i = 0; i < N; i++) {
      const d = document.createElement("i");
      if (HITS[i]) d.className = "hit " + HITS[i];
      frag.appendChild(d);
    }
    field.appendChild(frag);
    const beats = $$("p:not(.lq-eyebrow)", story);
    if (reduced) { beats.forEach(b => b.classList.add("on")); field.classList.add("sift"); return; }
    whenSeen(story, async () => {
      for (const b of beats) { b.classList.add("on"); await wait(650); }
      field.classList.add("sift");
    }, 0.5);
  })();

  /* ---------- reps: score dissolves into a behavior ---------- */
  whenSeen($("[data-swap]"), () => setTimeout(() => $("[data-swap]").classList.add("on"), reduced ? 0 : 900), 0.6);

  /* ---------- behavior graph ---------- */
  (() => {
    const root = $("[data-graph]");
    if (!root) return;
    const svg = $(".lq-graph", root);
    const gE = $("[data-edges]", svg), gN = $("[data-nodes]", svg);
    const NS = "http://www.w3.org/2000/svg";
    // s = stage at which the element appears
    const NODES = {
      po: { x: 130, y: 110, label: "Price Objection", s: 1 },
      sp: { x: 330, y: 250, label: "Speaking Pace", s: 2, count: "×11 calls" },
      ri: { x: 150, y: 400, label: "Rep Interruption", s: 4 },
      ph: { x: 380, y: 70, label: "Prospect Hesitation", s: 5 },
      or: { x: 560, y: 190, label: "Objection Response", s: 4 },
      dd: { x: 560, y: 430, label: "Discovery Depth", s: 5 },
      cl: { x: 750, y: 100, label: "Control Loss", s: 5 },
      fu: { x: 750, y: 330, label: "Follow-Up", s: 5 },
      cw: { x: 900, y: 230, label: "Closed Won", s: 6, outcome: true }
    };
    const EDGES = [
      ["po", "sp", 2, "risk"], ["sp", "ri", 4, "risk"], ["sp", "or", 4, "risk"], ["po", "ph", 5, "risk"],
      ["ph", "or", 5, "risk"], ["ri", "cl", 5, "risk"], ["or", "cl", 5, "risk"], ["or", "fu", 5, "good"],
      ["dd", "or", 5, "good"], ["dd", "fu", 5, "good"], ["fu", "cw", 6, "good"], ["dd", "cw", 6, "good"], ["cl", "cw", 6, "risk"]
    ];
    const CAPS = {
      1: "A prospect objects to price at 06:42. One call, one event.",
      2: "The rep speeds up: 142 → 179 words per minute. Now it’s a behavior.",
      3: "The same speed-up appears in 11 of this rep’s last 30 calls.",
      4: "For this rep it tends to arrive with interruptions and a weaker objection response.",
      5: "Across the team, the same sequence often leads to control loss — while deeper discovery leads to stronger follow-up.",
      6: "Calls with this sequence reach Closed Won less often. That’s a pattern worth testing a change against."
    };
    const LAYER = { 1: 1, 2: 2, 3: 3, 4: 3, 5: 3, 6: 4 };

    const curve = (a, b) => {
      const mx = (a.x + b.x) / 2;
      return `M${a.x} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
    };
    const edgeEls = EDGES.map(([a, b, s, tone]) => {
      const d = curve(NODES[a], NODES[b]);
      const hi = document.createElementNS(NS, "path");
      hi.setAttribute("d", d); hi.setAttribute("class", "edge-hi");
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d); p.setAttribute("class", "edge " + tone);
      if (tone === "risk" && b === "cw") p.setAttribute("stroke-dasharray", "4 5");
      gE.append(hi, p);
      return { a, b, s, tone, el: p, hi };
    });
    const nodeEls = Object.entries(NODES).map(([k, n]) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "node" + (n.outcome ? " outcome" : ""));
      g.setAttribute("transform", `translate(${n.x} ${n.y})`);
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", n.label);
      g.innerHTML = `<circle class="halo" r="16"/><circle class="ring" r="14"/><circle class="core" r="${n.outcome ? 7 : 5}"/>` +
        `<text x="${n.x > 820 ? -22 : 22}" y="5" text-anchor="${n.x > 820 ? "end" : "start"}">${n.label}</text>` +
        (n.count ? `<text class="count" x="22" y="24">${n.count}</text>` : "");
      gN.appendChild(g);
      return { k, n, el: g };
    });

    let stage = 1, auto = !reduced, timer = 0;
    const btns = $$("[data-go]", root), layers = $$("[data-layer]", root), cap = $("[data-cap]", root);
    function setStage(s) {
      stage = s;
      root.dataset.stage = s;
      btns.forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.go === s)));
      layers.forEach(l => l.classList.toggle("on", +l.dataset.layer === LAYER[s]));
      nodeEls.forEach(({ n, el }) => {
        el.classList.toggle("in", n.s <= s);
        el.classList.toggle("count-on", !!n.count && s >= 3);
      });
      edgeEls.forEach(e => {
        e.el.classList.toggle("in", e.s <= s);
        e.hi.classList.toggle("in", e.s <= s);
        // at the outcome stage, colour encodes association with the outcome
        e.el.classList.toggle("lit", s === 6 && e.s <= s && (e.b === "cw"));
      });
      cap.textContent = CAPS[s];
    }
    btns.forEach(b => b.addEventListener("click", () => { auto = false; clearTimeout(timer); setStage(+b.dataset.go); }));
    function advance() {
      if (!auto || stage >= 6) return;
      timer = setTimeout(() => { if (auto) { setStage(stage + 1); advance(); } }, 2600);
    }

    /* focus a node: light its neighbourhood, bend the plate's light toward it */
    const section = root.closest(".lq-pattern");
    function focusNode(k) {
      svg.classList.toggle("has-focus", !!k);
      const rel = new Set(k ? [k] : []);
      edgeEls.forEach(e => {
        const on = !!k && e.el.classList.contains("in") && (e.a === k || e.b === k);
        e.el.classList.toggle("rel", on);
        if (on) { rel.add(e.a); rel.add(e.b); }
      });
      nodeEls.forEach(({ k: kk, el }) => el.classList.toggle("rel", rel.has(kk)));
      if (k && section) {
        const r = nodeEls.find(n => n.k === k).el.getBoundingClientRect(), sr = section.getBoundingClientRect();
        section.style.setProperty("--gx", ((r.left + r.width / 2 - sr.left) / sr.width * 100).toFixed(1) + "%");
        section.style.setProperty("--gy", ((r.top + r.height / 2 - sr.top) / sr.height * 100).toFixed(1) + "%");
      }
    }
    nodeEls.forEach(({ k, el }) => {
      el.addEventListener("pointerenter", () => { if (el.classList.contains("in")) focusNode(k); });
      el.addEventListener("pointerleave", () => focusNode(null));
      el.addEventListener("focus", () => { if (el.classList.contains("in")) focusNode(k); });
      el.addEventListener("blur", () => focusNode(null));
      el.addEventListener("click", () => { if (el.classList.contains("in")) focusNode(k); });
    });

    setStage(reduced ? 6 : 1);
    whenSeen(root, advance, 0.4);
  })();

  /* ---------- loop, punchline, phantom copy, final ---------- */
  whenSeen($("[data-loop]"), () => $("[data-loop]").classList.add("on"), 0.4);
  whenSeen($(".lq-final"), () => $(".lq-final").classList.add("on"), 0.3);

  /* ---------- phantom: a figure made of observation ----------
     Particles are sampled inside the Bylda ghost silhouette. They sit at
     the edge of visibility and sharpen only near the cursor — the visitor
     may not notice it at first. One canvas, animated only while on screen. */
  (() => {
    const cv = $("[data-phantom]");
    if (!cv) return;
    const sec = cv.closest(".lq-phantom");
    const ctx = cv.getContext("2d");
    const ghost = new Path2D("M50 6C67 6 78 19 79 36C80 53 73 64 75 78C76 86 81 92 88 96C75 98 62 94 54 87C44 94 29 93 21 85C12 76 16 63 23 55C30 47 26 34 30 23C34 12 41 6 50 6Z");
    const eyes = [[43, 30, 2.6, 4.2], [56, 30, 2.6, 4.2]];
    let W = 0, H = 0, dpr = 1, pts = [], pairs = [], raf = 0, visible = false;
    let px = -1e4, py = -1e4, reveal = 0;

    function build() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      const size = Math.min(H * 0.86, W * (W < 700 ? 0.9 : 0.5));
      const ox = W < 700 ? (W - size) / 2 : W * 0.72 - size / 2, oy = (H - size) / 2 + (W < 700 ? H * 0.12 : 0);
      const r = rng(42), probe = document.createElement("canvas").getContext("2d");
      const target = W < 700 ? 260 : 460;
      pts = [];
      let guard = 0;
      while (pts.length < target && guard++ < 20000) {
        const u = r() * 100, v = r() * 100;
        if (!probe.isPointInPath(ghost, u, v)) continue;
        if (eyes.some(([ex, ey, rx, ry]) => ((u - ex) / rx) ** 2 + ((v - ey) / ry) ** 2 < 1.6)) continue;
        pts.push({ x: ox + u / 100 * size, y: oy + v / 100 * size, ph: r() * Math.PI * 2, s: 0.6 + r() * 1.3 });
      }
      pairs = [];
      const maxD = size * 0.075;
      for (let i = 0; i < pts.length; i++) {
        let links = 0;
        for (let j = i + 1; j < pts.length && links < 2; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          if (dx * dx + dy * dy < maxD * maxD) { pairs.push([i, j]); links++; }
        }
      }
    }

    function draw(now) {
      raf = 0;
      const t = now / 1000;
      reveal = Math.min(1, reveal + 0.006);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // a slow breath, so the figure surfaces and sinks back into the metal
      const breath = 0.55 + 0.45 * Math.sin(t * 0.35);
      const base = (0.08 + 0.18 * breath) * reveal;
      const R = 180;
      const pos = pts.map(p => {
        const x = p.x + Math.sin(t * 0.6 + p.ph) * 1.6, y = p.y + Math.cos(t * 0.5 + p.ph) * 1.6;
        const d = Math.hypot(x - px, y - py);
        const near = d < R ? 1 - d / R : 0;
        return [x, y, near];
      });
      ctx.lineWidth = 0.6;
      for (const [i, j] of pairs) {
        const a = pos[i], b = pos[j], near = Math.max(a[2], b[2]);
        ctx.strokeStyle = `rgba(95,100,104,${(base * 0.5 + near * 0.35).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      for (let i = 0; i < pts.length; i++) {
        const [x, y, near] = pos[i];
        ctx.fillStyle = `rgba(37,40,43,${(base + near * 0.55).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, pts[i].s + near * 0.8, 0, Math.PI * 2); ctx.fill();
      }
      if (visible && !reduced) raf = requestAnimationFrame(draw);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

    build();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) { sec.classList.add("on"); if (reduced) reveal = 1; kick(); }
      }, { threshold: 0.15 }).observe(sec);
    } else { visible = true; reveal = 1; sec.classList.add("on"); kick(); }
    sec.addEventListener("pointermove", e => {
      const r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top;
      if (reduced) kick();
    }, { passive: true });
    sec.addEventListener("pointerleave", () => { px = py = -1e4; if (reduced) kick(); });
    let rt = 0;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); kick(); }, 150); }, { passive: true });
  })();

  $$("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
})();

/* ---------- product loop tabs (home) ---------- */
(() => {
  const sys = document.querySelector("[data-sys]");
  if (!sys) return;
  const tabs = [...sys.querySelectorAll("[role=tab]")];
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const p = document.getElementById(t.getAttribute("aria-controls"));
      p.hidden = !on;
      if (on) { p.classList.remove("swap"); void p.offsetWidth; p.classList.add("swap"); }
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", e => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
})();

/* ---------- interior pages: table of contents + scroll-spy ---------- */
(() => {
  const side = document.body.dataset.toc;
  const main = document.querySelector("main");
  if (!side || !main) return;
  // the page's own headings only — not card titles, CTA panels or accordions
  const heads = [...main.querySelectorAll(":scope > :not(.page-hero) h2")]
    .filter(h => !h.closest(".lqp-toc, [aria-hidden=true], .acc, a, .glass, .card, .post, [aria-label='Keep reading'], [aria-label='Related']")
      && !h.classList.contains("h3") && h.textContent.trim());
  if (heads.length < 3) { delete document.body.dataset.toc; return; }
  const slug = t => t.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const aside = document.createElement("nav");
  aside.className = "lqp-toc";
  aside.setAttribute("aria-label", "On this page");
  const ol = document.createElement("ol");
  heads.forEach(h => {
    if (!h.id) h.id = slug(h.textContent) || "section";
    const li = document.createElement("li"), a = document.createElement("a");
    a.href = "#" + h.id;
    a.textContent = h.textContent.replace(/\s+/g, " ").trim();
    li.appendChild(a); ol.appendChild(li);
  });
  aside.innerHTML = "<p>On this page</p>";
  aside.appendChild(ol);
  const hero = main.querySelector(".page-hero");
  hero ? hero.after(aside) : main.prepend(aside);
  const links = [...aside.querySelectorAll("a")];
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  heads.forEach(h => io.observe(h));
})();

/* ---------- interior pages: reading progress ---------- */
(() => {
  if (!document.body.hasAttribute("data-progress")) return;
  const bar = document.createElement("div");
  bar.className = "lqp-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  let raf = 0;
  const paint = () => {
    raf = 0;
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty("--read", h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0);
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  paint();
})();

/* ---------- interior pages: dot field that sifts to the calls that matter ---------- */
document.querySelectorAll("[data-field-auto]").forEach(field => {
  const n = +field.dataset.fieldAuto || 400;
  const hits = { 37: "risk", 141: "warn", 262: "good", 318: "info" };
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const d = document.createElement("i");
    if (hits[i]) d.className = "hit " + hits[i];
    frag.appendChild(d);
  }
  field.appendChild(frag);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) { field.classList.add("sift"); return; }
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(() => field.classList.add("sift"), 700); }
  }, { threshold: 0.4 });
  io.observe(field);
});

/* ============================================================
   MOTION + HOVER LAYER
   ============================================================ */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const hasIO = "IntersectionObserver" in window;
  if (!reduced && hasIO) document.documentElement.classList.add("lq-anim");

  const onSeen = (els, cb, opts = { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }) => {
    if (!els.length) return;
    if (reduced || !hasIO) { els.forEach(cb); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } }), opts);
    els.forEach(el => io.observe(el));
  };

  /* ---- scroll reveal: blocks outside the first screen, never ones os.js or a scene already animates ---- */
  const RV = [
    ".lqp main > :not(.page-hero) :is(.section-head, .prose > *, .glass, .window, .cmp-wrap, .acc, .grid-2 > *, .grid-3 > *, .grid-4 > *, .lq-mock, .lqp-feat-copy, .lqp-status > div, .metric, .graph-row, .tier, .seam, .layers, .lqp-duo, .ba-col, .chain-node, .tl-item)",
    ".lq-proof :is(.lq-proof-title, .lq-usecases, .lq-pillars > li)",
    ".lq-join :is(.lq-join-grid > *)", ".lq-head", ".lq-brief", ".lq-footer-grid > *"
  ].join(",");
  const rv = $$(RV).filter(el => !el.closest("[data-reveal], .page-hero, .lq-hero, .lq-sys-panel, .lq-why, [data-viewer]") && !el.hasAttribute("data-reveal")
    && !el.parentElement.closest(RV));
  rv.forEach(el => {
    el.classList.add("lq-rv");
    const sibs = [...el.parentElement.children].filter(c => c.matches(RV));
    el.style.setProperty("--rv", Math.min(sibs.indexOf(el), 6));
  });
  onSeen(rv, el => {
    el.classList.add("is-in");
    // hand the element back to its own hover/transition rules once it has landed
    setTimeout(() => el.classList.remove("lq-rv", "is-in"), 1000 + (+el.style.getPropertyValue("--rv") || 0) * 90);
  });

  /* ---- mocks + strips play in when seen ---- */
  const STEP = ".lq-sig, .lq-msg, .lq-bub, .lq-mb > li, .lq-pchain > li, .lq-ev-call, .lqp-crm .row, .lq-mem > li, .lq-compare > div";
  $$(".lq-mock, .lq-brief").forEach(m => $$(STEP, m).forEach((s, i) => s.style.setProperty("--st", i)));
  $$(".lqp-loop, .lqp-chain").forEach(l => { l.classList.add("lqp-seq"); [...l.children].forEach((li, i) => li.style.setProperty("--st", i)); });
  $$(".lqp-flow").forEach(f => [...f.children].forEach((c, i) => c.style.setProperty("--st", i)));
  $$(".lqp-graph path").forEach((p, i) => { p.setAttribute("pathLength", "1"); p.style.setProperty("--st", i); });
  const live = $$(".lq-mock, .lq-brief, .lqp-seq, .lqp-flow, .lqp-graph").filter(m => !m.closest(".lq-sys-panel[hidden]"));
  onSeen(live, m => m.classList.add("is-live"), { threshold: 0.3 });
  // home product loop: replay the panel's mock whenever its tab opens
  $$("[data-sys] [role=tab]").forEach(t => t.addEventListener("click", () => {
    const m = document.querySelector("#" + t.getAttribute("aria-controls") + " .lq-mock");
    if (!m) return;
    m.classList.remove("is-live"); void m.offsetWidth;
    requestAnimationFrame(() => m.classList.add("is-live"));
  }));

  /* ---- count-up numbers ---- */
  onSeen($$(".metric-num, .lqp-ww .what b, .lq-why-what b").filter(el => /^\$?\d/.test(el.textContent.trim())), el => {
    const node = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.textContent));
    if (!node || reduced) return;
    const m = node.textContent.match(/^(\D*)(\d+)(.*)$/s);
    if (!m) return;
    const [, pre, num, post] = m, to = +num, t0 = performance.now(), D = 1200;
    if (to < 2) return;
    const tick = now => {
      const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3);
      node.textContent = pre + Math.round(to * e) + post;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.6 });

  /* ---- card hover: lift + cursor-following sheen ---- */
  if (fine) {
    const H = ".ba-col, .glass, .lq-mock, .lq-card, .lq-brief, .lqp-vs-card, .lqp-status > div, .lqp-logos > span, .lq-loop-steps > li, .lq-usecases li, .lq-sys-rail button, .lq-form-card, .window";
    $$(H).forEach(el => {
      if (el.closest(".lq-hero, .page-hero .lqp-callwrap") || el.matches(".lq-stack .lq-card")) { /* keep their own motion */ }
      else el.classList.add("lq-hover");
      const s = document.createElement("span");
      s.className = "lq-sheen"; s.setAttribute("aria-hidden", "true");
      el.appendChild(s);
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--hx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        el.style.setProperty("--hy", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      }, { passive: true });
    });
    // sheen needs a positioned, clipped host
    $$(".lq-hover, .lq-stack .lq-card").forEach(el => { if (getComputedStyle(el).position === "static") el.style.position = "relative"; });
  }

  /* ---- hero visual tilt ---- */
  if (fine && !reduced) {
    $$(".lqp-visual, .lq-hero-stage").forEach(v => {
      const host = v.closest(".page-hero, .lq-hero") || v;
      v.classList.add("lq-tilt");
      host.addEventListener("pointermove", e => {
        const r = v.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
        v.style.transform = `perspective(1400px) rotateY(${(dx * 6).toFixed(2)}deg) rotateX(${(-dy * 5).toFixed(2)}deg)`;
      }, { passive: true });
      host.addEventListener("pointerleave", () => { v.style.transform = ""; });
    });
  }

  /* ---- tooltip overlay: what each behavior tag means ---- */
  const TIPS = {
    "price resistance": "The buyer pushed back on cost. Bylda checks whether the rep investigated it or rushed to defend the price.",
    "price objection": "The buyer pushed back on cost.",
    "discovery gap": "A good question was asked but not followed up, so the real constraint stayed hidden.",
    "discovery": "A question that uncovers the buyer’s situation, problem or the cost of doing nothing.",
    "unexplored blocker": "Something that can stop the deal was named, and the rep moved on without exploring it.",
    "blocker": "Something that can stop the deal — a new approver, a budget gap, a technical risk.",
    "skipped": "A step your sales process expects here didn’t happen.",
    "rushed response": "The rep answered too fast and too long, before understanding the objection.",
    "rep interrupted": "The rep spoke over the buyer. Pace rose at the same moment.",
    "defensiveness": "The buyer’s replies got shorter and more guarded.",
    "control shift": "The buyer, not the rep, set the next step — usually with no date or owner.",
    "prospect disengagement": "The buyer tried to end or defer the conversation.",
    "team signal": "A pattern showing up across several reps.",
    "rep signal": "A behavior repeating for one rep.",
    "call signal": "Something important in a single conversation.",
    "improvement": "A behavior moving in the right direction, measured on real calls.",
    "unresolved": "An issue raised on a call that was never closed out.",
    "stakeholder": "Who is — and isn’t — present in the buying conversation.",
    "risk rising": "Several signals on this deal point the same way. Example data.",
    "preview": "Being tested with early-access teams. Not generally available yet.",
    "in development": "Being built. Not available yet.",
    "early access": "Available today to teams in the early-access program.",
    "today": "Signals from yesterday’s calls, ranked by what needs attention.",
    "updated": "Written to the CRM from the call — every field traceable to a moment.",
    "open": "The moment Bylda is showing you now.",
    "outcomes": "What your CRM already records: activity and results.",
    "behaviors": "What happened inside the calls that produced those results."
  };
  const tipFor = el => {
    const own = el.getAttribute("data-tip");
    if (own) return [el.textContent.trim(), own];
    const t = el.textContent.trim().toLowerCase().replace(/[↑↓→]/g, "").trim();
    const key = Object.keys(TIPS).find(k => t === k || t.startsWith(k));
    return key ? [el.textContent.trim(), TIPS[key]] : null;
  };
  const tip = document.createElement("div");
  tip.className = "lq-tip"; tip.id = "lq-tip"; tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);
  let current = null;
  const show = el => {
    const d = tipFor(el); if (!d) return;
    current = el;
    tip.innerHTML = "";
    const b = document.createElement("b"); b.textContent = d[0];
    tip.append(b, document.createTextNode(d[1]));
    const r = el.getBoundingClientRect();
    tip.style.visibility = "hidden"; tip.classList.add("on");
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = Math.min(innerWidth - tw - 12, Math.max(12, r.left + r.width / 2 - tw / 2));
    let y = r.top - th - 10; if (y < 70) y = r.bottom + 10;
    tip.style.transform = ""; tip.style.left = x + "px"; tip.style.top = y + "px"; tip.style.visibility = "";
    el.setAttribute("aria-describedby", "lq-tip");
  };
  const hide = () => { tip.classList.remove("on"); if (current) current.removeAttribute("aria-describedby"); current = null; };
  $$(".lq-tag, .lq-badge, .lq-why-tag, [data-tip]").forEach(el => {
    if (!tipFor(el) || el.closest("[aria-hidden=true]")) return;
    el.setAttribute("data-tip-host", "");
    if (!el.closest("a, button")) el.tabIndex = 0;
    el.addEventListener("pointerenter", () => show(el));
    el.addEventListener("pointerleave", hide);
    el.addEventListener("focus", () => show(el));
    el.addEventListener("blur", hide);
  });
  addEventListener("scroll", () => { if (current) hide(); }, { passive: true });
  addEventListener("keydown", e => { if (e.key === "Escape") hide(); });
})();
