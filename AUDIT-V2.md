# NovaOps AI — Website V2 Audit & Changelog

Version 2 elevates the existing site (it was **not** rebuilt). Every change is
additive and preserves the existing branding, hero, structure, and animations.

## The core problem V2 solves
First-time visitors could not tell, within 5 seconds, **what Launchpad Nova is,
what Nova Ops is, how they connect, or why they matter.** V2 makes that the
spine of the experience.

## Positioning made explicit everywhere
- **Launchpad Nova** = *Build the business* (Idea → Validate → Build → Launch):
  Validation, Roadmaps, Tasks, AI Mentors, Progress Tracking.
- **Nova Ops** = *Automate & scale* (Operate → Automate → Scale):
  CRM, AI Calling, Follow-Up, Automations, Lead Flow.
- One operating system; the handoff is at **Launch → Operate**.

## What shipped

### 1. Homepage — "Two engines, one operating system" section
A new compact, highly-animated section right after the hero: two product cards
joined by an animated **handoff connector**, plus a **founder-journey ribbon**
(Idea → Scale) color-split by owning product. Hovering an engine highlights the
stages it owns. Show **and** tell, in one viewport — page length barely changed.

### 2. Premium mega-menu navigation (site-wide)
The thin Launchpad/Nova dropdowns became **mega-menus** with iconned product
links, descriptions, a live preview panel, hover-to-open, and brand theming
(violet = Launchpad Nova, magenta = Nova Ops). Built by a single shared script
(`nova-nav.js`) that self-injects its CSS, so it renders identically on all
**110 pages** regardless of which nav stylesheet they load.

### 3. Hero + section framing
Hero subtitle now names both products. The "Six Systems" section is badged as
**Nova Ops**. The Launch Sequence phases are tagged + tinted by owning product.

### 4. About page
The text-only "Two products" block was replaced with the same two-engine +
journey-ribbon ecosystem visual.

### 5. Blog
- **Index:** data-driven category filter + live search toolbar (chips with
  counts, wired to the sidebar categories, result count, empty state).
- **Articles (25 pages):** a reading-progress bar pinned to the top.

## New / changed files
| File | Purpose |
|------|---------|
| `nova-v2.css` | Ecosystem section + homepage mega-menu + Launch Sequence tints |
| `nova-v2.js` | Engine↔journey interaction + Launch Sequence tagging |
| `nova-nav.js` | Shared mega-menu builder (self-injecting CSS), all pages |
| `blog-progress.js` | Reading-progress bar for article pages |
| `index.html`, `about.html`, `blog/index.html` | Section markup + asset wiring |
| 109 pages | `<script src="/nova-nav.js">` injected; 25 posts also get `blog-progress.js` |

## Verified
Rendered with headless Chromium across desktop + mobile and 8 representative
pages (home, about, blog index, blog post, services, pricing, case study,
launchpad). No JavaScript errors; mega-menu active on every page.

## Recommended next (not yet done)
- Restructure top-level nav into **Platform / Solutions / Resources** (requires
  editing the nav on all pages; deferred to avoid risk).
- Bring the ecosystem visual to the Launchpad Nova and Nova Ops product pages.
- Real OG images per page; case-study results schema.
