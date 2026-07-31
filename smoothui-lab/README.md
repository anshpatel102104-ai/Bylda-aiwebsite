# smoothui-lab — the homepage

This is no longer a sandbox. **This app builds the live homepage at `usebylda.com/`.**

Every other page on the site is still hand-written static HTML at the repo root
and is served unchanged.

## How the site is assembled

`npm run build` at the repo root:

1. installs and builds this app (`vite build` → `smoothui-lab/dist/`)
2. runs `scripts/assemble-site.mjs`, which copies every static page and asset
   from the repo root into `dist/`, then lays this app's build on top so its
   `index.html` becomes the homepage

Vercel runs that build and serves `dist/` (`buildCommand` / `outputDirectory` in
`vercel.json`).

## Local development

```bash
npm install
npm run dev      # homepage only, on Vite's dev server
```

To preview the whole assembled site, from the repo root:

```bash
npm run build
npx serve dist
```

Note that `npm run dev` serves this app in isolation, so links to other pages
(`/pricing`, `/about`, …) will 404 — they only exist in the assembled `dist/`.

## Things to keep in sync

- **SEO.** The homepage `<head>` lives in `index.html` here, not in the root
  `index.html` any more. Title, description, canonical, OG/Twitter tags and the
  JSON-LD graph were carried over from the old homepage.
- **Links.** Nav, footer and CTA targets are defined in `src/App.tsx`
  (`navLinks`, `CTA_HREF`) and `src/data.ts` (`footerCols`). They point at the
  real static pages, so renaming a page at the repo root means updating them.
- **CSP.** `vercel.json` sets a Content-Security-Policy. The newsletter form
  posts to the Workers endpoint already listed in `connect-src`; fonts are
  self-hosted (Geist via `@fontsource`), so no external font hosts are needed.
