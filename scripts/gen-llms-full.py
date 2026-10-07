#!/usr/bin/env python3
"""Builds /llms-full.txt: the readable text of the key pages in one file, for answer engines."""
import re, html

ROOT = '/home/user/Bylda-aiwebsite/'
PAGES = ['product', 'how-it-works', 'behavioral-sales-intelligence', 'sales-call-auditing', 'ai-sales-call-analysis',
         'ai-sales-coaching', 'sales-performance-analytics', 'behavior-graph', 'conversation-intelligence',
         'deal-intelligence', 'for-sales-managers', 'for-sales-reps', 'customers', 'gong-alternative',
         'clari-alternative', 'pricing', 'faq', 'vision', 'about', 'security']

def text_of(path):
    t = open(path, encoding='utf8').read()
    title = html.unescape(re.search(r'<title>(.*?)</title>', t, re.S).group(1)).strip()
    m = re.search(r'<main.*?</main>', t, re.S)
    t = m.group(0) if m else t
    t = re.sub(r'<(script|style|svg|nav)\b.*?</\1>', '', t, flags=re.S)
    t = re.sub(r'<(br|/p|/h\d|/li|/div|/section|/tr|/dt|/dd|/button)[^>]*>', '\n', t)
    t = re.sub(r'<h([1-6])[^>]*>', lambda m: '\n' + '#' * int(m.group(1)) + ' ', t)
    t = re.sub(r'<[^>]+>', ' ', t)
    lines = [re.sub(r'\s+', ' ', l).strip() for l in html.unescape(t).split('\n')]
    out, prev = [], ''
    for l in lines:
        if l and l != prev and l not in ('→', '/', '+'):
            out.append(l)
        prev = l
    return title, '\n\n'.join(out)

parts = ['# Bylda: full text\n\n> Behavioral sales intelligence software. Page text from https://usebylda.com, for retrieval. Short summary: https://usebylda.com/llms.txt\n']
for p in PAGES:
    title, body = text_of(ROOT + p + '.html')
    parts.append(f'\n---\n\n## {title}\n\nSource: https://usebylda.com/{p}\n\n{body}\n')
open(ROOT + 'llms-full.txt', 'w', encoding='utf8').write('\n'.join(parts))
print('llms-full.txt', sum(len(x) for x in parts) // 1024, 'KB')
