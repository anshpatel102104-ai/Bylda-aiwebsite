# Bylda OS — Design Specification

The marketing site for Bylda, the AI Sales Operating System. Visitors should not
feel they are reading a SaaS landing page. They should feel they have entered the
operating system itself: bright, quiet, precise, and already running before they
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
| Mission | Every salesperson gets a Phantom. |
| Promise | Stop managing CRM. Start selling. |

### Colour

The site is light. Paper white ground, near-black ink, polished chrome, one blue.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#fbfbfd` | Page ground. Cool white, never `#fff` |
| `--paper-2` | `#f3f4f8` | Recessed bands — the storm, the footer |
| `--raise` | `#ffffff` | Cards and windows sit *above* the ground |
| `--ink` | `#0b0c10` | Headings, values, primary text |
| `--ink-2` | `#2a2e38` | Body copy |
| `--slate` | `#565c6b` | Lede and secondary text |
| `--dim` | `#6b7180` | Labels, captions, mono metadata |
| `--blue` | `#4358d8` | The single accent. Intelligence, activity, focus |
| `--blue-soft` / `--blue-deep` | `#6e80f0` / `#2f42b8` | Gradient partners |
| `--good` / `--warn` / `--risk` | `#1a7d53` / `#8f6417` / `#c64a3c` | Signal states only — never decoration |

Colour discipline: monochrome ink-on-paper with **one** accent. Signal colours
appear only where they carry meaning (a risk chip, a health meter). If a colour
is not saying something, it is not on the page.

**Contrast is checked, not assumed.** Every text token clears WCAG AA against the
paper ground: ink 18.9:1, ink-2 13.1:1, slate 6.5:1, dim 4.7:1, blue 5.6:1, and
the three signal colours 4.6–5.1:1. The signal and dim values are deliberately
darker than they would be on a dark ground — the same hues at dark-theme
lightness fail badly on white, which is the most common way a light rebuild
quietly breaks.

### Material

On a dark ground, depth comes from glow. On a light ground it comes from
**shadow** — so elevation is the load-bearing system here, not luminosity.

Surfaces are built from four layers, always in this order:

1. **Ground** — cool paper white, with slow-drifting fog blobs beneath everything
2. **Surface** — white fill, hairline `rgba(11,12,16,0.075)` border, and a
   two-part shadow (`--sh-sm` / `--sh` / `--sh-lg`): a tight 1–2px contact
   shadow plus a wide, soft ambient one. The contact shadow is what makes a card
   feel like it is resting on the page rather than floating in a void.
3. **Specular** — a radial blue-tinted highlight that follows the pointer
   (`--gx` / `--gy`)
4. **Grain** — a fixed 2.2%-opacity fractal-noise overlay across the whole page

The grain is set far lower than it would be on black. At dark-theme strength it
reads as dirt on white; at 2.2% it reads as paper, and it is what stops the
ground looking like an empty browser canvas.

### The mark on a light ground

The supplied artwork is a chrome ribbon enclosing a **black** ghost, rendered on
black. Keying transparency by luminance — the obvious approach — makes the
ghost's body transparent, which is invisible on white and destroys the logo.

`brand/ghost-mark.png` is therefore built with a **flood fill** from the image
border through near-black pixels: only the region actually connected to the
outside becomes transparent, so the enclosed ghost body stays opaque. The result
reads better on paper than it ever did on black — solid black ghost, bright
chrome ribbon.

The dark-ground variants are kept as `ghost-mark-dark.png` and
`ghost-icon-dark-*.png` in case a dark surface is ever needed.

At display size the mark carries a drop shadow (`.orbit-core`, `.storm-ghost`)
so the chrome has something to sit against.

At nav and footer size the icon is used plain, next to the wordmark — it stays
legible down to 30px.

The mark is deliberately **not** used in the hero. Above the headline it
competed with the type instead of framing it. The hero's brand presence is the
fog, the ribbon SVG field, and the particle canvas — the same design language,
expressed as atmosphere rather than as a resized copy of the logo. If a hero
graphic returns, it should be a purpose-drawn element, not the mark scaled up.

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

29 pages are deployed. Everything from the previous positioning lives in
`legacy/` — kept in the repo, excluded from the build, 301'd at the edge.

```
/                              Landing — the full narrative arc
├── Product
│   ├── /product               Workflow demonstration + surfaces
│   ├── /how-it-works          The four acts, in depth
│   ├── /integrations          Architecture + directory
│   ├── /pricing               Tiers, ROI calculator, FAQ
│   └── /changelog             What shipped
├── Solutions (SEO pillars)
│   ├── /crm-automation        Pillar — CRM automation
│   ├── /conversation-intelligence  Pillar — conversation intelligence
│   ├── /ai-sales-agent        Pillar — AI sales agent
│   ├── /solutions             By role: AE, Manager, RevOps, Leadership
│   └── /customers             Outcomes and stories
├── Compare (commercial intent)
│   ├── /gong-alternative      Bylda vs Gong
│   └── /clari-alternative     Bylda vs Clari
├── Company
│   ├── /about                 Why this exists
│   ├── /careers               Open roles
│   ├── /contact               Routed contact
│   ├── /security              Posture, commitments, questions
│   └── /faq                   12 answers, FAQPage-marked
├── /blog                      Essays and playbooks
│   ├── /blog/ai-sales-operating-system
│   ├── /blog/crm-adoption-was-never-a-training-problem
│   ├── /blog/conversation-intelligence-is-not-the-product
│   ├── /blog/crm-automation-workflows
│   └── /blog/how-to-automate-follow-ups
├── /book-demo                 Conversion
└── Utility
    ├── /sitemap               HTML sitemap
    ├── /privacy  /terms       Legal, rewritten for this product
    └── /404                   noindex
```

Machine-readable siblings: `/sitemap.xml` (derived from the filesystem),
`/robots.txt`, and `/llms.txt` for AI answer engines.

---

## 4. Page wireframes

### `/` — Landing

The landing page is one continuous story, not a stack of sections. Each block
hands off to the next.

```
┌─ HERO ────────────────────────────────── 100svh, type materialises from fog
│  fog blobs · ribbon SVG field · particle canvas
│  kicker → headline → lede → dual CTA, staggered rise
│  scroll cue
│  ON SCROLL: content fades + blurs upward, particles accelerate
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
with a gradient-filled track · `.btn--solid` (near-black, the one dark object on
the page) / `.btn--ghost` (white, hairline border) / `--sm` / `--lg` ·
`.link-arrow`

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
`1 - 1.25p`, translate `-70p` px, blur `7p` px; the particle field's upward
velocity multiplies by `1 + 7p`. The hero does not fade so much as accelerate
apart.

**Particles** — canvas, ~110 drifting motes (28% blue), DPR-capped at 2, paused
by `IntersectionObserver` when off-screen. On the light ground the motes are
drawn *dark* — `rgba(67,88,216,·)` and `rgba(90,96,112,·)` at low alpha — so
they read as suspended dust rather than sparks.

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

### The problem this had to solve first

Technical tags were never the bottleneck. The site carried 76 pages, and 63 of
them described a **different company** — an "AI Operating System for ambitious
founders" selling lead generation to dentists, roofers, and med spas. Against
that, 13 pages arguing "AI Sales Operating System" were outnumbered five to one.

No amount of meta-description polish survives that. Search engines resolve what a
domain is *about* from the aggregate, and the aggregate said local-business
automation. Every new page was competing against its own site for topical
authority.

So the first SEO act was subtraction.

### Retiring the legacy corpus

52 pages plus the entire legacy stylesheet and script set moved to `legacy/`.
They are **kept in the repo** and **excluded from the build**, so nothing is lost
and nothing is served. Their URLs are 301'd to the closest live equivalent — 88
redirects in `vercel.json`, verified to have no dead destinations, no chains, and
no live file shadowing a redirect source.

Two legacy blog URLs were worth keeping for their equity and were rewritten from
scratch on-topic rather than redirected:
`/blog/crm-automation-workflows` and `/blog/how-to-automate-follow-ups`.

The deployed site is now 29 pages, all saying the same thing.

### Target map

| Page | Primary keyword | Intent |
|---|---|---|
| `/` | AI Sales Operating System | category |
| `/product` | AI sales software | evaluation |
| `/how-it-works` | how AI updates CRM | evaluation |
| `/crm-automation` | CRM automation | **pillar — high volume** |
| `/conversation-intelligence` | conversation intelligence | **pillar — high volume** |
| `/ai-sales-agent` | AI sales agent | **pillar — high volume** |
| `/gong-alternative` | Gong alternative | **comparison — high commercial intent** |
| `/clari-alternative` | Clari alternative | **comparison — high commercial intent** |
| `/integrations` | Salesforce AI integration | evaluation |
| `/solutions` | sales productivity, revenue intelligence | evaluation |
| `/security` | AI sales security, SOC 2 | objection |
| `/pricing` | AI sales software pricing | commercial |
| `/customers` | pipeline intelligence | proof |
| `/faq` | long-tail question queries | all stages |
| `/blog` | topical authority hub | awareness |

The three pillars and two comparison pages are the additions that matter.
Comparison pages are the highest-converting organic asset in B2B SaaS — someone
searching "Gong alternative" has a budget and a complaint. Both are written to be
genuinely fair, including a "choose them if…" column, because a comparison that
only flatters the author is transparently useless and gets no links.

### Structured data

Every page ships one `@graph` containing `Organization` + `WebSite`, plus what
the page actually is. Across the 29 pages:

| Type | Pages | Where |
|---|---|---|
| `Organization`, `WebSite` | 29 | every page |
| `BreadcrumbList` | 27 | everything but `/` and `/404` |
| `FAQPage` | 8 | pricing, security, faq, 3 pillars, 2 comparisons |
| `WebPage` | 9 | company and pillar pages |
| `BlogPosting` | 5 | every article, with `wordCount` and `articleSection` |
| `SoftwareApplication` | 2 | `/` and `/product`, with `featureList` and offers |
| `HowTo` | 1 | `/how-it-works` |
| `Product` | 1 | `/pricing`, with both public offers |
| `AboutPage`, `ContactPage`, `Blog` | 1 each | `/about`, `/contact`, `/blog` |

The `FAQPage` blocks matter disproportionately: they are the format AI answer
engines and Google's AI overviews quote from most readily, and each one mirrors a
real accordion on the page rather than being invisible markup.

### llms.txt

`/llms.txt` is a plain-text brief for AI answer engines: what Bylda is, what it
does, published pricing, security posture, how it differs from a CRM / Gong /
Clari, and a page index. Increasingly, buyers ask an assistant before they visit
a site — this is the page that gets read in that flow. `robots.txt` explicitly
welcomes `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot` and
`Google-Extended`, and points at it.

### Implementation rules

- **The generator enforces the limits.** `shell.mjs` throws if a title exceeds 62
  characters or a description exceeds 160. This is not a lint step to remember —
  a page that violates it cannot be built. It caught a 67-character title during
  this pass.
- One `<h1>` per page. Section headings are real `<h2>`/`<h3>` in document order,
  not styled `<div>`s.
- Canonicals on every page, matching the extensionless form `cleanUrls` serves.
- `robots` meta with `max-image-preview:large` and `max-snippet:-1`; `/404` is
  `noindex, follow`.
- Full Open Graph and Twitter cards including `og:locale` and `og:image:alt`.
- Visible breadcrumbs on interior pages, matching the `BreadcrumbList` markup —
  the trail a user sees and the trail a crawler reads are generated from the same
  array, so they cannot drift.
- `sitemap.xml` is **derived from the filesystem**, not hand-maintained, so it
  cannot fall out of step with the site. `/404` is excluded.
- Every internal link resolves directly — verified that none route through a
  redirect, which wastes crawl budget and dilutes link equity.

### Internal linking

The pillars and comparisons are the hubs. Each carries a "keep reading" block
linking two siblings and one article; each article links back to a pillar through
the mid-article product card. The footer exposes the pillar and comparison pages
site-wide, so every page is within two clicks of the money pages. Every page
links to `/book-demo` at least twice.

### Content strategy

The blog is positioned as argument, not filler. Five essays: three establish the
category thesis (an AI Sales Operating System is a distinct layer; CRM adoption is
structural not behavioural; conversation intelligence without execution is
incomplete) and two are practical playbooks targeting the CRM-automation and
follow-up-automation queries. Each is written to be *cited*, which is what
actually earns links — an essay that only restates a keyword earns none.

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
crm-automation.html   conversation-intelligence.html           ai-sales-agent.html
gong-alternative.html clari-alternative.html
about.html  contact.html  careers.html  faq.html  changelog.html
privacy.html  terms.html  sitemap.html  404.html
blog/index.html       blog/*.html          (5 posts)

os.css                Design system + scenes
os.js                 Motion engine
brand/
  ghost-original.png       Source artwork as supplied
  ghost-mark.png           1000px, flood-filled — the light-ground mark
  ghost-icon-256.png       Nav, footer, apple-touch-icon
  ghost-icon-64.png        Favicon
  ghost-mark-dark.png      Dark-ground variant (ghost body transparent)
  ghost-icon-dark-*.png    Dark-ground icons
  ghost-mark-black.png     1400px on black — reference

sitemap.xml           Derived from the filesystem
robots.txt            Crawler rules; AI answer engines explicitly welcomed
llms.txt              Plain-text brief for AI answer engines
vercel.json           88 redirects retiring the previous architecture

scripts/assemble-site.mjs   Copies the served site into dist/
legacy/               The previous positioning — kept, never deployed
```

The `legacy/` directory holds 52 pages plus the entire previous design system
(`style.css`, `design-system.css`, `galaxy.css`, `solar.css`, `cinematic.css` and
their scripts). Nothing on the live site references any of it. It is retained so
the old copy and markup remain recoverable without digging through git history.
