# SEO Page Expander — Rotation Log

Tracks which page the daily SEO Page Expander routine last improved, so each
run picks up the next page in the queue instead of repeating the same page.

## Priority queue (in order)

1. homepage (`index.html`)
2. launchpad (`launchpad.html`)
3. nova (`nova.html`)
4. pricing (`pricing.html`)
5. how-it-works (`how-it-works.html`)
6. services (`services.html`)
7. industry pages (`roofing.html`, `dental.html`, `real-estate.html`, `med-spa.html`,
   `home-services.html`, `hvac.html`, `plumbing.html`, `landscaping.html`,
   `auto-repair.html`, `pest-control.html`, `chiropractic.html`, `solar.html`)

After the last industry page, the rotation wraps back to the homepage.

## Log

| Date       | Page improved | Branch                          |
|------------|----------------|----------------------------------|
| 2026-06-15 | nova           | claude/relaxed-mendel-8ghnb9      |

**Next up: pricing (`pricing.html`)**
