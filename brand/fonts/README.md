# Display face

Titles (`.display`, `.h2`, `.h3`) and the nav wordmark render with
`var(--display)` from `os.css`. The token names **Dethrone** first and falls
through to Playfair Display, so the site renders correctly whether or not the
font is present.

## Installing Dethrone

1. Put the licensed webfont here as `dethrone.woff2` (add `dethrone.woff` too
   if you have it — the `@font-face` lists both).
2. Uncomment the `@font-face` block in `os.css`, just under the token list.

That is the whole change. Self-hosting keeps the file inside the existing
`font-src 'self'` CSP in `vercel.json`, so no header edit is needed, and
`scripts/assemble-site.mjs` copies `brand/` recursively into `dist/`.

## Licensing

Dethrone is a commercial font and is not redistributable, which is why no file
is committed here. Buy the **webfont** licence specifically — a desktop licence
does not cover `@font-face` embedding. Note that two unrelated fonts ship under
the name: a modern serif by Rillatype and a condensed sans by Tom Gordon Design.

If you only have a desktop `.otf`/`.ttf`, it can be converted to `.woff2`
provided the licence permits webfont use.
