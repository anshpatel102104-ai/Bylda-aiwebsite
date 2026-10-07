"""Edit a FAQ entry in both its visible accordion and its FAQPage JSON-LD, so the two never disagree."""
import re, json, html

def _esc(t): return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def faq_replace(s, question, answer, new_question=None):
    q_html = re.escape(_esc(question)).replace("'", "(?:'|&#39;|&apos;)")
    vis = re.compile(r'(<button class="acc-q"[^>]*>)' + q_html + r'(<span class="ind">\+</span></button><div class="acc-a">).*?(</div></div>)', re.S)
    m = vis.search(s)
    assert m, 'visible FAQ not found: ' + question
    s = vis.sub(lambda m: m.group(1) + _esc(new_question or question) + m.group(2) + '<p>' + _esc(answer) + '</p>' + m.group(3), s, 1)
    q_js = re.escape(json.dumps(question)[1:-1])
    js = re.compile(r'("name": ")' + q_js + r'(",\s*"acceptedAnswer": \{\s*"@type": "Answer",\s*"text": ")(?:[^"\\]|\\.)*(")', re.S)
    assert js.search(s), 'JSON-LD FAQ not found: ' + question
    return js.sub(lambda m: m.group(1) + json.dumps(new_question or question)[1:-1] + m.group(2) + json.dumps(answer)[1:-1] + m.group(3), s, 1)

def faq_remove(s, question):
    q_html = re.escape(_esc(question)).replace("'", "(?:'|&#39;|&apos;)")
    vis = re.compile(r'\s*<div class="acc-item"><button class="acc-q"[^>]*>' + q_html + r'<span class="ind">\+</span></button><div class="acc-a">.*?</div></div>', re.S)
    assert vis.search(s), 'visible FAQ not found: ' + question
    s = vis.sub('', s, 1)
    q_js = re.escape(json.dumps(question)[1:-1])
    js = re.compile(r',?\s*\{\s*"@type": "Question",\s*"name": "' + q_js + r'",\s*"acceptedAnswer": \{[^{}]*\}\s*\}', re.S)
    assert js.search(s), 'JSON-LD FAQ not found: ' + question
    return js.sub('', s, 1)
