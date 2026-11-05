#!/usr/bin/env python3
"""Extrai o PDF "React com Next.js e IA" para o deck da rota /next.

Saidas:
  - public/next-media/pNNN.webp        pagina inteira, 1920x1080 (fundo do slide)
  - public/next-media/pNNN-t.webp      miniatura 480x270 (grade e apresentador)
  - data/next-deck.json                titulos + RASCUNHO dos blocos de codigo/prompt

O texto dos blocos e so um rascunho: o ToUnicode do PDF corrompe as ligaduras
da JetBrains Mono (// vira ./, => vira <>, || vira <|, ...). O texto correto
vive em data/next-code-overrides.json, editado a mao e NUNCA sobrescrito por
este script. Aqui so listamos os blocos que ainda nao tem correcao.

Uso: python3 scripts/extract-pdf.py [PDF] [JSON] [PASTA_MEDIA] [--no-images]
(sem argumentos, usa apresentacao_RNIA_*.pdf da raiz do repo)
"""
import glob
import json
import os
import re
import sys
import unicodedata

import fitz  # PyMuPDF
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
NO_IMAGES = '--no-images' in sys.argv

if args:
    PDF = args[0]
else:
    found = sorted(glob.glob(os.path.join(ROOT, 'apresentacao_RNIA_*.pdf')))
    if not found:
        sys.exit('PDF nao encontrado (esperado apresentacao_RNIA_*.pdf na raiz do repo)')
    PDF = found[0]
OUT = args[1] if len(args) > 1 else os.path.join(ROOT, 'data', 'next-deck.json')
MEDIA = args[2] if len(args) > 2 else os.path.join(ROOT, 'public', 'next-media')
OVERRIDES = os.path.join(ROOT, 'data', 'next-code-overrides.json')

STAGE_W, STAGE_H = 960, 540      # palco do deck
RENDER_W, RENDER_H = 1920, 1080  # 2x o palco, para ficar nitido em telas grandes
THUMB_W, THUMB_H = 480, 270
WEBP_Q = 80
K = STAGE_W / 720.0              # pt do PDF -> px do palco (4/3)

MONO_RE = re.compile(r'JetBrains|Courier|Mono|Consolas', re.I)

doc = fitz.open(PDF)
os.makedirs(MEDIA, exist_ok=True)
os.makedirs(os.path.dirname(OUT), exist_ok=True)


def px(v):
    return round(v * K, 1)


def mono_rows(page):
    """Linhas de texto monoespacado, ja unidas por linha visual."""
    rows = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if MONO_RE.search(s['font']) and s['text'].strip():
                    rows.append(s)
    rows.sort(key=lambda s: ((s['bbox'][1] + s['bbox'][3]) / 2, s['bbox'][0]))
    merged = []
    for s in rows:
        cy = (s['bbox'][1] + s['bbox'][3]) / 2
        if merged and abs(merged[-1]['cy'] - cy) < 2.5 and s['bbox'][0] >= merged[-1]['x0']:
            merged[-1]['spans'].append(s)
        else:
            merged.append({'cy': cy, 'x0': s['bbox'][0], 'spans': [s]})
    # colunas lado a lado (antes/depois) caem na mesma linha visual: separa por vao largo
    cols = []
    for m in merged:
        sp = sorted(m['spans'], key=lambda s: s['bbox'][0])
        cur = [sp[0]]
        for s in sp[1:]:
            if s['bbox'][0] - cur[-1]['bbox'][2] > 8 * 0.6 * s['size']:
                cols.append(cur)
                cur = [s]
            else:
                cur.append(s)
        cols.append(cur)
    out = []
    for sp in cols:
        size = sp[0]['size']
        adv = 0.6 * size
        x0 = sp[0]['bbox'][0]
        text = ''
        end = None
        for s in sp:
            if end is not None:
                gap = round((s['bbox'][0] - end) / adv)
                if gap > 0:
                    text += ' ' * gap
            text += s['text']
            end = s['bbox'][2]
        out.append({
            'text': text.rstrip(),
            'x0': x0,
            'x1': sp[-1]['bbox'][2],
            'y0': min(s['bbox'][1] for s in sp),
            'y1': max(s['bbox'][3] for s in sp),
            'size': size,
        })
    return out


def row_card(page, r):
    """Cartao (retangulo preenchido) que contem a linha, ou None."""
    best = None
    for d in page.get_drawings():
        rc = d.get('rect')
        if rc is None or d.get('fill') is None or sum(d['fill']) < 0.02:
            continue  # sem preenchimento, ou preto puro (sombra/clip de texto)
        if rc.width > 700 and rc.height > 380:
            continue  # fundo da pagina
        if rc.width < 30 or rc.height < 12:
            continue
        if rc.x0 <= r['x0'] + 1 and rc.y0 <= r['y0'] + 1 and rc.x1 >= r['x1'] - 1 and rc.y1 >= r['y1'] - 1:
            if best is None or rc.width * rc.height < best.width * best.height:
                best = rc
    return None if best is None else (best.x0, best.y0, best.x1, best.y1)


def group_blocks(page, rows):
    """Une linhas do mesmo cartao (ou proximas, se nao houver cartao).
    Linhas em branco do codigo viram gaps verticais e ficam no mesmo bloco."""
    blocks = []
    for r in rows:
        r['card'] = row_card(page, r)
        placed = None
        for b in blocks:
            gap = r['y0'] - b['y1']
            if r['card'] is not None and r['card'] == b['card']:
                ok = -1 <= gap < 4 * r['size']
            else:
                ok = (
                    r['card'] is None and b['card'] is None
                    and -1 <= gap < 1.0 * r['size'] + 1
                    and r['x0'] < b['x1'] + 2 and b['x0'] < r['x1'] + 2
                )
            if ok:
                placed = b
                break
        if placed:
            placed['rows'].append(r)
            placed['x0'] = min(placed['x0'], r['x0'])
            placed['x1'] = max(placed['x1'], r['x1'])
            placed['y1'] = max(placed['y1'], r['y1'])
        else:
            blocks.append({'rows': [r], 'card': r['card'], 'x0': r['x0'], 'x1': r['x1'], 'y0': r['y0'], 'y1': r['y1']})
    blocks.sort(key=lambda b: (round(b['y0']), b['x0']))
    return blocks


def block_rect(b):
    if b['card'] is not None:
        return b['card']
    pad = 6
    return b['x0'] - pad, b['y0'] - pad, b['x1'] + pad, b['y1'] + pad


def block_heading(page, b, rect):
    """Titulo curto do cartao ("CODIGO DE REFERENCIA", "O PEDIDO A IA"): texto nao
    monoespacado logo acima da primeira linha de codigo, dentro do bloco."""
    first = b['rows'][0]
    best = None
    for blk in page.get_text('dict')['blocks']:
        for l in blk.get('lines', []):
            for s in l['spans']:
                t = s['text'].strip()
                if not t or MONO_RE.search(s['font']) or s['size'] > 10.5:
                    continue
                bb = s['bbox']
                if bb[0] >= rect[0] - 2 and bb[2] <= rect[2] + 2 and rect[1] - 2 <= bb[1] and bb[3] <= first['y0'] + 3 and first['y0'] - bb[3] < 14:
                    if best is None or bb[3] > best[0]:
                        best = (bb[3], t)
    return unicodedata.normalize('NFKC', best[1]) if best else None


def block_text(b):
    rows = b['rows']
    x0 = min(r['x0'] for r in rows)
    diffs = [rows[i + 1]['y0'] - rows[i]['y0'] for i in range(len(rows) - 1)]
    pitch = min(diffs) if diffs else rows[0]['size'] * 1.6
    lines = []
    for i, r in enumerate(rows):
        if i:
            blanks = round((r['y0'] - rows[i - 1]['y0']) / pitch) - 1
            lines.extend([''] * max(0, blanks))
        adv = 0.6 * r['size']
        extra = round((r['x0'] - x0) / adv) if not r['text'].startswith(' ') else 0
        lines.append(' ' * max(0, extra) + r['text'])
    return '\n'.join(lines)


def page_title(page, n):
    best = None
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                t = s['text'].strip()
                if MONO_RE.search(s['font']) or len(re.findall(r'[A-Za-zÀ-ÿ]', t)) < 3:
                    continue
                key = (round(s['size'], 1), -s['bbox'][1])
                if best is None or key > best[0]:
                    best = (key, s)
    if not best:
        return f'Slide {n}'
    top = best[1]
    # une linhas seguintes do mesmo corpo (titulo que quebra em 2 linhas)
    parts = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if abs(s['size'] - top['size']) < 0.3 and s['font'] == top['font'] and s['text'].strip():
                    if 0 <= s['bbox'][1] - top['bbox'][1] < top['size'] * 2.2 and abs(s['bbox'][0] - top['bbox'][0]) < 40:
                        parts.append((s['bbox'][1], s['bbox'][0], s['text'].strip()))
    parts.sort()
    title = ' '.join(p[2] for p in parts) or top['text'].strip()
    title = re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', title)).strip()[:90]
    # nunca expor e-mail no titulo da aba / URL
    return f'Slide {n}' if '@' in title or not title else title


def save_images(page, n):
    big = os.path.join(MEDIA, f'p{n:03d}.webp')
    thumb = os.path.join(MEDIA, f'p{n:03d}-t.webp')
    pix = page.get_pixmap(matrix=fitz.Matrix(RENDER_W / 720.0, RENDER_H / 405.0), alpha=False)
    img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    if img.size != (RENDER_W, RENDER_H):
        img = img.resize((RENDER_W, RENDER_H), Image.LANCZOS)
    img.save(big, 'WEBP', quality=WEBP_Q, method=6)
    img.resize((THUMB_W, THUMB_H), Image.LANCZOS).save(thumb, 'WEBP', quality=70, method=6)


slides = []
for i, page in enumerate(doc):
    n = i + 1
    if not NO_IMAGES:
        save_images(page, n)
    blocks = []
    for j, b in enumerate(group_blocks(page, mono_rows(page))):
        x0, y0, x1, y1 = block_rect(b)
        blocks.append({
            'id': f'b{j + 1}',
            'box': {'x': px(x0), 'y': px(y0), 'w': px(x1 - x0), 'h': px(y1 - y0)},
            'heading': block_heading(page, b, (x0, y0, x1, y1)),
            'lines': block_text(b).count('\n') + 1,
            'text': block_text(b),
        })
    slides.append({
        'n': n,
        'title': page_title(page, n),
        'img': f'p{n:03d}.webp',
        'thumb': f'p{n:03d}-t.webp',
        'blocks': blocks,
    })

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'w': STAGE_W, 'h': STAGE_H, 'slides': slides}, f, ensure_ascii=False, indent=1)
    f.write('\n')

# Relatorio: blocos do rascunho ainda sem decisao no arquivo de correcoes.
overrides = {}
if os.path.exists(OVERRIDES):
    with open(OVERRIDES, encoding='utf-8') as f:
        overrides = json.load(f)
pending = [(s['n'], b['id']) for s in slides for b in s['blocks'] if b['id'] not in overrides.get(str(s['n']), {})]
total = sum(len(s['blocks']) for s in slides)
print(f'{len(slides)} paginas, {total} blocos monoespacados detectados -> {OUT}')
if pending:
    print(f'ATENCAO: {len(pending)} blocos sem entrada em data/next-code-overrides.json (ficam sem botao):')
    print('  ' + ', '.join(f'{n}:{bid}' for n, bid in pending))
