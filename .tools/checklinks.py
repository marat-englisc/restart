import os, re, sys, collections
root = sys.argv[1]
notes = {}
files = set()
for d, _, fs in os.walk(root):
    rel_d = os.path.relpath(d, root).replace(os.sep, '/')
    if '.obsidian' in d or rel_d == 'site' or rel_d.startswith('site/') or rel_d.startswith('.'):
        continue
    for f in fs:
        p = os.path.join(d, f)
        rel = os.path.relpath(p, root).replace('\\', '/')
        files.add(rel)
        if f.endswith('.md'):
            notes[rel] = open(p, encoding='utf-8').read()
basenames = collections.defaultdict(list)
for f in files:
    b = f.rsplit('/', 1)[-1]
    basenames[b].append(f)
    if b.endswith('.md'):
        basenames[b[:-3]].append(f)
used_imgs = set()
bad = []
for n, t in notes.items():
    for m in re.finditer(r'!?\[\[([^\]|#]+)(#[^\]|]*)?(\|[^\]]*)?\]\]', t):
        target = m.group(1).strip().rstrip("\\")
        cands = []
        if target in files or target + '.md' in files:
            cands = [target]
        else:
            cands = basenames.get(target.rsplit('/', 1)[-1], [])
            if '/' in target:
                cands = [c for c in cands if c.startswith(target.rsplit('/',1)[0]) or c[:-3] == target]
        if not cands:
            bad.append((n, target))
        else:
            if not target.endswith('.md') and m.group(0).startswith('!'):
                used_imgs.update(cands)
            # ambiguity: same note basename in several folders, link without path
            if len(set(cands)) > 1 and '/' not in target:
                # resolve to same folder if present
                folder = n.rsplit('/', 1)[0] if '/' in n else ''
                same = [c for c in cands if c.rsplit('/',1)[0] == folder]
                if not same:
                    bad.append((n, 'AMBIG ' + target))
print('BROKEN/AMBIG:', len(bad))
for b in bad:
    print('  ', b)
imgs = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
unused = [i for i in imgs if i not in used_imgs]
print('images', len(imgs), 'unused', len(unused))
for u in sorted(unused):
    print('   unused', u)
