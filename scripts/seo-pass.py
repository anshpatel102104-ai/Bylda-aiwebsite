#!/usr/bin/env python3
"""
Adds the shared SEO / AEO / GEO plumbing to every hand-written page.
Idempotent. Run from anywhere; edits the HTML files at the repo root, blog/ and integrations/.
"""
import re, glob

ROOT = '/home/user/Bylda-aiwebsite/'
files = sorted(glob.glob(ROOT + '*.html') + glob.glob(ROOT + 'blog/*.html') + glob.glob(ROOT + 'integrations/*.html'))
MODIFIED = '2026-10-07'
CONTACT = '''"contactPoint": [
          { "@type": "ContactPoint", "contactType": "sales", "email": "sales@usebylda.com" },
          { "@type": "ContactPoint", "contactType": "customer support", "email": "support@usebylda.com" },
          { "@type": "ContactPoint", "contactType": "security", "email": "security@usebylda.com" }
        ],
        '''
n = 0
for f in files:
    t = o = open(f, encoding='utf8').read()
    canon = re.search(r'<link rel="canonical" href="([^"]+)">', t)
    if canon and 'hreflang="en"' not in t:
        u = canon.group(1)
        t = t.replace(canon.group(0), f'{canon.group(0)}\n  <link rel="alternate" hreflang="en" href="{u}">\n  <link rel="alternate" hreflang="x-default" href="{u}">')
    if 'application/rss+xml' not in t and '<link rel="stylesheet" href="/os.css">' in t:
        t = t.replace('  <link rel="preload" href="/brand/fonts/SchibstedGrotesk-latin.woff2"',
                      '  <link rel="alternate" type="application/rss+xml" title="Bylda Blog" href="https://usebylda.com/feed.xml">\n  <link rel="preload" href="/brand/fonts/SchibstedGrotesk-latin.woff2"', 1)
    alt = re.search(r'<meta property="og:image:alt" content="([^"]*)">', t)
    if alt and 'twitter:image:alt' not in t:
        t = t.replace('<meta name="twitter:image" content="https://usebylda.com/og-image.png">',
                      f'<meta name="twitter:image" content="https://usebylda.com/og-image.png">\n  <meta name="twitter:image:alt" content="{alt.group(1)}">')
    # the blog posts carry their own dates; everything else was last changed in the Pearl pass
    posted = re.search(r'"dateModified":\s*"([^"]+)"', t)
    stamp = posted.group(1) if posted else MODIFIED
    def add_modified(m):
        block = m.group(0)
        return block if 'dateModified' in block else block.replace(m.group(1), f'{m.group(1)}\n        "dateModified": "{stamp}",', 1)
    t = re.sub(r'("@type": "(?:WebPage|AboutPage|CollectionPage|ContactPage)",)(?:(?!\n      \},\n      \{)[\s\S])*?\n      \}', add_modified, t)
    if '"contactPoint"' not in t:
        t = t.replace('"email": "hello@usebylda.com",', '"email": "hello@usebylda.com",\n        ' + CONTACT.rstrip(), 1)
    if t != o:
        open(f, 'w', encoding='utf8').write(t); n += 1
print('updated', n, 'of', len(files))
