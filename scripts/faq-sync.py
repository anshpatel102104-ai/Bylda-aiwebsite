#!/usr/bin/env python3
"""
Keeps every page's FAQPage JSON-LD identical to the FAQ a visitor can see.
- Page has a visible accordion: the schema is rebuilt from it.
- Page has FAQ schema but no accordion: a visible FAQ section is added from the schema first.
Idempotent.
"""
import re, json, html, glob

ROOT = '/home/user/Bylda-aiwebsite/'
files = sorted(glob.glob(ROOT + '*.html') + glob.glob(ROOT + 'blog/*.html') + glob.glob(ROOT + 'integrations/*.html'))
ITEM = re.compile(r'<div class="acc-item"><button class="acc-q"[^>]*>(.*?)<span class="ind">\+</span></button><div class="acc-a">(.*?)</div></div>', re.S)
LD = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)
def plain(x): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', x))).strip()
def esc(x): return x.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

changed = []
for f in files:
    t = o = open(f, encoding='utf8').read()
    m = LD.search(t)
    if not m: continue
    data = json.loads(m.group(2))
    nodes = data.get('@graph', [])
    faq = next((n for n in nodes if n.get('@type') == 'FAQPage'), None)
    if not faq: continue
    items = ITEM.findall(t)
    if not items:
        qa = [(q['name'], q['acceptedAnswer']['text']) for q in faq['mainEntity']]
        rows = ''.join(f'      <div class="acc-item"><button class="acc-q" aria-expanded="false">{esc(q)}<span class="ind">+</span></button><div class="acc-a"><p>{esc(a)}</p></div></div>\n' for q, a in qa)
        section = ('  <section class="section" aria-label="Questions">\n    <div class="wrap" style="max-width:780px">\n'
                   '      <div class="section-head" data-reveal><p class="kicker">Questions</p><h2 class="h2">Answered plainly.</h2></div>\n'
                   '      <div class="acc" data-reveal>\n' + rows + '      </div>\n    </div>\n  </section>\n\n')
        main = t.index('<main'); end = t.index('</main>')
        last = t.rfind('<section', main, end)
        t = t[:last] + section + t[last:]
        items = ITEM.findall(t)
    new_entities = [{'@type': 'Question', 'name': plain(q), 'acceptedAnswer': {'@type': 'Answer', 'text': plain(a)}} for q, a in items]
    if faq['mainEntity'] != new_entities:
        faq['mainEntity'] = new_entities
        # the FAQPage block may not be the first ld+json script
        for mm in LD.finditer(t):
            d = json.loads(mm.group(2))
            if any(n.get('@type') == 'FAQPage' for n in d.get('@graph', [])):
                for n in d['@graph']:
                    if n.get('@type') == 'FAQPage': n['mainEntity'] = new_entities
                body = json.dumps(d, indent=2, ensure_ascii=False)
                body = '\n' + '\n'.join('  ' + l for l in body.split('\n')) + '\n  '
                t = t[:mm.start(2)] + body + t[mm.end(2):]
                break
    if t != o:
        open(f, 'w', encoding='utf8').write(t); changed.append(f[len(ROOT):])
print('updated', len(changed), changed)
