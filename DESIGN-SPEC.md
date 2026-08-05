# Bylda OS — Design Specification

The marketing site for Bylda, the AI Sales Operating System. Visitors should not
feel they are reading a SaaS landing page. They should feel they have entered the
operating system itself: dark, quiet, precise, and already running before they
arrived.

This document is the reference for how the site is built and how to extend it.

---

## 1. Principle

Three rules govern every decision on this site.

**The product is invisible, so the site must be too.** Bylda's promise is that a
rep never opens it. The site mirrors that: no dense dashboards, no feature grids
competing for attention, no interface screenshots pretending to be the value. The
UI shown is always the *output* of work already done.

**Motion is narration, not decoration.** Every animation advances the story —
tasks pile up and get absorbed, a call becomes structure, structure becomes a
written field. Nothing moves to prove the site can move.

**The logo is the visual language.** The silver ribbon ghost is not a mark placed
in a corner. Its materials — brushed aluminium, chrome, fog, liquid metal — are
the entire palette, and the ribbon form recurs as background geometry, section
transitions, and the absorbing body in the problem sequence.

---

## 2. Brand

| | |
|---|---|
| Company | Bylda |
| Category | AI Sales Operating System |
| Mission | Every salesperson gets an AI Sales Operator. |
| Promise | Stop managing CRM. Start selling. |

### Colour

| Token | Value | Use |
|---|---|---|
| `--ink` | `#070707` | Page ground. Never pure black. |
| `--ink-2` / `--raise` | `#0b0c0f` / `#0e0f13` | Raised surfaces, window bodies |
| `--silver` | `#dadce5` | Primary text, the ribbon itself |
| `--silver-2` | `#a9aebd` | Secondary text |
| `--dim` | `#82879a` | Labels, captions, mono metadata |
| `--blue` | `#8fa8ff` | The single accent. Intelligence, activity, focus |
| `--blue-deep` | `#5f7bf5` | Gradient partner for `--blue` |
| `--good` / `--warn` / `--risk` | `#7fd8a8` / `#e8c47e` / `#e89a8e` | Signal states only — never decoration |

Colour discipline: the palette is monochrome silver-on-black with **one** accent.
Signal colours appear only where they carry meaning (a risk chip, a health meter).
If a colour is not saying something, it is not on the page.

### Material

Surfaces are built from four layers, always in this order:

1. **Ground** — near-black, with slow-drifting fog blobs beneath everything
2. **Glass** — `rgba(255,255,255,0.02)` fill, hairline `rgba(218,220,229,0.09)` border, 10px backdrop blur
3. **Specular** — a radial highlight that follows the pointer (`--gx` / `--gy`)
4. **Grain** — a fixed 5%-opacity fractal-noise overlay across the whole page

The grain is what makes the black read as film rather than as `#000` in a browser.
It is the cheapest and most important detail on the site.

### Typography

| Role | Family | Notes |
|---|---|---|
| Display & headings | Instrument Serif | Large, optical, `-0.015em` tracking. Italic + gradient for the emphasised phrase |
| Body & UI | Inter | 400/500/600 only |
| Machine voice | JetBrains Mono | AI output, timestamps, system labels, field names, kickers |

The monospace is load-bearing. It is how the site signals "this is the machine
speaking" — every extracted field, every timestamp, every status line. Never use
it for prose.

Headline pattern: a plain clause, then an emphasised one.
> Stop managing CRM. *Start selling.*
> Salespeople should sell. *Not manage software.*

The emphasised half is `<em>` inside the heading, which picks up italic serif plus
a silver-to-blue gradient clip.

---

## 3. Sitemap

```
/                              Landing — the full narrative arc
├── /product                   Workflow demonstration + surfaces
├── /how-it-works              The four acts, in depth
├── /integrations              Architecture + directory
├── /solutions                 By role: AE, Manager, RevOps, Leadership
├── /security                  Posture, commitments, questions
├── /pricing                   Tiers, ROI calculator, FAQ
├── /customers                 Outcomes and stories
├── /blog                      Essays
│   ├── /blog/ai-sales-operating-system
│   ├── /blog/crm-adoption-was-never-a-training-problem
│   └── /blog/conversation-intelligence-is-not-the-product
└── /book-demo                 Conversion
```

Legal pages (`/privacy`, `/terms`) and `/about`, `/contact` remain from the
previous site and still use the legacy design system.

---

## 4. Page wireframes

### `/` — Landing

The landing page is one continuous story, not a stack of sections. Each block
hands off to the next.

```
┌─ HERO ────────────────────────────────── 100svh, ghost materialises from fog
│  fog blobs · ribbon SVG field · particle canvas
│  ghost mark (blur 28px → 0 over 2.4s) + breathing halo
│  kicker → headline → lede → dual CTA, staggered rise
│  scroll cue
│  ON SCROLL: content fades + blurs upward, mark scales, particles accelerate
├─ TRUST ───────────────────────────────── logo marquee, masked at both edges
├─ THE PROBLEM ─────────────────────────── 340vh sticky "task storm"
│  0.0–0.5  46 CRM chips fly in and pile up, jittering
│  0.5–0.6  the ghost fades in behind them
│  0.6–0.86 everything converges to centre and is absorbed
│  0.84–1.0 "Salespeople should sell. Not manage software."
├─ HOW IT WORKS ────────────────────────── 460vh horizontal scroll, 4 scenes
│  01 Listening   waveform + live transcript
│  02 Understanding  highlighted quotes, signal chips, deal score
│  03 Executing   CRM rows filling, "fields typed by you: 0"
│  04 Morning Brief  tomorrow, already prepared
├─ PRODUCT COLLAGE ─────────────────────── 4 oversized windows, parallax + tilt
├─ METRICS ─────────────────────────────── 4 counters, count up on entry
├─ INTEGRATIONS TEASER ─────────────────── copy + 6 node tiles
├─ QUOTE ───────────────────────────────── single large serif testimonial
├─ SECURITY STRIP ──────────────────────── compliance chips
└─ FINAL CTA ───────────────────────────── ghost + closing headline
```

### `/product` — Demonstrate, don't describe

The centrepiece is the **live replay**: a self-running, looping sequence of the
seven steps Bylda executes after a call. The left column is the step list; the
right column is a sticky stack of windows that light up and type themselves in
as their step fires.

```
page hero
replay      ┌ step list (7) ┐ ┌ sticky windows: extraction → CRM → follow-up ┐
surfaces    3 alternating split rows (Morning Brief / Deal Intel / Call Summary)
flow        vertical mono pipeline with travelling pulse
CTA
```

### `/how-it-works` — Four acts

Summary cards (4) → one full split section per act → a timeline for the overnight
preparation → CTA. Act 2 and 4 mirror their layout so the eye zig-zags down.

### `/integrations`

Orbit diagram (3 counter-rotating rings around the ghost, chips pinned at the
edges) beside the architecture copy → 18-tile directory → CTA.

### `/solutions`

Four split rows, one per role, alternating side. Each pairs copy with a proof
surface — a metric card, a team dashboard, a completeness comparison, a forecast.

### `/security`

Six posture cards → isolation commitments beside a compliance window → accordion
of the five questions security teams actually ask → CTA.

### `/pricing`

Billing toggle → three tiers (middle emphasised) → **ROI calculator** → FAQ
accordion → CTA.

### `/customers`

Four counters → three story splits, each ending in a pull quote → logo marquee.

### `/blog`

Three-column card grid; articles use a 42em `.prose` column with serif headings,
a mid-article product card, and a two-up "keep reading".

### `/book-demo`

Form beside a "what actually happens" timeline. On submit, the form is replaced
by a confirmation state carrying the ghost.

---

## 5. Component system

All components live in `os.css`. There is no framework and no build step.

### Layout
`.wrap` (1180px) · `.wrap-wide` (1360px) · `.section` · `.section--tight` ·
`.section-head` · `.grid-2/3/4` · `.split` · `.hr`

### Type
`.display` · `.h2` · `.h3` · `.lede` · `.kicker` (mono, with gradient rule) ·
`.mono` · `.quote` · `.metric-num` · `.prose`

### Surfaces
- `.glass` — the base card. Pointer-tracked specular via `--gx`/`--gy`.
- `.window` — the cinematic product surface. Title bar with dots, status chip,
  and a reflection sweep that fires on hover and on entry.
- `.window-body` internals: `.w-line` (label/value), `.w-row` (filling field),
  `.w-label`, `.w-value--mono`, `.w-check`
- `.node` — integration tile with an engraved glyph
- `.post` — blog card

### Signal
`.chip` with `--blue` / `--good` / `--warn` / `--risk` modifiers · `.meter` with
`.meter-bar` (scales from 0 on entry) · `.sysline` with pulsing dot · `.wave`
(28 animated bars) · `.msg` transcript bubbles with `<mark>` highlight

### Interactive
`.acc` accordion · `.toggle` billing switch · `.field` inputs · `input[type=range]`
with a gradient-filled track · `.btn--solid` (brushed aluminium) / `.btn--ghost` /
`--sm` / `--lg` · `.link-arrow`

### Scenes
`.storm` · `.hscroll` / `.hs-track` / `.hs-scene` · `.collage` · `.replay` /
`.rp-step` · `.orbit` · `.timeline` · `.flow` · `.marquee`

---

## 6. Motion specification

Implemented in `os.js` — vanilla, dependency-free, ~330 lines. Every module
mounts only if its DOM is present and stands down under
`prefers-reduced-motion: reduce`.

### Timing
| Token | Value | Use |
|---|---|---|
| `--ease` | `cubic-bezier(.22,1,.36,1)` | Everything entering. Fast out, long settle |
| `--ease-io` | `cubic-bezier(.65,0,.35,1)` | Ambient loops, fog, ribbons |
| `--dur` | `0.9s` | Reveal duration |
| stagger | `0.06–0.10s` | Between siblings |

Nothing on this site uses a linear ease except infinite marquees and orbits.

### Scroll architecture
A single `requestAnimationFrame` loop drives every scroll-linked scene. Scenes
register a callback in a shared `scenes[]` array; scroll and resize request one
frame. There is never more than one rAF loop running for layout.

Discrete reveals use `IntersectionObserver` instead, and unobserve after firing —
they are one-shot and must not cost anything afterwards.

### The modules

**Reveal** — `[data-reveal]` translates up 34px, blurs 6px, fades in. Variants
`left` / `right` / `scale`. `[data-mask]` wipes children up from 110%.
`[data-stagger]` on a parent distributes `--d` delays to its children.

**Hero dissolve** — scroll 0 → 85vh maps to a progress `p`. Content opacity
`1 - 1.25p`, translate `-70p` px, blur `7p` px; the mark scales to `1.55×`; the
particle field's upward velocity multiplies by `1 + 7p`. The ghost does not fade
so much as accelerate apart.

**Particles** — canvas, ~110 drifting motes (28% blue), DPR-capped at 2, paused
by `IntersectionObserver` when off-screen.

**Task storm** — 46 chips, each with a resting position, an arrival threshold
staggered across the first half of the scroll, and a per-chip sine jitter. Two
overlapping phases: arrival (`0 → 0.5`) and absorption (`0.62 → 0.86`), where
positions lerp to centre with `pow(absorb, 1.4)` easing and scale to zero. The
ghost pulses once as it swallows them.

**Horizontal storytelling** — a 460vh section with a sticky viewport; scroll
progress translates the track by `p × (scrollWidth - clientWidth)`. Scenes get
`.is-on` as they pass, which cascades their copy and visual in.

**Parallax** — `[data-plx="0.35"]`; offset from viewport centre × factor, skipped
entirely when the element is more than 200px outside the viewport.

**Tilt & pointer light** — `[data-tilt]` gives ±5°/6° rotation, rAF-throttled.
Any `.glass` or `.window` under the pointer receives `--gx`/`--gy`, moving its
specular highlight. Both are fine-pointer only.

**Counters** — `[data-count="6.5"]` eases out quartic over 1.7s, preserving the
attribute's decimal precision.

**Replay** — steps fire on their own `data-rp-delay` cadence, then the whole
sequence restarts after 5.2s. `.rp-type` elements type their `data-text`
character by character with jittered intervals.

**Typewriter** — `[data-type="a | b | c"]` cycles phrases with a 2.1s hold.

Also: accordion (measured `scrollHeight`), billing toggle, ROI calculator, demo
form confirmation, range-fill tracking, `[data-year]`.

### Reduced motion
The media query kills all animation and transition duration, forces every reveal
to its final state, removes the grain, and gives the task storm and horizontal
scroll static fallback compositions — the storm shows a modest pile with the
headline already resolved, and the four scenes all render `.is-on`. The story
still reads; it just does not move.

---

## 7. React / Framer implementation notes

The site ships as static HTML because it is a marketing site and should cost
nothing to serve. If it is ported:

### React / Next.js
- `os.css` is framework-agnostic. Keep it, or convert tokens to CSS variables in
  a Tailwind theme — do not translate the component classes into utility soup.
- Replace `IntersectionObserver` reveal with a `useInView` hook, but keep the
  **one shared rAF loop** for scroll-linked scenes. Multiple independent scroll
  listeners is the single most common way these sites get janky.
- The task storm and horizontal scroll should become `useScroll` +
  `useTransform` (Framer Motion). Map exactly the same progress windows given
  above so the choreography is preserved.
- Windows, chips, meters and nodes are the natural component boundaries. The
  `w-*` internals are a small primitive set — build them as
  `<Window.Line>`, `<Window.Row>`, `<Window.Meter>`.
- Keep the canvas particle field imperative. Do not render 110 motes as React
  nodes.

### Framer
- Build the storm as a Scroll Section with a pinned frame; drive chips through a
  single Override reading `useTransform` on section progress.
- The horizontal scenes map directly onto Framer's horizontal scroll section with
  sticky pinning.
- Use Appear Animations for `[data-reveal]` equivalents, `0.9s`, custom easing
  `.22, 1, .36, 1`, with a 60–100ms stagger.

### 3D scene ideas
Deliberately not shipped — WebGL was not worth the weight for the current pages.
If added, in priority order:

1. **Hero ribbon** — a `MeshTransmissionMaterial` ribbon extruded along a Catmull-
   Rom curve, slowly torsioning, lit by one key and one rim light. The ghost stays
   2D in front of it. This is the highest-value addition.
2. **Particle dissolve** — GPU points sampled from the ghost's alpha mask, with a
   curl-noise displacement driven by scroll. Replaces the 2D canvas at the moment
   the ghost breaks apart.
3. **Integration orbit** — instanced tiles on three orbital rings with real depth
   and DOF, replacing the CSS orbit.
4. **Liquid metal transitions** — a full-screen shader between page routes,
   distorting the outgoing frame through a chrome normal map.

Guardrail: the site currently renders a full hero in under a second with no
JavaScript dependency. Any 3D must lazy-load behind an idle callback, must not
block first paint, and must have a static poster fallback.

### Product illustration concepts
The windows on this site are real DOM, not images — they stay sharp, animate, and
cost nothing. Keep it that way. If richer visuals are needed: render the same DOM
at 2× into flat PNGs for OG images only, never for the page itself.

---

## 8. SEO architecture

### Target map

| Page | Primary | Secondary |
|---|---|---|
| `/` | AI Sales Operating System | AI sales software, sales AI |
| `/product` | AI sales agent | conversation intelligence, AI follow-ups |
| `/how-it-works` | CRM automation | automatic CRM updates, sales automation |
| `/integrations` | Salesforce AI integration | HubSpot AI, CRM sync |
| `/solutions` | sales productivity | revenue intelligence, sales coaching software |
| `/security` | AI sales security | SOC 2 sales AI, sales data privacy |
| `/pricing` | AI sales software pricing | conversation intelligence pricing |
| `/customers` | revenue intelligence | pipeline intelligence |
| `/blog` | (topical authority hub) | — |

### Implementation
- One `<h1>` per page, carrying the primary term naturally. No stuffing — copy
  quality is the ranking asset here.
- Titles are `Page — Bylda AI Sales Operating System`, kept under 60 characters
  where possible; descriptions 150–160 characters and written as sales copy, not
  keyword lists.
- Canonicals on every page; `cleanUrls` in `vercel.json` serves extensionless
  paths, and canonicals match the extensionless form.
- Structured data: `Organization` + `WebSite` + `SoftwareApplication` on `/`,
  `HowTo` on `/how-it-works`, `Product` with offers on `/pricing`,
  `BlogPosting` on each article, `BreadcrumbList` elsewhere.
- `sitemap.xml` regenerated with the new architecture; `robots.txt` unchanged.
- Internal linking: every page links to `/book-demo` at least twice and to two
  sibling pages contextually. Articles link to `/product` through the mid-article
  card and to each other through "keep reading".

### Content strategy
The blog is positioned as argument, not SEO filler. Three essays establish the
category thesis — that an AI Sales Operating System is a distinct layer, that CRM
adoption is structural rather than behavioural, and that conversation intelligence
without execution is incomplete. Each is written to be *cited*, which is what
actually earns links.

---

## 9. Conversion optimisation

**One primary action, everywhere.** Book Demo. Every page terminates in it; the
nav carries it persistently; `Watch Product Tour` is the secondary that routes to
`/product#demo` rather than a video modal, so the tour is a page we control.

**Demonstration over description.** The replay, the ROI calculator, and the task
storm all let a visitor *experience* the claim before reading it. The strongest
conversion asset on the site is the moment the chips get absorbed.

**Specificity as proof.** Every number is attributed and every quote is
attributed to a role. `6.5 hrs`, `96.4%`, `41.2%` outperform "dramatically
improve" because they invite verification.

**The ROI calculator is the qualification tool.** It reframes the purchase as
recovering money already being spent. Its CTA — *Get this modeled on your
numbers* — is deliberately lower-commitment language than "Book a demo" while
routing to the same place.

**Objection handling before the ask.** Pricing and security both end in an
accordion that answers the real blockers, including the uncomfortable ones
(*Do we still need Gong?*, *What if our CRM is a mess?*). The demo page states
what the thirty minutes contain, minute by minute, and promises "no sequence, no
drip" — removing the cost of the click.

**Friction removal.** The demo form is six fields, five of which are pre-filled or
select-based. The only open text field is optional, and it is phrased as a
complaint prompt — *What is the most annoying part of your week?* — which is far
easier to answer than "tell us about your needs".

---

## 10. File map

```
index.html            Landing
product.html          how-it-works.html    integrations.html   solutions.html
security.html         pricing.html         customers.html      book-demo.html
blog/index.html       blog/*.html          (3 essays)

os.css                Design system + scenes  (~1,300 lines)
os.js                 Motion engine           (~330 lines)
brand/
  ghost-original.png  Source artwork as supplied
  ghost-mark.png      1000px, transparent — hero and section use
  ghost-mark-black.png 1400px, on-black — reference
  ghost-icon-256.png  Nav, footer, apple-touch-icon
  ghost-icon-64.png   Favicon

scripts/assemble-site.mjs   Copies the static site into dist/
sitemap.xml                 Regenerated for the new architecture
```

The legacy site (`style.css`, `design-system.css`, `galaxy.css`, `solar.css`,
`cinematic.css` and the pages that use them) is untouched and still served. It is
not part of this design system and shares nothing with it.
