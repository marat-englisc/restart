"""Единый шаблон заметок: свойства (tags), коллауты вместо **ВАЖНО!**, нижняя навигация.
Идемпотентен: повторный запуск пересобирает frontmatter и навигацию."""
import os, re, sys

ROOT = sys.argv[1]
SECTIONS = {
    '01. Основы конфигурирования': 'конфигурирование',
    '02. Программирование': 'программирование',
    '03. Язык запросов и СКД': 'запросы',
    '04. Программирование управляемых форм': 'формы',
    '05. Профессиональная разработка': 'профессия',
    '99. Шпаргалки': 'шпаргалка',
}
NAV_MARK = '%% навигация %%'

NAV_LINE_PATTERNS = [
    re.compile(r'^Далее: \[\[[^\]]+\]\]\.?\s*$'),
    re.compile(r'^\[\[00\. Навигация по разделу\|К темам раздела\]\]\s*$'),
    re.compile(r'^\[\[00\. Оглавление\|К общему оглавлению\]\]\s*$'),
    re.compile(r'^Основной маршрут: \[\[00\. Навигация по разделу\]\]\. Далее: \[\[[^\]]+\]\]\.\s*$'),
    re.compile(r'^Следующий обязательный шаг: \[\[[^\]]+\]\]\.\s*$'),
]

IMPORTANT = re.compile(r'^\*\*(ВАЖНО!|ВАЖНО|ВАЖНАЯ НАСТРОЙКА|Важный момент)\*\*\s*!?\s*')


def strip_frontmatter(t):
    if t.startswith('---\n'):
        end = t.find('\n---\n', 4)
        if end != -1:
            return t[end + 5:]
    return t


def convert_important(lines):
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = IMPORTANT.match(line)
        if m:
            title = 'Важно'
            rest = line[m.end():]
            if rest and rest[0].islower():
                rest = rest[0].upper() + rest[1:]
            block = [rest] if rest else []
            i += 1
            while i < len(lines) and lines[i].strip() != '' and not lines[i].startswith('```') and not lines[i].startswith('#'):
                block.append(lines[i])
                i += 1
            if out and out[-1].strip() != '':
                out.append('')
            out.append(f'> [!warning] {title}')
            for b in block:
                out.append('> ' + b if b else '>')
            continue
        out.append(line)
        i += 1
    return out


def title_of(fname):
    return fname[:-3]


def main():
    for sec, tag in SECTIONS.items():
        d = os.path.join(ROOT, sec)
        if not os.path.isdir(d):
            continue
        notes = sorted(f for f in os.listdir(d) if f.endswith('.md'))
        has_nav = '00. Навигация по разделу.md' in notes
        for idx, f in enumerate(notes):
            p = os.path.join(d, f)
            t = open(p, encoding='utf-8').read().replace('\r\n', '\n')
            old_tags = []
            if t.startswith('---\n'):
                fm_end = t.find('\n---\n', 4)
                old_tags = re.findall(r'^  - (.+)$', t[4:fm_end], re.M)
            t = strip_frontmatter(t)
            if NAV_MARK in t:
                t = t[:t.index(NAV_MARK)]
            lines = t.rstrip('\n').split('\n')
            lines = [l for l in lines if not any(pt.match(l) for pt in NAV_LINE_PATTERNS)]
            lines = convert_important(lines)
            # убрать хвостовые пустые строки и одиночные разделители
            while lines and lines[-1].strip() in ('', '---'):
                lines.pop()
            body = '\n'.join(lines).strip('\n')
            body = re.sub(r'\n{3,}', '\n\n', body)

            sec_tag = tag
            if sec.startswith('03') and f[:2].isdigit() and 19 <= int(f[:2]) <= 28:
                sec_tag = 'скд'
            kind = []
            if 'Практика' in f:
                kind.append('1С/практика')
            if 'Ошибки и памятка' in f or sec.startswith('99'):
                kind.append('1С/повторение')
            tags = ['1С/' + sec_tag] + kind
            tags += [x for x in old_tags if x not in tags]
            fm = '---\ntags:\n' + ''.join(f'  - {x}\n' for x in tags) + '---\n'

            nav = []
            prev_ = notes[idx - 1] if idx > 0 else None
            next_ = notes[idx + 1] if idx + 1 < len(notes) else None
            parts = []
            if prev_:
                parts.append(f'← [[{sec}/{title_of(prev_)}|{title_of(prev_)}]]')
            if f != '00. Навигация по разделу.md':
                if has_nav and prev_ != '00. Навигация по разделу.md':
                    parts.append(f'[[{sec}/00. Навигация по разделу|↑ Раздел]]')
                parts.append('[[00. Оглавление|⌂ Оглавление]]')
            else:
                parts.append('[[00. Оглавление|⌂ Оглавление]]')
            if next_:
                parts.append(f'[[{sec}/{title_of(next_)}|{title_of(next_)}]] →')
            footer = f'\n\n{NAV_MARK}\n\n---\n' + ' · '.join(parts) + '\n'
            open(p, 'w', encoding='utf-8', newline='\n').write(fm + '\n' + body + footer)
    print('ok')


main()
