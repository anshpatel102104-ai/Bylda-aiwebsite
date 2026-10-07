# Bylda website (web/)

Vite + React 18 + TypeScript, plain CSS custom properties. This is the live
homepage, served at `/`, and the product pages at `/product/<slug>`, one per
item in the Product menu. The static pages in the repo root follow its design
through `/pearl.css`.

```sh
npm ci
npm run dev        # http://localhost:5173/
npm run build      # typecheck, client build, SSR prerender into dist/index.html and dist/product/*.html
npm run preview    # http://localhost:4173/
```

From the repo root, `npm run build` builds this app and lays it over `dist/`.

## Layout

| Path | Purpose |
|---|---|
| `src/tokens.css` | Design tokens from Figma (see `/reference/tokens.json`) |
| `src/data/sample.ts` | Every number and name the site shows, with its source screen |
| `src/data/product-pages.ts` | The product pages: copy, status, screen and SEO per slug. The Product menu reads from it |
| `src/components/product/` | `ProductScreen` (every product screen on one 1000 x 560 canvas, shared with the homepage tour) and the `ProductPage` template |
| `src/ui/Mocks.tsx` | Screens with no app prototype (assign panel, roadmap reports, concepts), labeled Illustrative |
| `src/ui/` | Rebuilt app fragments. One component, many placements |
| `src/components/Showreel/` | The film: `timeline.ts` (chapters), `render.ts` (pure `render(t)`), `Scene.tsx` (layout), `Showreel.tsx` (clock and controls) |
| `src/brand/` | Phantom silhouette (traced from the official mark) and chrome ribbon arcs |
| `tests/` | Playwright scripts: screenshots, console and overflow check, reduced motion, loop recording |

## Showreel rules

- All motion comes from `render(t)`. It is pure: same `t`, same frame. Play,
  pause, chapter jump, loop and reduced-motion stills all call it.
- The design canvas is fixed (1100 x 640 desktop, 520 x 650 mobile at
  `max-width: 760px`) and scaled to the stage.
- Plays only while 35% visible, pauses when the tab is hidden or when
  "Pause animations" is on. Reduced motion: no autoplay, each chapter's end
  state is selectable.
- `?t=12.5` opens the film paused at that time, for screenshots and review links.

## Checks

With `npm run preview` running (Chromium path via `PW_CHROMIUM` if needed):

```sh
npm run check:console               # console errors, hydration, horizontal overflow at 1440/1024/768/390
npm run check:reduced -- <outdir>   # reduced-motion stills
npm run shots -- <outdir> 1440 4.5 12.2 18 23.6 31.2 35.6
```
