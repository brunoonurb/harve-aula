#!/usr/bin/env python3
"""Extrai geometria + estilo de cada slide do PPTX (export do Google Slides) para JSON."""
import json, os, re, sys, glob
import xml.etree.ElementTree as ET

A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
def a(t): return f'{{{A}}}{t}'
def p(t): return f'{{{P}}}{t}'

EMU_PX = 9525.0          # 1 px @96dpi
PT_PX  = 4.0 / 3.0       # 1 pt -> px

SRC = sys.argv[1]
OUT = sys.argv[2]
MEDIA_OUT = sys.argv[3] if len(sys.argv) > 3 else None

# Aceita tanto um .pptx quanto uma pasta ja descompactada.
_tmp = None
if os.path.isfile(SRC):
    import shutil, tempfile, zipfile
    _tmp = tempfile.mkdtemp(prefix='pptx-')
    with zipfile.ZipFile(SRC) as z:
        z.extractall(_tmp)
    SRC = _tmp

def emu(v): return round(int(v) / EMU_PX, 2)
def hundredths(v): return int(v) / 100.0   # sz="2200" -> 22pt

def color_of(node):
    """node: elemento que contem <a:srgbClr>/<a:schemeClr>."""
    if node is None: return None
    c = node.find(a('srgbClr'))
    if c is not None:
        hexv = c.get('val', '000000')
        al = c.find(a('alpha'))
        if al is not None:
            op = int(al.get('val')) / 100000.0
            r, g, b = (int(hexv[i:i+2], 16) for i in (0, 2, 4))
            return f'rgba({r},{g},{b},{round(op,3)})'
        return '#' + hexv
    sc = node.find(a('schemeClr'))
    if sc is not None:
        m = {'dk1': '#000000', 'lt1': '#ffffff', 'dk2': '#000000', 'lt2': '#ffffff'}
        return m.get(sc.get('val'), '#000000')
    return None

def fill_of(spPr):
    sf = spPr.find(a('solidFill'))
    if sf is not None: return color_of(sf)
    return None

def line_of(spPr):
    ln = spPr.find(a('ln'))
    if ln is None: return None
    if ln.find(a('noFill')) is not None: return None
    col = None
    sf = ln.find(a('solidFill'))
    if sf is not None: col = color_of(sf)
    if col is None: return None
    w = ln.get('w')
    return {'color': col, 'width': round(int(w) / EMU_PX, 2) if w else 1.0}

def xfrm_of(spPr):
    xf = spPr.find(a('xfrm'))
    if xf is None: return None
    off, ext = xf.find(a('off')), xf.find(a('ext'))
    d = {'x': emu(off.get('x')), 'y': emu(off.get('y')),
         'w': emu(ext.get('cx')), 'h': emu(ext.get('cy'))}
    if xf.get('flipH') == '1': d['flipH'] = True
    if xf.get('flipV') == '1': d['flipV'] = True
    return d

def radius_of(spPr, box):
    geom = spPr.find(a('prstGeom'))
    if geom is None: return None
    if geom.get('prst') != 'roundRect': return None
    gd = geom.find(a('avLst/') + '') if False else None
    adj = None
    av = geom.find(a('avLst'))
    if av is not None:
        for g in av.findall(a('gd')):
            if g.get('name') == 'adj':
                m = re.search(r'val (-?\d+)', g.get('fmla', ''))
                if m: adj = int(m.group(1)) / 100000.0
    if adj is None: adj = 0.16667
    return round(adj * min(box['w'], box['h']), 2)

def runs_of(para):
    out = []
    for el in para:
        if el.tag == a('r'):
            rPr = el.find(a('rPr'))
            t = el.find(a('t'))
            txt = t.text if (t is not None and t.text) else ''
            run = {'t': txt}
            if rPr is not None:
                if rPr.get('b') == '1': run['b'] = True
                if rPr.get('i') == '1': run['i'] = True
                if rPr.get('u') not in (None, 'none'): run['u'] = True
                if rPr.get('strike') not in (None, 'noStrike'): run['s'] = True
                if rPr.get('cap') == 'all': run['caps'] = True
                sz = rPr.get('sz')
                if sz: run['sz'] = hundredths(sz)
                col = color_of(rPr.find(a('solidFill')))
                if col: run['c'] = col
                hl = color_of(rPr.find(a('highlight')))   # fundo do trecho (code chip)
                if hl: run['hl'] = hl
                lat = rPr.find(a('latin'))
                if lat is not None and lat.get('typeface'): run['f'] = lat.get('typeface')
                link = rPr.find(a('hlinkClick'))
                if link is not None: run['rid'] = link.get(f'{{{R}}}id')
            out.append(run)
        elif el.tag == a('br'):
            out.append({'br': True})
    return out

def text_of(sp, rels):
    tx = sp.find(p('txBody'))
    if tx is None: return None
    bodyPr = tx.find(a('bodyPr'))
    body = {'paras': []}
    if bodyPr is not None:
        body['anchor'] = bodyPr.get('anchor', 't')
        for k, css in (('lIns', 'pl'), ('tIns', 'pt'), ('rIns', 'pr'), ('bIns', 'pb')):
            v = bodyPr.get(k)
            body[css] = round(int(v) / EMU_PX, 2) if v is not None else 1.2
        body['wrap'] = bodyPr.get('wrap', 'square')
    has_text = False
    for para in tx.findall(a('p')):
        pPr = para.find(a('pPr'))
        pd = {}
        if pPr is not None:
            pd['algn'] = pPr.get('algn', 'l')
            marL = pPr.get('marL'); indent = pPr.get('indent')
            if marL and int(marL): pd['marL'] = round(int(marL) / EMU_PX, 2)
            if indent and int(indent): pd['indent'] = round(int(indent) / EMU_PX, 2)
            ln = pPr.find(a('lnSpc'))
            if ln is not None:
                pct = ln.find(a('spcPct'))
                if pct is not None: pd['lh'] = round(int(pct.get('val')) / 100000.0, 4)
                pts = ln.find(a('spcPts'))
                if pts is not None: pd['lhpt'] = hundredths(pts.get('val'))
            for tag, key in (('spcBef', 'sb'), ('spcAft', 'sa')):
                e = pPr.find(a(tag))
                if e is not None:
                    pts = e.find(a('spcPts'))
                    if pts is not None and int(pts.get('val')): pd[key] = hundredths(pts.get('val'))
            bc = pPr.find(a('buChar'))
            if bc is not None: pd['bu'] = bc.get('char')
            if pPr.find(a('buAutoNum')) is not None: pd['bunum'] = True
        rs = runs_of(para)
        if any(r.get('t', '').strip() for r in rs): has_text = True
        for r in rs:
            if r.get('rid'):
                r['href'] = rels.get(r.pop('rid'), '')
        pd['runs'] = rs
        body['paras'].append(pd)
    # normaliza paragrafos vazios: herdam o estilo do run anterior (preserva linhas em branco)
    last = None
    for pd in body['paras']:
        real = [r for r in pd['runs'] if r.get('t', '').strip()]
        if real:
            last = {k: v for k, v in real[0].items() if k in ('sz', 'f', 'c', 'b', 'i')}
        elif last:
            pd['runs'] = [dict(last, t='')]
            pd['empty'] = True
        else:
            pd['empty'] = True
    return body if has_text else None

def rels_of(slide_path):
    base = os.path.basename(slide_path)
    rp = os.path.join(os.path.dirname(slide_path), '_rels', base + '.rels')
    d = {}
    if os.path.exists(rp):
        for rel in ET.parse(rp).getroot():
            d[rel.get('Id')] = rel.get('Target')
    return d

def notes_of(n, rels):
    """Notas do slide (texto puro)."""
    for rid, target in rels.items():
        if 'notesSlide' in target:
            path = os.path.normpath(os.path.join(SRC, 'ppt/slides', target))
            if not os.path.exists(path): continue
            root = ET.parse(path).getroot()
            lines = []
            for sp in root.iter(p('sp')):
                ph = sp.find(f".//{p('ph')}")
                if ph is not None and ph.get('type') == 'sldNum': continue
                for para in sp.iter(a('p')):
                    txt = ''.join(t.text or '' for t in para.iter(a('t')))
                    lines.append(txt)
            return '\n'.join(lines).strip()
    return ''

slides = []
files = sorted(glob.glob(os.path.join(SRC, 'ppt/slides/slide*.xml')),
               key=lambda f: int(re.search(r'(\d+)', os.path.basename(f)).group(1)))
for f in files:
    num = int(re.search(r'(\d+)', os.path.basename(f)).group(1))
    rels = rels_of(f)
    root = ET.parse(f).getroot()
    tree = root.find(f"./{p('cSld')}/{p('spTree')}")
    els = []
    for node in tree:
        if node.tag == p('sp'):
            spPr = node.find(p('spPr'))
            box = xfrm_of(spPr)
            if box is None: continue
            el = {'kind': 'shape', 'box': box}
            geom = spPr.find(a('prstGeom'))
            el['geom'] = geom.get('prst') if geom is not None else 'rect'
            fill = fill_of(spPr)
            if fill: el['fill'] = fill
            line = line_of(spPr)
            if line: el['line'] = line
            r = radius_of(spPr, box)
            if r: el['radius'] = r
            body = text_of(node, rels)
            if body: el['text'] = body
            name = node.find(f"./{p('nvSpPr')}/{p('cNvPr')}")
            el['id'] = name.get('id') if name is not None else None
            if not (fill or line or body): continue
            els.append(el)
        elif node.tag == p('pic'):
            spPr = node.find(p('spPr'))
            box = xfrm_of(spPr)
            blip = node.find(f"./{p('blipFill')}/{a('blip')}")
            rid = blip.get(f'{{{R}}}embed') if blip is not None else None
            target = rels.get(rid, '')
            src = os.path.basename(target)
            el = {'kind': 'image', 'box': box, 'src': src}
            sr = node.find(f"./{p('blipFill')}/{a('srcRect')}")
            if sr is not None and any(int(sr.get(k, 0)) for k in ('l', 't', 'r', 'b')):
                el['crop'] = {k: int(sr.get(k, 0)) / 100000.0 for k in ('l', 't', 'r', 'b')}
            spr2 = spPr.find(a('prstGeom'))
            rr = radius_of(spPr, box)
            if rr: el['radius'] = rr
            els.append(el)
    slides.append({'n': num, 'els': els, 'notes': notes_of(num, rels)})

json.dump({'w': 960, 'h': 540, 'slides': slides}, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'{len(slides)} slides -> {OUT}')

if MEDIA_OUT:
    import shutil
    src_media = os.path.join(SRC, 'ppt', 'media')
    os.makedirs(MEDIA_OUT, exist_ok=True)
    n = 0
    for f in os.listdir(src_media):
        shutil.copy2(os.path.join(src_media, f), os.path.join(MEDIA_OUT, f))
        n += 1
    print(f'{n} imagens -> {MEDIA_OUT}')

if _tmp:
    import shutil
    shutil.rmtree(_tmp, ignore_errors=True)
