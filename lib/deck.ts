import raw from '@/data/deck.json'
import {
  CodeBlock,
  Deck,
  DeckSource,
  Element,
  Slide,
  SlideDownloadGroup,
  TextBody,
  makeSource,
} from '@/lib/deck-core'

/* Tudo que e puro (tipos, fontes, placeholders...) vive em lib/deck-core.ts.
 * Este arquivo so liga o deck do PPTX (data/deck.json) ao motor. */
export * from '@/lib/deck-core'

export const deck = raw as Deck
export const slides = deck.slides
export const TOTAL = slides.length

/* ------------------------------------------------------------------ *
 * Blocos de codigo / prompts (detectados pela fonte Consolas)
 * ------------------------------------------------------------------ */

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

export const slideTitles = slides.map((s) => slideTitle(s))

/* ------------------------------------------------------------------ *
 * Downloads da oficina
 * ------------------------------------------------------------------ */

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

/** Fonte de dados do deck "Da Planilha ao Aplicativo" (rotas / e /slide/N). */
export const mainSource: DeckSource = makeSource({
  basePath: '',
  mediaPath: '/media',
  docTitle: 'Da Planilha ao Aplicativo',
  slides,
  titles: slideTitles,
  codeBlocks,
  preload: 'all',
  downloads: slideDownloads,
})

export const { codeBlockFor, codeBlocksOf } = mainSource
