#!/usr/bin/env python3
"""Extract VMAX architecture graph from the source file using Python's ast.
Usage: python3 tools/extract_vmax.py <VMAX.py> src/data/vmax-graph.json
Edges:
  verified  = AST name reference (call/load) to a top-level symbol defined exactly once in another section.
  inferred  = reference to a symbol defined in several sections (ambiguous) OR a string literal equal to a symbol name.
Nothing is invented: every edge carries file line evidence."""
import ast, re, sys, json, hashlib
from collections import defaultdict
src_path, out = sys.argv[1], sys.argv[2]
text = open(src_path, encoding='utf-8').read(); L = text.split('\n')
heads = []
for i in range(len(L)-1):
    if re.match(r'^# ?={10,}\s*$', L[i]) and re.match(r'^# +\S', L[i+1]) and not re.match(r'^# ?[=\-]{5,}', L[i+1]):
        heads.append((i+2, L[i+1][2:].strip().rstrip('-').strip()))
if not heads or heads[0][0] > 1: heads.insert(0, (1, '(file preamble)'))
def sec_of(line):
    lo, hi = 0, len(heads)-1
    while lo < hi:
        m = (lo+hi+1)//2
        if heads[m][0] <= line: lo = m
        else: hi = m-1
    return lo
CATS = [
 ('security', r'admin|auth|password|vault|key|crypt|token|pepper|argon|unlock|anti-?cheat|permission|kill-switch|c2pa|security|hmac'),
 ('kernel', r'kernel|virtual (cpu|computer)|bare-metal|boot|syscall|scheduler|vm\b'),
 ('ai', r'\bai\b|needle|hugging|llm|vision|ocr|docling|mcp|anime backend|gpt'),
 ('network', r'network|mesh|tunnel|routing|socket|server|bridge|deploy|api\b|endpoint|hot update'),
 ('economy', r'bank|currency|shop|gacha|shard|tax|market|trade|price|coin|economy|storage'),
 ('social', r'social|community|gallery|feed|chat|npc|feedback|announcement|friend|guild'),
 ('ui', r'ui\b|widget|menu|hud|console|editor|keyboard|cutscene|banner|hologram|settings|launcher|terminal'),
 ('gameplay', r'game|rpg|weapon|gun|ammo|armor|skill|survival|ballistic|card|map|npc|item|event|quest|combat|camp'),
 ('data', r'data|registry|database|sqlite|config|wiki|codemap|catalog|record'),
]
def cat(t):
    tl = t.lower()
    for c, rx in CATS:
        if re.search(rx, tl): return c
    return 'unknown'
tree = ast.parse(text)
defs = defaultdict(list)  # name -> [(sec, line, kind)]
secs = [dict(id=f's{i}', title=t, line=ln, endLine=(heads[i+1][0]-1 if i+1 < len(heads) else len(L)), category=cat(t), symbols=[], routes=[]) for i,(ln,t) in enumerate(heads)]
def doc1(n):
    d = ast.get_docstring(n)
    return d.strip().split('\n')[0][:200] if d else None
for n in tree.body:
    if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
        s = sec_of(n.lineno); kind = 'class' if isinstance(n, ast.ClassDef) else 'function'
        defs[n.name].append((s, n.lineno, kind))
        secs[s]['symbols'].append(dict(name=n.name, kind=kind, line=n.lineno, endLine=n.end_lineno, doc=doc1(n)))
        for d in getattr(n, 'decorator_list', []):
            if isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute) and d.func.attr in ('route','get','post','put','delete') and d.args and isinstance(d.args[0], ast.Constant):
                secs[s]['routes'].append(dict(path=str(d.args[0].value), handler=n.name, line=d.lineno))
edges = {}
def add(a, b, typ, ev):
    k = (a, b, typ)
    e = edges.setdefault(k, dict(source=f's{a}', target=f's{b}', type=typ, count=0, evidence=[]))
    e['count'] += 1
    if len(e['evidence']) < 6: e['evidence'].append(ev)
for n in tree.body:
    if not isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)): continue
    a = sec_of(n.lineno); local = set()
    for x in ast.walk(n):
        if isinstance(x, ast.Name) and isinstance(x.ctx, ast.Load) and x.id in defs and x.id != n.name:
            ds = defs[x.id]; tsecs = {d[0] for d in ds}
            if a in tsecs: continue
            if len(ds) == 1:
                add(a, ds[0][0], 'verified', dict(line=x.lineno, from_=n.name, to=x.id, to_line=ds[0][1], reason='AST name reference to unique top-level definition'))
            else:
                for t in tsecs: add(a, t, 'inferred', dict(line=x.lineno, from_=n.name, to=x.id, to_line=None, reason=f'Name defined {len(ds)} times; runtime binding not determined'))
        elif isinstance(x, ast.Constant) and isinstance(x.value, str) and x.value in defs and len(x.value) > 5:
            for t in {d[0] for d in defs[x.value]}:
                if t != a: add(a, t, 'inferred', dict(line=x.lineno, from_=n.name, to=x.value, to_line=None, reason='String literal matches symbol name (possible dynamic lookup)'))
for e in edges.values():
    for ev in e['evidence']: ev['from'] = ev.pop('from_')
secs = [s for s in secs if s['symbols'] or s['routes'] or any(True for _ in [])] or secs
keep = {s['id'] for s in secs}
el = [e for e in edges.values() if e['source'] in keep and e['target'] in keep]
data = dict(schemaVersion=1, source=dict(file=src_path.split('/')[-1], lines=len(L), sha256=hashlib.sha256(text.encode()).hexdigest(), totalSections=len(heads)),
  method=dict(sections='Comment banner "# ====" followed by a title line', verified='Static AST reference to a uniquely defined top-level symbol in another section (not runtime-tested)', inferred='Ambiguous duplicate definitions or string literals matching symbol names', category='Keyword heuristic on section title; "unknown" when no keyword matches'),
  modules=secs, edges=el)
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
print(len(secs), 'modules', len(el), 'edges', sum(e['type']=='verified' for e in el), 'verified')
