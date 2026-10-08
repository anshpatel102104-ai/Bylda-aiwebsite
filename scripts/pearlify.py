#!/usr/bin/env python3
"""
One-off migration: moves every hand-written page onto the Pearl design.
Header, mobile menu, footer, head tags, brand assets and the signup CTA label.
Idempotent: running it twice changes nothing the second time.
"""
import re, glob, sys

ROOT = '/home/user/Bylda-aiwebsite/'
files = sorted(glob.glob(ROOT + '*.html') + glob.glob(ROOT + 'blog/*.html') + glob.glob(ROOT + 'integrations/*.html'))

LOGO = ('<span class="logo"><img src="/brand/bylda-mark-64.png" alt="" width="29" height="32" fetchpriority="high">'
        '<span class="logo-word" role="img" aria-label="Bylda">BYLDA</span></span>')

NAV = [('/product', 'Product'), ('/how-it-works', 'How it works'), ('/blog', 'Blog'), ('/security', 'Security')]

def current_href(html_block):
    m = re.search(r'<a href="([^"]+)"[^>]*aria-current="page"', html_block)
    return m.group(1) if m else None

def header(cur, path):
    # the nav marks the section the page belongs to
    page = '/' + re.sub(r'(index)?\.html$', '', path).rstrip('/')
    cur = '/blog' if path.startswith('blog/') or page == '/blog' else (page if page in dict(NAV) else cur)
    links = '\n'.join(
        f'      <a href="{h}"' + (' aria-current="page"' if h == cur else '') + f'>{t}</a>' for h, t in NAV)
    menu = '\n'.join(
        f'  <a href="{h}"' + (' aria-current="page"' if h == cur else '') + f'>{t}</a>' for h, t in NAV)
    return f'''<header class="nav" aria-label="Primary">
  <div class="nav-inner">
    <a class="nav-logo" href="/" aria-label="Bylda home">{LOGO}</a>
    <nav class="nav-links" aria-label="Site">
{links}
    </nav>
    <div class="nav-cta">
      <a class="btn btn--solid btn--sm" href="/waitlist">Request access</a>
      <button class="nav-burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<nav class="menu" aria-label="Mobile">
{menu}
  <a href="/waitlist">Request access</a>
</nav>'''

FOOTER = f'''<footer class="footer">
  <div class="wrap-wide footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="nav-logo" href="/" aria-label="Bylda home">{LOGO}</a>
        <p>Behavioral sales intelligence. Bylda audits every sales conversation, finds the behaviors moving revenue, and tells your team what to change.</p>
      </div>
      <div class="footer-col">
        <h2 class="footer-h">Platform</h2>
        <a href="/product">Platform overview</a>
        <a href="/how-it-works">How it works</a>
        <a href="/sales-call-auditing">Phantom Audit</a>
        <a href="/ai-sales-call-analysis">Call analysis</a>
        <a href="/ai-sales-coaching">AI sales coaching</a>
        <a href="/sales-performance-analytics">Performance analytics</a>
        <a href="/behavior-graph">Behavior Graph</a>
      </div>
      <div class="footer-col">
        <h2 class="footer-h">Solutions</h2>
        <a href="/for-sales-managers">For sales managers</a>
        <a href="/for-sales-reps">For sales reps</a>
        <a href="/customers">Who it's for</a>
        <a href="/integrations">Integrations</a>
      </div>
      <div class="footer-col">
        <h2 class="footer-h">Learn</h2>
        <a href="/behavioral-sales-intelligence">Behavioral sales intelligence</a>
        <a href="/conversation-intelligence">Conversation intelligence</a>
        <a href="/deal-intelligence">Deal intelligence</a>
        <a href="/gong-alternative">Bylda vs Gong</a>
        <a href="/clari-alternative">Bylda vs Clari</a>
        <a href="/blog">Blog</a>
        <a href="/faq">FAQ</a>
      </div>
      <div class="footer-col">
        <h2 class="footer-h">Company</h2>
        <a href="/about">About</a>
        <a href="/vision">Vision</a>
        <a href="/security">Security</a>
        <a href="/changelog">Changelog</a>
        <a href="/careers">Careers</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> Bylda. All rights reserved.</span>
      <div class="footer-legal">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/sitemap">Sitemap</a>
      </div>
    </div>
  </div>
</footer>'''

PRELOAD = ('<link rel="preload" href="/brand/fonts/Lexend-latin.woff2" as="font" type="font/woff2" crossorigin>\n'
           '  <link rel="preload" href="/brand/fonts/Inter-latin.woff2" as="font" type="font/woff2" crossorigin>')

CTA = re.compile(r'(<a\b[^>]*>)(\s*)(?:Join the waitlist|Join waitlist|Join Waitlist|Get early access|Join the early-access list)(\s*(?:<span class="arr"[^>]*>→</span>|→)?\s*)(</a>)')

changed = 0
for f in files:
    path = f[len(ROOT):]
    t = o = open(f, encoding='utf8').read()
    focused = 'nav--focused' in t

    # ---- head ----
    t = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>', '', t)
    t = re.sub(r'\s*<link href="https://fonts\.googleapis\.com/[^"]*" rel="stylesheet">', '', t)
    if '/pearl.css' not in t:
        t = t.replace('<link rel="stylesheet" href="/os.css">',
                      PRELOAD + '\n  <link rel="stylesheet" href="/os.css">\n  <link rel="stylesheet" href="/pearl.css">')
    t = t.replace('name="theme-color" content="#07080a"', 'name="theme-color" content="#f8f7f5"')
    t = t.replace('href="/brand/ghost-icon-64.png"', 'href="/brand/bylda-mark-64.png"')
    t = t.replace('<link rel="apple-touch-icon" href="/brand/ghost-icon-256.png">', '<link rel="apple-touch-icon" href="/brand/bylda-mark-180.png">')
    t = re.sub(r'("url": "https://usebylda\.com/brand/)ghost-icon-256\.png(",\s*"width": )256(,\s*"height": )256', r'\1bylda-mark-180.png\g<2>180\g<3>180', t)

    # ---- chrome ----
    if not focused:
        hm = re.search(r'<header class="nav" aria-label="Primary">.*?</header>\s*<nav class="menu" aria-label="Mobile">.*?</nav>', t, re.S)
        if hm:
            t = t.replace(hm.group(0), header(current_href(hm.group(0)), path))
        fm = re.search(r'<footer class="footer">.*?</footer>', t, re.S)
        if fm:
            t = t.replace(fm.group(0), FOOTER)
    else:
        t = re.sub(r'<a class="nav-logo" href="/" aria-label="Bylda home">\s*<img class="brand-lockup"[^>]*>\s*</a>',
                   f'<a class="nav-logo" href="/" aria-label="Bylda home">{LOGO}</a>', t)

    # ---- the signup CTA has one name ----
    t = CTA.sub(lambda m: f'{m.group(1)}{m.group(2)}Request access{m.group(3)}{m.group(4)}', t)

    if t != o:
        open(f, 'w', encoding='utf8').write(t)
        changed += 1
print('updated', changed, 'of', len(files), 'pages')
