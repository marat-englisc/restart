"""Переименование заметок с обновлением всех вики-ссылок. Аргументы: корень, затем пары старый_путь_без_md новый_путь_без_md."""
import os, re, sys
root = sys.argv[1]
pairs = list(zip(sys.argv[2::2], sys.argv[3::2]))
for old, new in pairs:
    os.rename(os.path.join(root, old + '.md'), os.path.join(root, new + '.md'))
for d, _, fs in os.walk(root):
    if '.obsidian' in d:
        continue
    for f in fs:
        if not f.endswith('.md'):
            continue
        p = os.path.join(d, f)
        t = open(p, encoding='utf-8').read()
        orig = t
        for old, new in pairs:
            old_base = old.rsplit('/', 1)[-1]
            new_base = new.rsplit('/', 1)[-1]
            # полные пути
            t = t.replace('[[' + old + '|', '[[' + new + '|').replace('[[' + old + ']]', '[[' + new + ']]').replace('[[' + old + '#', '[[' + new + '#')
            # короткие имена
            t = re.sub(r'\[\[' + re.escape(old_base) + r'(?=[\]|#])', '[[' + new_base, t)
            # подписи ссылок вида |15. Старое]]
            t = t.replace('|' + old_base + ']]', '|' + new_base + ']]')
        if t != orig:
            open(p, 'w', encoding='utf-8', newline='\n').write(t)
print('renamed', len(pairs))
