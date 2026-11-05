import raw from '@/data/next-deck.json'
import overridesRaw from '@/data/next-code-overrides.json'
import { Box, CodeBlock, DeckSource, Element, Slide, makeSource } from '@/lib/deck-core'

/* ------------------------------------------------------------------ *
 * Deck "React com Next.js e IA" (rota /next), vindo do PDF.
 *
 * Cada pagina do PDF e uma imagem WebP que cobre o palco 960x540 inteiro
 * (fidelidade visual 100%). O que e copiavel (codigo, prompts, comandos)
 * vira um elemento 'copy' invisivel, posicionado sobre o cartao do PDF,
 * que recebe os mesmos botoes Copiar / tela cheia do deck do PPTX.
 *
 * Fontes de dados:
 *  - data/next-deck.json            GERADO por `npm run extract:next`
 *                                   (titulos, imagens, caixas e RASCUNHO dos blocos)
 *  - data/next-code-overrides.json  EDITADO A MAO: texto correto de cada bloco.
 *                                   O extrator nunca o sobrescreve. O texto do
 *                                   rascunho NAO e usado, porque o ToUnicode do PDF
 *                                   corrompe as ligaduras da JetBrains Mono.
 * ------------------------------------------------------------------ */

type RawBlock = {
  id: string
  box: Box
  heading: string | null
  text: string
}
type RawSlide = { n: number; title: string; img: string; thumb: string; blocks: RawBlock[] }

type Override = {
  skip?: boolean
  kind?: 'code' | 'prompt' | 'cmd'
  label?: string
  /** uma entrada por linha; nos prompts, as linhas ja vem unidas por paragrafo */
  text?: string[]
}
type Overrides = Record<string, Record<string, Override>>

const slidesRaw = raw.slides as unknown as RawSlide[]
const overrides = overridesRaw as unknown as Overrides

/** Titulos que o extrator nao consegue derivar (paginas so com imagem ou metadados). */
const TITLE_OVERRIDES: Record<number, string> = {
  1: 'Abertura',
  187: 'Versão do material',
}

const SMALL_CAPS = new Set(['IA', 'SQL', 'URL', 'API', 'RLS', 'UI', 'TSX', 'TS'])

/** "O PEDIDO À IA" -> "O pedido à IA"; caminhos de arquivo viram minusculos. */
export function headingToLabel(heading: string): string {
  return heading
    .split(' · ')
    .map((part) => {
      if (/[/.]/.test(part) && !/\s/.test(part)) return part.toLowerCase()
      const words = part.toLowerCase().split(' ')
      return words
        .map((w, i) => {
          const up = w.toUpperCase()
          if (SMALL_CAPS.has(up)) return up
          return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w
        })
        .join(' ')
    })
    .join(' · ')
}

const EXPAND_MIN_LINES = 5
const EXPAND_MIN_CHARS = 300

const codeBlocks: CodeBlock[] = []

const slides: Slide[] = slidesRaw.map((s) => {
  const title = TITLE_OVERRIDES[s.n] ?? s.title
  const els: Element[] = [
    {
      kind: 'image',
      id: 'bg',
      box: { x: 0, y: 0, w: raw.w, h: raw.h },
      src: s.img,
      thumb: s.thumb,
      alt: title,
    },
  ]
  for (const b of s.blocks) {
    const o = overrides[String(s.n)]?.[b.id]
    // sem correcao curada o rascunho nao e confiavel: o bloco fica sem botao
    if (!o || o.skip || !o.text || o.text.length === 0) continue
    const text = o.text.join('\n')
    const lines = o.text.length
    codeBlocks.push({
      key: `s${s.n}-${b.id}`,
      slide: s.n,
      elementId: b.id,
      text,
      label: o.label ?? (b.heading ? headingToLabel(b.heading) : title),
      lines,
      kind: o.kind ?? 'code',
      expandable: o.kind !== 'cmd' && (lines >= EXPAND_MIN_LINES || text.length >= EXPAND_MIN_CHARS),
      box: b.box,
    })
    els.push({ kind: 'copy', id: b.id, box: b.box })
  }
  return { n: s.n, els, notes: '' }
})

const titles = slidesRaw.map((s) => TITLE_OVERRIDES[s.n] ?? s.title)

export const nextSource: DeckSource = makeSource({
  basePath: '/next',
  mediaPath: '/next-media',
  docTitle: 'React com Next.js e IA',
  slides,
  titles,
  codeBlocks,
  preload: 'near',
})

export const NEXT_TOTAL = nextSource.total
export const nextTitles = titles
