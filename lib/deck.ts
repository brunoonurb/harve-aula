import raw from '@/data/deck.json'

/* ------------------------------------------------------------------ *
 * Tipos: espelham exatamente o que scripts/extract-pptx.py exporta.
 * As medidas ja vem convertidas de EMU para px no palco de 960x540.
 * ------------------------------------------------------------------ */

export type Run = {
  t: string
  b?: boolean
  i?: boolean
  u?: boolean
  s?: boolean
  caps?: boolean
  sz?: number // pt
  c?: string
  hl?: string // fundo do trecho (<a:highlight>)
  f?: string
  href?: string
  br?: boolean
}

export type Para = {
  algn?: 'l' | 'ctr' | 'r' | 'just'
  marL?: number
  indent?: number
  lh?: number // multiplicador de espacamento do PPTX (1.0 = 100%)
  lhpt?: number // espacamento exato em pt
  sb?: number // spcBef em pt
  sa?: number // spcAft em pt
  bu?: string
  bunum?: boolean
  empty?: boolean
  runs: Run[]
}

export type TextBody = {
  paras: Para[]
  anchor?: string
  pl?: number
  pt?: number
  pr?: number
  pb?: number
  wrap?: string
}

export type Box = { x: number; y: number; w: number; h: number; flipH?: boolean; flipV?: boolean }

export type Element = {
  kind: 'shape' | 'image'
  box: Box
  id?: string | null
  geom?: string
  fill?: string
  line?: { color: string; width: number }
  radius?: number
  text?: TextBody
  src?: string
  crop?: { l: number; t: number; r: number; b: number }
}

export type Slide = { n: number; els: Element[]; notes: string }

export type Deck = { w: number; h: number; slides: Slide[] }

export const deck = raw as Deck
export const SLIDE_W = deck.w
export const SLIDE_H = deck.h
export const slides = deck.slides
export const TOTAL = slides.length

/* ------------------------------------------------------------------ *
 * Tipografia
 * ------------------------------------------------------------------ */

/** 1pt = 4/3 px no palco de 960x540 (96dpi). */
export const PT_TO_PX = 4 / 3

/**
 * O PPTX usa Consolas (avanco 0.5498em). A web recebe Roboto Mono
 * (avanco 0.6em); a 0.916 do tamanho, o avanco fica identico (0.55em)
 * e a altura-x pratica bate (0.484 vs 0.488) — os blocos de codigo
 * ocupam exatamente a mesma largura de linha do original.
 */
export const MONO_SCALE = 0.916

/** Espacamento de linha do PPTX: 100% equivale a 1.2x o corpo da fonte. */
export const LINE_SPACING_BASE = 1.2

export type FontSpec = { family: string; weight: number; scale: number }

export function fontSpec(face: string | undefined, bold: boolean | undefined): FontSpec {
  const w = bold ? 700 : 400
  switch (face) {
    case 'Nunito Light':
      return { family: 'var(--font-nunito)', weight: bold ? 700 : 300, scale: 1 }
    case 'Nunito':
      return { family: 'var(--font-nunito)', weight: bold ? 700 : 400, scale: 1 }
    case 'Titillium Web':
      return { family: 'var(--font-titillium)', weight: bold ? 700 : 400, scale: 1 }
    case 'Consolas':
      return { family: 'var(--font-mono)', weight: w, scale: MONO_SCALE }
    case 'Arial':
      return { family: 'Arial, Helvetica, sans-serif', weight: w, scale: 1 }
    default:
      return { family: 'var(--font-nunito)', weight: w, scale: 1 }
  }
}

export function isMono(face: string | undefined) {
  return face === 'Consolas'
}

/* ------------------------------------------------------------------ *
 * Blocos de codigo / prompts
 * ------------------------------------------------------------------ */

export type CodeBlock = {
  /** id estavel: usado na URL do modal e como key de React */
  key: string
  slide: number
  elementId: string
  /** texto puro, pronto para o clipboard (com os 【placeholders】) */
  text: string
  /** rotulo curto para o modal e para o botao */
  label: string
  lines: number
  /** blocos longos abrem em tela cheia; curtos so tem Copiar */
  expandable: boolean
  box: Box
}

const EXPAND_MIN_LINES = 5
const COPY_MIN_CHARS = 20

function plainText(text: TextBody) {
  return text.paras
    .map((p) => p.runs.map((r) => (r.br ? '\n' : r.t ?? '')).join(''))
    .join('\n')
    .replace(/[ \t]+$/gm, '')
}

/** Um shape e bloco de codigo quando todo o texto visivel esta em Consolas. */
function isCodeElement(el: Element) {
  if (!el.text) return false
  const faces = new Set<string | undefined>()
  for (const p of el.text.paras) for (const r of p.runs) if ((r.t ?? '').trim()) faces.add(r.f)
  return faces.size === 1 && faces.has('Consolas')
}

/**
 * Titulo do slide: o cabecalho em Titillium Web mais alto na pagina
 * (e nao o maior corpo — em slides como o 3 e o 34 o numero em destaque
 * e maior que o titulo).
 */
export function slideTitle(slide: Slide): string {
  let best: { y: number; sz: number; t: string } | null = null
  let biggest: { sz: number; t: string } | null = null
  for (const el of slide.els) {
    if (!el.text) continue
    for (const p of el.text.paras) {
      for (const r of p.runs) {
        const t = (r.t ?? '').trim()
        if (!t || r.f !== 'Titillium Web') continue
        const sz = r.sz ?? 0
        if (!biggest || sz > biggest.sz) biggest = { sz, t }
        if (sz < 14) continue
        if (!best || el.box.y < best.y - 2 || (Math.abs(el.box.y - best.y) <= 2 && sz > best.sz)) {
          best = { y: el.box.y, sz, t }
        }
      }
    }
  }
  if (best) return best.t
  if (biggest) return biggest.t
  for (const el of slide.els) {
    if (!el.text) continue
    const t = plainText(el.text).trim()
    if (t) return t.split('\n')[0].slice(0, 60)
  }
  return `Slide ${slide.n}`
}

/** Rotulo do bloco: cabecalho mais proximo acima dele ("Prompt 1 — ..."). */
function blockLabel(slide: Slide, block: Element): string {
  const bx = block.box
  let best: { d: number; t: string } | null = null
  for (const el of slide.els) {
    if (!el.text || el === block) continue
    const t = plainText(el.text).trim()
    if (!t || t.length > 60 || t.includes('\n')) continue
    const heading = el.text.paras.some((p) =>
      p.runs.some((r) => (r.t ?? '').trim() && r.f === 'Titillium Web' && r.b),
    )
    if (!heading) continue
    const above = el.box.y + el.box.h <= bx.y + 4
    const overlapsX = el.box.x < bx.x + bx.w && el.box.x + el.box.w > bx.x
    if (!above || !overlapsX) continue
    const d = bx.y - (el.box.y + el.box.h)
    if (d < 0 || d > 90) continue
    if (!best || d < best.d) best = { d, t }
  }
  return best?.t ?? slideTitle(slide)
}

export const codeBlocks: CodeBlock[] = slides.flatMap((slide) =>
  slide.els.filter(isCodeElement).flatMap((el) => {
    const text = plainText(el.text!)
    if (text.trim().length < COPY_MIN_CHARS) return []
    const lines = el.text!.paras.length
    return [
      {
        key: `s${slide.n}-${el.id ?? '0'}`,
        slide: slide.n,
        elementId: String(el.id ?? '0'),
        text,
        label: blockLabel(slide, el),
        lines,
        expandable: lines >= EXPAND_MIN_LINES,
        box: el.box,
      },
    ]
  }),
)

const byElement = new Map(codeBlocks.map((b) => [`${b.slide}:${b.elementId}`, b]))

export function codeBlockFor(slideN: number, elementId: string | null | undefined) {
  return byElement.get(`${slideN}:${String(elementId ?? '0')}`)
}

export function codeBlocksOf(slideN: number) {
  return codeBlocks.filter((b) => b.slide === slideN)
}

/** Remove os 【】 mantendo o conteudo (valores da planilha-modelo). */
export function stripPlaceholders(text: string) {
  return text.replace(/[【】]/g, '')
}

export function hasPlaceholders(text: string) {
  return /【[^】]*】/.test(text)
}

/**
 * Quebra o texto em pedacos, marcando o que esta entre 【 】.
 * Os proprios 【 】 continuam no texto exibido — o PPTX os mostra e a
 * largura da linha depende deles; o destaque e apenas visual.
 */
export function splitPlaceholders(text: string): { t: string; ph: boolean }[] {
  const out: { t: string; ph: boolean }[] = []
  const re = /【[^】]*】/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), ph: false })
    out.push({ t: m[0], ph: true })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ t: text.slice(last), ph: false })
  return out
}

/**
 * Segmentos de destaque para um corpo de texto inteiro, atravessando runs e
 * paragrafos: no PPTX um 【placeholder】 pode comecar numa linha e terminar na
 * seguinte, e o destaque precisa acompanhar.
 * Chave do mapa: `${indiceDoParagrafo}:${indiceDoRun}`.
 */
export function placeholderSegments(paras: Para[]): Map<string, { t: string; ph: boolean }[]> {
  const out = new Map<string, { t: string; ph: boolean }[]>()
  let open = false
  paras.forEach((p, pi) => {
    p.runs.forEach((r, ri) => {
      const text = r.t ?? ''
      if (!text) return
      const segs: { t: string; ph: boolean }[] = []
      let buf = ''
      for (const ch of text) {
        if (ch === '【' && !open) {
          if (buf) segs.push({ t: buf, ph: false })
          buf = ch
          open = true
        } else if (ch === '】' && open) {
          segs.push({ t: buf + ch, ph: true })
          buf = ''
          open = false
        } else {
          buf += ch
        }
      }
      if (buf) segs.push({ t: buf, ph: open })
      if (segs.some((sg) => sg.ph)) out.set(`${pi}:${ri}`, segs)
    })
    // um placeholder nao atravessa o fim do bloco de texto
  })
  return out
}

/** true quando a cor do texto e clara (destaque precisa de variante escura). */
export function isLightColor(color: string | undefined): boolean {
  if (!color) return false
  let r = 0
  let g = 0
  let b = 0
  const hex = color.trim()
  if (hex.startsWith('#')) {
    const h = hex.slice(1)
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    if (full.length < 6) return false
    r = parseInt(full.slice(0, 2), 16)
    g = parseInt(full.slice(2, 4), 16)
    b = parseInt(full.slice(4, 6), 16)
  } else {
    const m = hex.match(/rgba?\(([^)]+)\)/)
    if (!m) return false
    const parts = m[1].split(',').map((v) => parseFloat(v))
    ;[r, g, b] = parts
  }
  // luminancia relativa aproximada
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6
}

export const slideTitles = slides.map((s) => slideTitle(s))

/* ------------------------------------------------------------------ *
 * Downloads da oficina
 * ------------------------------------------------------------------ */

export type SlideDownload = {
  /** arquivo em public/ */
  href: string
  label: string
  title: string
  /** botao principal (laranja) ou secundario (contorno) */
  primary?: boolean
}

export type SlideDownloadGroup = { box: Box; items: SlideDownload[] }

/**
 * O PPTX nao tem hiperlinks nos cartoes; o slide 15 so diz "Baixe o CSV
 * modelo da Harve". Aqui o texto vira botao de verdade, ancorado no canto
 * superior direito do cartao da planilha-modelo (shape 310), ao lado do
 * titulo "📊 Usando a Planilha-Modelo". As medidas estao no palco 960x540,
 * como o resto do deck. Fica fora do deck.json de proposito: aquele arquivo
 * e gerado por scripts/extract-pptx.py e seria sobrescrito.
 */
export const slideDownloads: Record<number, SlideDownloadGroup> = {
  15: {
    box: { x: 300, y: 258.5, w: 160, h: 26 },
    items: [
      {
        href: '/clientes-modelo.csv',
        label: 'Baixar CSV',
        title: 'Baixar clientes-modelo.csv — cabecalho + 30 linhas de exemplo',
        primary: true,
      },
      {
        href: '/clientes-modelo.xlsx',
        label: 'XLSX',
        title: 'Baixar clientes-modelo.xlsx — a mesma base para abrir no Excel ou Google Sheets',
      },
    ],
  },
}

export function downloadsOf(slideN: number): SlideDownloadGroup | undefined {
  return slideDownloads[slideN]
}
