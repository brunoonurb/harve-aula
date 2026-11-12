/* ------------------------------------------------------------------ *
 * Nucleo do motor de slides: tipos e utilitarios PUROS, sem dados.
 * Nao importe aqui nenhum JSON: este modulo e compartilhado pelas duas
 * apresentacoes (/ e /next) e nao deve puxar o deck de uma para o bundle
 * da outra. Os dados ficam em lib/deck.ts e lib/next-deck.ts.
 * ------------------------------------------------------------------ */

/* Tipos: espelham o que scripts/extract-pptx.py exporta (medidas em px do palco). */

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
  kind: 'shape' | 'image' | 'copy'
  box: Box
  id?: string | null
  geom?: string
  fill?: string
  line?: { color: string; width: number }
  radius?: number
  text?: TextBody
  src?: string
  /** miniatura (grade/apresentador); so o deck /next usa */
  thumb?: string
  /** texto alternativo da imagem */
  alt?: string
  crop?: { l: number; t: number; r: number; b: number }
}

export type Slide = { n: number; els: Element[]; notes: string }

export type Deck = { w: number; h: number; slides: Slide[] }

/** O palco e sempre 960x540 (16:9), nas duas apresentacoes. */
export const SLIDE_W = 960
export const SLIDE_H = 540

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
  /** natureza do bloco: muda so os rotulos dos botoes */
  kind?: 'code' | 'prompt' | 'cmd'
  box: Box
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

export type SlideDownloadGroup = {
  box: Box
  items: SlideDownload[]
  /** botoes grandes que quebram linha (slide dedicado a downloads) */
  large?: boolean
}

/* ------------------------------------------------------------------ *
 * Fonte de dados do deck
 * ------------------------------------------------------------------ */

/**
 * Tudo que o motor (Deck, grade, apresentador...) precisa saber sobre uma
 * apresentacao. Cada rota monta a sua: lib/deck.ts (/) e lib/next-deck.ts (/next).
 */
export type DeckSource = {
  /** prefixo da rota: '' para / e '/slide/N'; '/next' para /next e /next/slide/N */
  basePath: string
  /** pasta publica das imagens (sem barra final) */
  mediaPath: string
  /** sufixo do document.title */
  docTitle: string
  slides: Slide[]
  titles: string[]
  total: number
  codeBlocks: CodeBlock[]
  /** 'all' pre-carrega todas as imagens; 'near' so as vizinhas (decks grandes) */
  preload: 'all' | 'near'
  codeBlocksOf: (slideN: number) => CodeBlock[]
  codeBlockFor: (slideN: number, elementId: string | null | undefined) => CodeBlock | undefined
  downloadsOf: (slideN: number) => SlideDownloadGroup | undefined
}

export function makeSource(o: {
  basePath: string
  mediaPath: string
  docTitle: string
  slides: Slide[]
  titles: string[]
  codeBlocks: CodeBlock[]
  preload: 'all' | 'near'
  downloads?: Record<number, SlideDownloadGroup>
}): DeckSource {
  const byElement = new Map(o.codeBlocks.map((b) => [`${b.slide}:${b.elementId}`, b]))
  const bySlide = new Map<number, CodeBlock[]>()
  for (const b of o.codeBlocks) bySlide.set(b.slide, [...(bySlide.get(b.slide) ?? []), b])
  return {
    basePath: o.basePath,
    mediaPath: o.mediaPath,
    docTitle: o.docTitle,
    slides: o.slides,
    titles: o.titles,
    total: o.slides.length,
    codeBlocks: o.codeBlocks,
    preload: o.preload,
    codeBlocksOf: (n) => bySlide.get(n) ?? [],
    codeBlockFor: (n, id) => byElement.get(`${n}:${String(id ?? '0')}`),
    downloadsOf: (n) => o.downloads?.[n],
  }
}
