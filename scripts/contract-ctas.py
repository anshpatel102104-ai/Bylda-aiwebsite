#!/usr/bin/env python3
"""
Contract-only pass over the hand-written pages: Bylda has no public pricing,
and the one call to action is Request access (signups land in the waitlist
Google Sheet via /api/waitlist, and the team reaches out from there).

- Drops every link to /pricing and /book (header, mobile menu, footer, sitemap page).
- Drops the secondary button from every CTA row, leaving Request access alone.

Idempotent: running it twice changes nothing the second time.
"""
import glob, re

ROOT = __file__.rsplit('/scripts/', 1)[0] + '/'
files = sorted(glob.glob(ROOT + '*.html') + glob.glob(ROOT + 'blog/*.html') + glob.glob(ROOT + 'integrations/*.html'))

changed = 0
for f in files:
    s = open(f, encoding='utf8').read()
    o = s
    # Every /pricing or /book link on its own line: nav, header button, mobile menu, footer, sitemap list.
    s = re.sub(r'\n[ \t]*<a (?:class="[^"]*" )?href="/(?:pricing|book)"[^>]*>[^<]*</a>[ \t]*(?=\n)', '', s)
    # CTA rows keep only Request access (the 404 page keeps its way home).
    if not f.endswith('/404.html'):
        def row(m):
            return re.sub(r'\n?[ \t]*<a class="btn btn--ghost(?: btn--lg)?" href="[^"]*">.*?</a>', '', m.group(0), flags=re.S)
        s = re.sub(r'<div class="cta-row[^"]*"[^>]*>.*?</div>', row, s, flags=re.S)
    if s != o:
        open(f, 'w', encoding='utf8').write(s)
        changed += 1
print(f'[contract-ctas] {changed} files updated')
