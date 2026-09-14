/* ============================================================
   BYLDA — Fate scenario engine (landing page)

   This is the V0 arithmetic from the engineering handoff, run client-side
   so a visitor can turn the inputs themselves. It is deliberately the same
   sequence of explicit transforms as the product:

     population → offer definition → evidence-weighted blended lift
       → deterministic revenue / margin / gross profit
       → seeded Monte Carlo for the interval
       → heuristic confidence score → decision-readiness gate

   Three properties are load-bearing and must survive any edit here:

   1. No number is invented. Every output is a fixed function of the inputs
      on screen and the offer constants below.
   2. The distribution is seeded. Identical inputs produce an identical
      interval, every time, on every machine — that is what makes a result
      quotable rather than decorative.
   3. The readiness gate can refuse. Drag the population low enough and the
      page stops showing an estimate. That behaviour is the product's whole
      claim to honesty; do not "fix" it by always rendering a number.
   ============================================================ */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const root = $("#scenario");
  if (!root) return;

  /* ---------- offer definitions ----------
     Lift priors, revenue multipliers and margin costs are the prototype
     constants. The industry priors are unsourced placeholders — which is
     exactly why the evidence mix is shown on screen rather than hidden. */
  const OFFERS = {
    financing: {
      label: "0% financing",
      prior: 0.25,
      revenueMultiplier: 1.0,
      marginCost: 0.035,
      industryPrior: 0.18,
      // share of the cohort whose recorded objection this offer actually
      // addresses, and the behavioural feature that scales company fit
      eligibleShare: 0.84,
      feature: 0.8,
      featureName: "price sensitivity",
      assumptions: [
        "Financing is presented at proposal stage to every eligible opportunity in the cohort.",
        "Carrying the financing cost removes 3.5 points of gross margin per won deal.",
        "Deal value is unchanged — the offer moves the decision, not the price.",
      ],
    },
    discount: {
      label: "10% discount",
      prior: 0.34,
      revenueMultiplier: 0.9,
      marginCost: 0,
      industryPrior: 0.2,
      eligibleShare: 0.84,
      feature: 0.8,
      featureName: "price sensitivity",
      assumptions: [
        "The discount is applied to every won deal in the cohort, not only the ones it rescued.",
        "Revenue per conversion falls 10%; margin percentage is held constant.",
        "No spillover: existing pipeline does not renegotiate to the new price.",
      ],
    },
    trial: {
      label: "30-day pilot",
      prior: 0.18,
      revenueMultiplier: 0.96,
      marginCost: 0.02,
      industryPrior: 0.12,
      eligibleShare: 0.62,
      feature: 0.55,
      featureName: "engagement",
      assumptions: [
        "Pilot delivery costs 2 points of gross margin per won deal.",
        "Revenue is recognised 4% lower to account for the pilot period.",
        "Time-to-close lengthens, but the outcome window is held fixed — timing effects are not modelled.",
      ],
    },
    bundle: {
      label: "Implementation bundle",
      prior: 0.14,
      revenueMultiplier: 1.06,
      marginCost: 0.045,
      industryPrior: 0.1,
      eligibleShare: 0.48,
      feature: 0.5,
      featureName: "urgency",
      assumptions: [
        "Bundled implementation raises deal value 6% and costs 4.5 points of gross margin.",
        "Delivery capacity is assumed sufficient for the additional implementations.",
        "Only opportunities with a fit signal in the cohort are treated as eligible.",
      ],
    },
  };

  const HISTORICAL_MARGIN = 0.45;   // revenue-weighted margin among won deals
  const BEHAVIOURAL_SIGNAL = 0.86;  // share of cohort with a recorded objection
  const WORLDS = 1000;

  /* ---------- deterministic RNG ----------
     mulberry32 seeded from a hash of the inputs. The seed is derived from
     the scenario the visitor is looking at, so the interval is stable while
     they read it and changes only when an input changes. */
  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normal(rng) {
    // Box–Muller. u must be non-zero or log() diverges.
    let u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }
  // Marsaglia–Tsang. Shape < 1 is handled by the standard boost.
  function gamma(rng, k) {
    if (k < 1) return gamma(rng, k + 1) * Math.pow(rng() || 1e-12, 1 / k);
    const d = k - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      const x = normal(rng);
      const v = Math.pow(1 + c * x, 3);
      if (v <= 0) continue;
      const u = rng();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  function beta(rng, a, b) {
    const x = gamma(rng, a);
    return x / (x + gamma(rng, b));
  }
  function binomial(rng, n, p) {
    // n is at most a few hundred here, so the direct sum is both exact and
    // faster than setting up an approximation.
    let k = 0;
    for (let i = 0; i < n; i++) if (rng() < p) k++;
    return k;
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- evidence weighting ---------- */
  function weights(n) {
    if (n > 100) return { company: 0.7, industry: 0.25, synthetic: 0.05, factor: 0.25, profile: "Company-led evidence" };
    if (n >= 30) return { company: 0.5, industry: 0.35, synthetic: 0.15, factor: 0.4, profile: "Growing company evidence" };
    return { company: 0.25, industry: 0.5, synthetic: 0.25, factor: 0.65, profile: "Early company evidence" };
    // (a controlled-experiment tier exists in the product at 90/10/0; it is
    //  not reachable from this page because no experiment flag is supplied)
  }

  /* ---------- the engine ---------- */
  function run(input) {
    const offer = OFFERS[input.offer];
    const n = input.population;
    const baseRate = input.baseRate;
    const wins = Math.round(n * baseRate);
    const losses = Math.max(0, n - wins);
    const avgDeal = input.avgDeal;

    const w = weights(n);

    // Company estimate: the offer prior scaled by behavioural fit and by how
    // much conversion headroom is left. Not a measured treatment effect.
    const fitRaw = offer.eligibleShare * 0.6 + offer.feature * 0.4;
    const fit = 0.7 + 0.3 * clamp(fitRaw, 0, 1);
    const headroom = 0.9 + 0.1 * clamp(1 - baseRate / 0.95, 0, 1);
    const companyEstimate = offer.prior * fit * headroom;

    const blendedLift =
      companyEstimate * w.company +
      offer.industryPrior * w.industry +
      offer.prior * w.synthetic;

    const baseConversions = wins;
    const baseRevenue = baseConversions * avgDeal;
    const baseGP = baseRevenue * HISTORICAL_MARGIN;

    const scenarioMargin = Math.max(0, HISTORICAL_MARGIN - offer.marginCost);

    const point = (lift) => {
      const rate = Math.min(0.95, baseRate * (1 + lift));
      const conv = Math.min(n, Math.round(n * rate));
      const revenue = conv * avgDeal * offer.revenueMultiplier;
      return { rate, conv, revenue, gp: revenue * scenarioMargin };
    };

    const scenario = point(blendedLift);
    const sensLow = point(clamp(blendedLift * 0.5, -0.95, 2.0));
    const sensHigh = point(clamp(blendedLift * 1.5, -0.95, 2.0));

    /* --- seeded Monte Carlo --- */
    const seed = hash([input.offer, n, baseRate.toFixed(3), avgDeal].join("|"));
    const rng = mulberry32(seed);
    const sd = Math.max(0.025, Math.abs(blendedLift) * w.factor);

    const gps = new Array(WORLDS);
    let downside = 0;
    for (let i = 0; i < WORLDS; i++) {
      // Jeffreys-prior posterior on the observed close rate
      const p = beta(rng, wins + 0.5, losses + 0.5);
      const lift = clamp(blendedLift + normal(rng) * sd, -0.95, 2.0);
      const pScenario = Math.min(0.95, p * (1 + lift));

      const cBase = binomial(rng, n, p);
      const cScenario = binomial(rng, n, pScenario);

      const gpBase = cBase * avgDeal * HISTORICAL_MARGIN;
      const gpScn = cScenario * avgDeal * offer.revenueMultiplier * scenarioMargin;

      gps[i] = gpScn;
      if (gpScn < gpBase) downside++;
    }
    gps.sort((a, b) => a - b);
    const q = (f) => gps[clamp(Math.floor(f * WORLDS), 0, WORLDS - 1)];

    /* --- heuristic confidence score (support, not accuracy) --- */
    const evidenceQuality = w.company * 0.55 + w.industry * 0.45 + w.synthetic * 0.2;
    let confidence =
      35 * Math.min(1, n / 250) +
      25 * Math.min(1, wins / 30) +
      15 * BEHAVIOURAL_SIGNAL +
      25 * evidenceQuality;
    // Without controlled-experiment evidence the score is capped. This page
    // never supplies one, so the cap always binds.
    confidence = Math.min(74, Math.round(confidence));
    const confLabel = confidence < 50 ? "Low" : confidence < 75 ? "Medium" : "High";

    /* --- decision readiness --- */
    let readiness;
    if (n < 10 || wins < 2) readiness = "abstain";
    else if (confidence < 50 || n < 30 || wins < 5) readiness = "exploratory";
    else readiness = "directional";

    return {
      offer, n, wins, baseRate, avgDeal, weights: w,
      blendedLift, baseConversions, baseRevenue, baseGP,
      scenario, sensLow, sensHigh, scenarioMargin,
      p10: q(0.1), p50: q(0.5), p90: q(0.9),
      downside: downside / WORLDS,
      confidence, confLabel, readiness,
    };
  }

  /* ---------- formatting ---------- */
  const usd = (v) => "$" + Math.round(v).toLocaleString("en-US");
  const usdK = (v) => {
    if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
    if (Math.abs(v) >= 1000) return "$" + (v / 1000).toFixed(v >= 100000 ? 0 : 1) + "K";
    return "$" + Math.round(v);
  };
  const pct = (v, d = 1) => (v * 100).toFixed(d) + "%";
  const signed = (v) => (v >= 0 ? "+" : "−") + usd(Math.abs(v));

  /* ---------- DOM wiring ---------- */
  const el = {
    offers: $$("#sim-offers .sim-opt"),
    pop: $("#sim-pop"), popV: $("#sim-pop-v"),
    rate: $("#sim-rate"), rateV: $("#sim-rate-v"),
    deal: $("#sim-deal"), dealV: $("#sim-deal-v"),
    mix: $("#sim-mix"),
    mixCo: $("#sim-mix-co"), mixInd: $("#sim-mix-ind"), mixSyn: $("#sim-mix-syn"),
    baseRev: $("#out-base-rev"), baseRate: $("#out-base-rate"),
    baseConv: $("#out-base-conv"), baseGp: $("#out-base-gp"),
    scnRev: $("#out-scn-rev"), scnRevD: $("#out-scn-rev-d"), scnRate: $("#out-scn-rate"),
    scnConv: $("#out-scn-conv"), scnGp: $("#out-scn-gp"),
    p10: $("#out-p10"), p50: $("#out-p50"), p90: $("#out-p90"), pbase: $("#out-pbase"),
    band: $("#out-band"), t10: $("#out-t10"), t50: $("#out-t50"), t90: $("#out-t90"), tbase: $("#out-tbase"),
    downside: $("#out-downside"), conf: $("#out-conf"), lift: $("#out-lift"), sens: $("#out-sens"),
    readiness: $("#out-readiness"), readinessT: $("#out-readiness-t"), readinessD: $("#out-readiness-d"),
    assume: $("#out-assume"),
  };

  const READINESS_COPY = {
    abstain: {
      t: "Abstain",
      d: "Not enough resolved evidence in this population to produce an estimate worth showing. Gather more outcomes, or widen the cohort — the honest answer here is that we don't know yet.",
    },
    exploratory: {
      t: "Exploratory",
      d: "The arithmetic runs, but this cohort is thin and the estimate is leaning on priors rather than your own resolved outcomes. Use it to shape a question, not to allocate capital — the next step is a controlled test.",
    },
    directional: {
      t: "Directional",
      d: "Enough resolved evidence to compare options and size a test. Still an estimate under a stated lift assumption, not a measured effect — run a controlled rollout before committing capital.",
    },
  };

  let current = "financing";

  function render() {
    const r = run({
      offer: current,
      population: parseInt(el.pop.value, 10),
      baseRate: parseFloat(el.rate.value) / 100,
      avgDeal: parseInt(el.deal.value, 10),
    });

    // inputs echo
    el.popV.textContent = r.n.toLocaleString("en-US");
    el.rateV.textContent = pct(r.baseRate);
    el.dealV.textContent = usd(r.avgDeal);

    // evidence mix
    const w = r.weights;
    el.mix.querySelector(".mix-seg--co").style.width = w.company * 100 + "%";
    el.mix.querySelector(".mix-seg--ind").style.width = w.industry * 100 + "%";
    el.mix.querySelector(".mix-seg--syn").style.width = w.synthetic * 100 + "%";
    el.mixCo.textContent = Math.round(w.company * 100) + "%";
    el.mixInd.textContent = Math.round(w.industry * 100) + "%";
    el.mixSyn.textContent = Math.round(w.synthetic * 100) + "%";

    const abstain = r.readiness === "abstain";

    // current policy — observed, so it is shown even when Fate abstains
    el.baseRev.textContent = usd(r.baseRevenue);
    el.baseRate.textContent = pct(r.baseRate);
    el.baseConv.textContent = String(r.baseConversions);
    el.baseGp.textContent = usd(r.baseGP);

    // scenario — withheld entirely on abstain
    const hide = "—";
    el.scnRev.textContent = abstain ? hide : usd(r.scenario.revenue);
    el.scnRate.textContent = abstain ? hide : pct(r.scenario.rate);
    el.scnConv.textContent = abstain ? hide : String(r.scenario.conv);
    el.scnGp.textContent = abstain ? hide : usd(r.scenario.gp);

    const revDelta = r.scenario.revenue - r.baseRevenue;
    el.scnRevD.textContent = abstain ? "no estimate" : signed(revDelta);
    el.scnRevD.className =
      "sim-delta " + (abstain ? "is-flat" : revDelta > 0 ? "is-up" : revDelta < 0 ? "is-down" : "is-flat");

    const gpDelta = r.scenario.gp - r.baseGP;
    el.scnGp.className = "mpair-v" + (abstain ? "" : gpDelta > 0 ? " is-up" : gpDelta < 0 ? " is-down" : "");
    el.scnRate.className = "mpair-v" + (abstain ? "" : r.scenario.rate > r.baseRate ? " is-up" : "");
    el.scnConv.className = "mpair-v" + (abstain ? "" : r.scenario.conv > r.baseConversions ? " is-up" : "");

    // the interval
    if (abstain) {
      el.p10.textContent = el.p50.textContent = el.p90.textContent = hide;
      el.band.style.width = "0%";
      [el.t10, el.t50, el.t90].forEach((t) => (t.style.opacity = "0"));
    } else {
      [el.t10, el.t50, el.t90].forEach((t) => (t.style.opacity = "1"));
      el.p10.textContent = usdK(r.p10);
      el.p50.textContent = usdK(r.p50);
      el.p90.textContent = usdK(r.p90);
    }
    el.pbase.textContent = usdK(r.baseGP);

    // The rail is anchored at zero and scaled to the top of the interval, not
    // fitted to the interval itself. Fitting made every band render at the
    // same width, which is exactly backwards for a chart whose whole job is
    // to show that thin evidence produces a wider range.
    const top = abstain ? r.baseGP * 1.6 : Math.max(r.p90, r.baseGP) * 1.15;
    const at = (v) => clamp((v / (top || 1)) * 100, 0, 100);

    if (!abstain) {
      const a = at(r.p10), b = at(r.p90);
      el.band.style.left = a + "%";
      el.band.style.width = Math.max(0, b - a) + "%";
      el.t10.style.left = a + "%";
      el.t50.style.left = at(r.p50) + "%";
      el.t90.style.left = b + "%";
    }
    el.tbase.style.left = at(r.baseGP) + "%";

    el.downside.textContent = abstain ? hide : pct(r.downside, 0);
    el.conf.textContent = abstain
      ? "Insufficient"
      : `${r.confLabel} · ${r.confidence} / 100`;
    el.lift.textContent = abstain ? hide : "+" + pct(r.blendedLift);
    el.sens.textContent = abstain ? hide : `${usdK(r.sensLow.gp)} / ${usdK(r.sensHigh.gp)}`;

    // readiness
    const copy = READINESS_COPY[r.readiness];
    el.readiness.dataset.state = r.readiness;
    el.readinessT.textContent = copy.t;
    el.readinessD.textContent = copy.d;

    // assumptions — the cohort-dependent ones first, then the offer's own
    const lines = [];
    lines.push(
      `Relative lift of ${(r.blendedLift * 100).toFixed(1)}% is a blended prior — ${Math.round(w.company * 100)}% company, ${Math.round(w.industry * 100)}% industry, ${Math.round(w.synthetic * 100)}% synthetic — not a measured treatment effect.`
    );
    lines.push(
      `Baseline is the observed close rate of ${pct(r.baseRate)} across ${r.n.toLocaleString("en-US")} matching opportunities (${r.wins} resolved wins). Association, not causation.`
    );
    lines.push(
      `Gross margin of ${pct(HISTORICAL_MARGIN, 0)} is carried from won deals; the scenario applies ${pct(r.scenarioMargin, 1)} after the offer's margin cost.`
    );
    r.offer.assumptions.forEach((a) => lines.push(a));
    lines.push(
      "The interval carries uncertainty in the baseline rate and the lift assumption only — not deal value, timing, seasonality, seller effects or delivery capacity."
    );
    el.assume.innerHTML = "";
    lines.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      el.assume.appendChild(li);
    });
  }

  el.offers.forEach((btn) => {
    btn.addEventListener("click", () => {
      current = btn.dataset.offer;
      el.offers.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      render();
    });
  });
  [el.pop, el.rate, el.deal].forEach((input) => {
    input.addEventListener("input", render);
  });

  render();
})();

/* ============================================================
   BYLDA — motion layer

   Motion on this page narrates, it does not decorate. Four pieces:

   1. The event field behind the hero. The page's primitive, drawn: an
      event appears, its consequence resolves nearby, an edge joins them,
      the pair settles into the field and fades. That is the whole thesis
      running in the background before a word is read.
   2. The headline reveals a line at a time.
   3. The hero card settles — its interval draws outward from the median
      and its figures count up — so the card reads as a result arriving
      rather than a screenshot.
   4. The flywheel's three bars start at the widest interval and close
      into place, so the compounding claim happens on screen.

   Everything here is gated on prefers-reduced-motion and on visibility:
   nothing animates in a background tab, and the canvas stops entirely
   once the hero scrolls away.
   ============================================================ */
(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ---------- 1. the event field ----------
     Positions are normalised (0..1) and multiplied up at draw time, so a
     resize rescales the field instead of re-randomising it — the same
     reason os.js does it for the particle canvas. */
  if (!reduced) (() => {
    const cv = $("#eventfield");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, running = true, raf = 0, live = false;

    const cs = getComputedStyle(document.body);
    const chan = (n, f) => (cs.getPropertyValue(n).trim() || f);
    const INK = chan("--particle-ink", "140 150 180");
    const BLUE = chan("--particle-blue", "138 156 255");

    // One item is a full event → consequence → edge → fade cycle. Each gets
    // its own period and phase so the field never pulses in unison.
    const COUNT = () => clamp(Math.round(W / 54), 11, 30);
    let items = [];

    function make() {
      const x = 0.06 + Math.random() * 0.88;
      const y = 0.08 + Math.random() * 0.84;
      const ang = Math.random() * Math.PI * 2;
      const len = 0.045 + Math.random() * 0.075;
      return {
        x, y,
        // the consequence sits a short way off, in a random direction
        cx: clamp(x + Math.cos(ang) * len, 0.03, 0.97),
        cy: clamp(y + Math.sin(ang) * len * 0.72, 0.04, 0.96),
        period: 9.5 + Math.random() * 8,
        offset: Math.random() * 18,
        r: 1.1 + Math.random() * 1.1,
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

    function draw(now) {
      raf = 0;
      if (!running) return;
      if (!W || !H) { if (!size()) { schedule(); return; } }
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);

      for (const it of items) {
        const age = (t + it.offset) % it.period;

        // Envelope: in over 1.2s, hold, out over the last 3s of the cycle.
        const fadeIn = clamp(age / 1.2, 0, 1);
        const fadeOut = clamp((it.period - age) / 2.4, 0, 1);
        const env = Math.min(fadeIn, fadeOut);
        if (env <= 0.001) continue;

        const ex = it.x * W, ey = it.y * H;
        const cxp = it.cx * W, cyp = it.cy * H;

        // The consequence resolves after the event, and the edge is drawn
        // only once both ends exist — an event with no outcome is not yet
        // evidence, which is the point the whole page is making.
        const cons = clamp((age - 1.9) / 1.1, 0, 1);
        const edge = clamp((age - 2.6) / 1.3, 0, 1);

        if (edge > 0) {
          const p = easeOut(edge);
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex + (cxp - ex) * p, ey + (cyp - ey) * p);
          ctx.strokeStyle = `rgb(${BLUE} / ${0.42 * env})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // the event
        ctx.beginPath();
        ctx.arc(ex, ey, it.r, 0, 7);
        ctx.fillStyle = `rgb(${INK} / ${0.55 * env})`;
        ctx.fill();

        // the consequence, with a single pulse as it resolves
        if (cons > 0) {
          const pulse = 1 + Math.sin(clamp((age - 3.6) / 1.1, 0, 1) * Math.PI) * 1.5;
          const a = easeOut(cons) * env;
          ctx.beginPath();
          ctx.arc(cxp, cyp, it.r * 1.25 * pulse, 0, 7);
          ctx.fillStyle = `rgb(${BLUE} / ${0.8 * a})`;
          ctx.fill();
          if (pulse > 1.04) {
            ctx.beginPath();
            ctx.arc(cxp, cyp, it.r * 4.5 * pulse, 0, 7);
            ctx.strokeStyle = `rgb(${BLUE} / ${0.26 * a * (2 - pulse)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
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

  /* ---------- 2. figures that count up ----------
     The final text is what lives in the DOM, so the page is correct with
     JavaScript off and correct again the moment the animation ends. The
     number is parsed back out of it rather than duplicated in an
     attribute, which keeps copy edits from silently desyncing. */
  function countUp(el, delay) {
    const text = el.textContent.trim();
    const m = text.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const [, pre, rawNum, post] = m;
    const target = parseFloat(rawNum.replace(/,/g, ""));
    if (!isFinite(target)) return;
    const decimals = (rawNum.split(".")[1] || "").length;
    const grouped = rawNum.includes(",");
    const render = (v) =>
      pre +
      v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouped,
      }) +
      post;

    el.textContent = render(0);
    const dur = 1100;
    let t0 = 0;
    const step = (now) => {
      if (!t0) t0 = now;
      const p = clamp((now - t0) / dur, 0, 1);
      el.textContent = render(target * easeOut(p));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = text; // land on the authored string exactly
    };
    setTimeout(() => requestAnimationFrame(step), delay);
  }

  if (!reduced) {
    const ticks = $$(".hero-stage .tick");
    if (ticks.length) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          obs.disconnect();
          ticks.forEach((el, i) => countUp(el, 520 + i * 70));
        });
      }, { threshold: 0.15 });
      io.observe($(".hero-stage"));
    }
  }

  /* ---------- 3. the flywheel's bars close on screen ----------
     All three start at the widest interval. Watching two of them shrink is
     the compounding claim; asserting it in a caption is not. */
  (() => {
    const bands = $$(".narrow-band[data-w]");
    if (!bands.length) return;
    const settle = () => bands.forEach((b, i) => {
      setTimeout(() => {
        b.style.left = b.dataset.l + "%";
        b.style.width = b.dataset.w + "%";
      }, reduced ? 0 : 220 + i * 260);
    });
    if (reduced) { settle(); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        settle();
      });
    }, { threshold: 0.4 });
    io.observe($(".narrow"));
  })();
})();
