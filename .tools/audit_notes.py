"""Check the Obsidian course, excluding generated website/dependency files."""
from pathlib import Path
from collections import defaultdict, Counter
import re
import json

ROOT = Path(__file__).resolve().parents[1]
notes = [ROOT / '00. Оглавление.md'] + sorted(
    p for d in ROOT.iterdir() if d.is_dir() and re.match(r'^\d+\. ', d.name)
    for p in d.rglob('*.md'))
assets = [p for d in [ROOT / 'Картинки'] + [d for d in ROOT.iterdir()
          if d.is_dir() and re.match(r'^\d+\. ', d.name)] for p in d.rglob('*') if p.is_file()]
byname = defaultdict(list)
for p in set(notes + assets):
    byname[p.name].append(p)
    if p.suffix == '.md':
        byname[p.stem].append(p)

issues, used = [], set()
coverage = Counter()
for p in notes:
    text = p.read_text(encoding='utf-8-sig')
    rel = p.relative_to(ROOT).as_posix()
    # Skip code examples: links inside a code fence are literal teaching material.
    visible = re.sub(r'(?ms)^\s*```[^\n]*\n.*?^\s*```\s*$', '', text)
    if len(re.findall(r'(?m)^\s*```', text)) % 2:
        issues.append([rel, 'Unclosed code fence'])
    for m in re.finditer(r'(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]', visible):
        target = m[2].strip().rstrip('\\').replace('\\', '/')
        candidates = [ROOT / target, ROOT / (target + '.md'),
                      p.parent / target, p.parent / (target + '.md')]
        found = next((c.resolve() for c in candidates if c.is_file()), None)
        if found is None:
            matches = set(byname.get(target, [])) if '/' not in target else set()
            if len(matches) == 1:
                found = matches.pop()
        if found is None:
            issues.append([rel, 'Broken/ambiguous link: ' + target])
        elif m[1] and found.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'}:
            used.add(found)
            coverage[rel] += 1
    if not text.startswith('---\n'):
        issues.append([rel, 'Missing front matter'])
    if p.parent != ROOT and '%% навигация %%' not in text:
        issues.append([rel, 'Missing navigation'])

report = {'notes': len(notes), 'issues': issues,
          'section05_images': {p.name: coverage[p.relative_to(ROOT).as_posix()]
                               for p in notes if p.parent.name.startswith('05.')},
          'unused_section05_images': [p.name for p in (ROOT / 'Картинки' / '05. Профессиональная разработка').glob('*.png')
                                     if p.resolve() not in used]}
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(bool(issues))
