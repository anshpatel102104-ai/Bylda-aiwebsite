#!/usr/bin/env python3
"""
Contract-only pass over the hand-written pages: Bylda has no public pricing.

- Drops every link to /pricing (header, mobile menu, footer, sitemap page).
- Adds "Book a call" next to "Request access" in the header and mobile menu.
- Makes the secondary button of every CTA row "Book a call", so the only calls
  to action on the site are Request access and Book a call.

/book is a redirect in vercel.json, so the booking destination changes in one
place. Idempotent: running it twice changes nothing the second time.
"""
import glob, re

ROOT = __file__.rsplit('/scripts/', 1)[0] + '/'
files = sorted(glob.glob(ROOT + '*.html') + glob.glob(ROOT + 'blog/*.html') + glob.glob(ROOT + 'integrations/*.html'))

changed = 0
for f in files:
    if f.endswith('/pricing.html'):
        continue
    s = open(f, encoding='utf8').read()
    o = s
    # Every /pricing link on its own line: nav, mobile menu, footer, sitemap list.
    s = re.sub(r'\n[ \t]*<a href="/pricing"[^>]*>[^<]*</a>[ \t]*(?=\n)', '', s)
    # Header: Book a call beside Request access (os.css hides ghost buttons in the header on phones).
    if 'nav-book' not in s:
        s = s.replace('<div class="nav-cta">\n      <a class="btn btn--solid btn--sm" href="/waitlist">',
                      '<div class="nav-cta">\n      <a class="btn btn--ghost btn--sm nav-book" href="/book">Book a call</a>\n      <a class="btn btn--solid btn--sm" href="/waitlist">')
    # Mobile menu.
    s = re.sub(r'(<nav class="menu" aria-label="Mobile">(?:(?!</nav>).)*?)\n  <a href="/waitlist">Request access</a>',
               lambda m: m.group(1) + ('' if 'href="/book"' in m.group(1) else '\n  <a href="/book">Book a call</a>') + '\n  <a href="/waitlist">Request access</a>',
               s, flags=re.S)
    # CTA rows: the ghost button becomes Book a call (the 404 page keeps its way home).
    if not f.endswith('/404.html'):
        def row(m):
            return re.sub(r'<a class="(btn btn--ghost(?: btn--lg)?)" href="[^"]*">.*?</a>',
                          lambda b: f'<a class="{b.group(1)}" href="/book">Book a call</a>', m.group(0), flags=re.S)
        s = re.sub(r'<div class="cta-row[^"]*"[^>]*>.*?</div>', row, s, flags=re.S)
    if s != o:
        open(f, 'w', encoding='utf8').write(s)
        changed += 1
print(f'[contract-ctas] {changed} files updated')
