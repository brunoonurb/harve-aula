import {
  Box,
  CodeBlock,
  Element,
  Para,
  Run,
  SLIDE_H,
  SLIDE_W,
  Slide,
  SlideDownloadGroup,
  makeSource,
} from '@/lib/deck-core'
import {
  AgSlideSpec,
  AgTeamMember,
  agentesDownloads,
  agentesSlides,
  agentesTeam,
} from '@/lib/agentes-content'

/* ------------------------------------------------------------------ *
 * Deck "Time de agentes no Claude Code" (rota /agentes).
 *
 * Os slides sao montados aqui a partir dos specs de agentes-content.ts,
 * como elementos 'shape' com texto (nada de imagens de fundo), com o mesmo
 * visual do deck /next. Todas as medidas sao px do palco 960x540; as fontes
 * em pt (1pt = 4/3 px).
 * ------------------------------------------------------------------ */

/* Paleta (amostrada de public/next-media/p022 e p024) */
const C = {
  paper: '#e9e7e3', // fundo claro
  navy: '#17213d', // fundo escuro / titulos
  card: '#14203a', // cartao de prompt
  amber: '#e0a526', // rotulos
  green: '#1f6e5a', // kicker / selo
  gray: '#4a5068', // subtitulo
  mono: '#e8ecf4', // texto mono sobre o cartao
  line: '#9aa5b1', // conectores
  ghost: '#28345a', // "?" apagado
  white: '#ffffff',
}

const MX = 64 // margem esquerda do conteudo
const CW = 832 // largura do conteudo
const CARD_Y = 168

/* ---------------------------- helpers ---------------------------- */

type ParaOpt = Partial<Run> & { algn?: Para['algn']; lhpt?: number; sa?: number; sb?: number }

function P(t: string, o: ParaOpt = {}): Para {
  const { algn, lhpt, sa, sb, ...run } = o
  return { algn, lhpt, sa, sb, runs: [{ t, f: 'Nunito', ...run }] }
}

type ElOpt = {
  id?: string
  fill?: string
  radius?: number
  line?: { color: string; width: number }
  paras?: Para[]
  anchor?: 't' | 'ctr' | 'b'
  pad?: [number, number, number, number] // top, right, bottom, left
}

function box(x: number, y: number, w: number, h: number, o: ElOpt = {}): Element {
  const el: Element = { kind: 'shape', id: o.id ?? null, box: { x, y, w, h } }
  if (o.fill) el.fill = o.fill
  if (o.radius) el.radius = o.radius
  if (o.line) el.line = o.line
  if (o.paras) {
    const [pt, pr, pb, pl] = o.pad ?? [0, 0, 0, 0]
    el.text = { paras: o.paras, anchor: o.anchor ?? 't', pt, pr, pb, pl, wrap: 'square' }
  }
  return el
}

const bg = (fill: string) => box(0, 0, SLIDE_W, SLIDE_H, { fill })

/** Cabecalho dos slides claros: kicker, titulo e subtitulo (opcional). */
function header(kicker: string, title: string, subtitle?: string): Element[] {
  const els = [
    box(MX, 64, CW, 18, {
      paras: [P(kicker, { sz: 9.5, b: true, caps: true, c: C.green, lhpt: 12 })],
    }),
    box(MX, 84, CW, 40, {
      paras: [P(title, { sz: 21, b: true, c: C.navy, lhpt: 25 })],
    }),
  ]
  if (subtitle) {
    els.push(
      box(MX, 126, CW, 22, { paras: [P(subtitle, { sz: 11, c: C.gray, lhpt: 14 })] }),
    )
  }
  return els
}

/** Estimativa de linhas apos quebra: cols colunas por linha. */
const wrapCount = (s: string, cols: number) => Math.max(1, Math.ceil(s.length / Math.max(1, cols)))

/* ---------------------------- bullets ---------------------------- */

/** Recuo deslocado (hanging indent) da lista, em em: marcador + espaco. */
const BULLET_HANG_EM = 1.1

/**
 * Lista num UNICO bloco de texto: um paragrafo por item, com o marcador
 * colorido no inicio e recuo deslocado (as linhas quebradas alinham com o
 * texto). Como o navegador faz o fluxo, nao ha estimativa de posicao por
 * item (sem buracos nem sobreposicao). A estimativa de linhas (Nunito
 * ~0.45em/caractere, conservadora) so escolhe o corpo: encolhe de maxSz
 * ate minSz para a lista caber em `h`.
 */
function bulletList(
  items: string[],
  area: Box,
  o: { maxSz: number; minSz: number; color: string; dot: string },
): Element[] {
  let sz = o.maxSz
  for (; sz > o.minSz; sz -= 0.5) {
    const px = sz * (4 / 3)
    const textW = area.w - BULLET_HANG_EM * px
    const cols = Math.floor(textW / (0.45 * px))
    const lines = items.reduce((a, t) => a + wrapCount(t, cols), 0)
    const total = lines * sz * 1.35 * (4 / 3) + (items.length - 1) * sz * 0.6 * (4 / 3)
    if (total <= area.h) break
  }
  sz = Math.max(sz, o.minSz)
  const hang = Math.round(BULLET_HANG_EM * sz * (4 / 3))
  const paras: Para[] = items.map((t, i) => ({
    lhpt: sz * 1.35,
    sa: i < items.length - 1 ? sz * 0.6 : 0,
    marL: hang,
    indent: -hang,
    runs: [
      { t: '\u2022', f: 'Nunito', b: true, sz, c: o.dot },
      // espaco ate a coluna do texto: o en space (0.5em) mais o resto do recuo
      { t: '\u2002', f: 'Nunito', sz, c: o.color },
      { t, f: 'Nunito', sz, c: o.color },
    ],
  }))
  return [box(area.x, area.y, area.w, area.h, { paras })]
}

/* ------------------------ cartao de codigo ------------------------ */

type CardSpec = {
  id: string
  x: number
  y: number
  w: number
  maxH: number
  label: string
  kind: 'prompt' | 'cmd' | 'code'
  lines: string[]
  /** pontos do corpo mono: teto e piso */
  maxSz?: number
  minSz?: number
}

const CARD_PAD = { t: 14, r: 18, b: 12, l: 18 } // px
const LABEL_H = 24 // px: rotulo (9.5pt) + espaco

/**
 * Regra de auto-size: do teto ao piso (passo 0.5pt), escolhe o maior corpo
 * mono cuja altura estimada cabe em maxH. Avanco mono = 0.55em (apos
 * MONO_SCALE), colunas = largura util / avanco, com folga de 7% para a quebra
 * em espacos. Linhas longas quebram (wrap), nunca vazam. O cartao encolhe
 * ate a altura do conteudo (minimo 76px).
 */
function codeCard(c: CardSpec): { el: Element; block: Omit<CodeBlock, 'slide' | 'key'> } {
  const maxSz = c.maxSz ?? (c.kind === 'cmd' ? 12 : 10.5)
  const minSz = c.minSz ?? 8
  const innerW = c.w - CARD_PAD.l - CARD_PAD.r
  const paraGap = 2 // pt
  let sz = maxSz
  let h = 0
  for (; sz >= minSz; sz -= 0.5) {
    const cols = Math.floor((innerW / (0.55 * sz * (4 / 3))) * 0.93)
    const n = c.lines.reduce((a, l) => a + wrapCount(l, cols), 0)
    h =
      CARD_PAD.t + CARD_PAD.b + LABEL_H + n * sz * 1.5 * (4 / 3) + c.lines.length * paraGap * (4 / 3)
    if (h <= c.maxH) break
  }
  sz = Math.max(sz, minSz)
  const cardH = Math.min(c.maxH, Math.max(76, Math.ceil(h)))

  const paras: Para[] = [
    P(c.label, { sz: 9.5, b: true, caps: true, c: C.amber, lhpt: 12, sa: 4 }),
    ...c.lines.map((l) =>
      P(l || ' ', { sz, f: 'Consolas', c: C.mono, lhpt: sz * 1.5, sa: paraGap }),
    ),
  ]
  const el = box(c.x, c.y, c.w, cardH, {
    id: c.id,
    fill: C.card,
    radius: 14,
    paras,
    pad: [CARD_PAD.t, CARD_PAD.r, CARD_PAD.b, CARD_PAD.l],
  })
  const text = c.lines.join('\n')
  return {
    el,
    block: {
      elementId: c.id,
      text,
      label: c.label,
      lines: c.lines.length,
      kind: c.kind,
      expandable: c.kind !== 'cmd' && (c.lines.length >= 5 || text.length >= 300),
      box: el.box,
    },
  }
}

/* ------------------------------ team ------------------------------ */

function teamNode(m: AgTeamMember, x: number, y: number, w: number, center = false): Element {
  const dark = center
  return box(x, y, w, 84, {
    fill: dark ? C.navy : C.white,
    radius: 12,
    line: dark ? undefined : { color: '#d2cfc8', width: 1 },
    anchor: 'ctr',
    pad: [6, 12, 6, 12],
    paras: [
      P(m.name, { sz: 12.5, b: true, c: dark ? C.white : C.navy, algn: 'ctr', lhpt: 16 }),
      P(m.role, { sz: 9.5, c: dark ? '#c9d0e2' : C.gray, algn: 'ctr', lhpt: 12, sb: 2 }),
      P(`model: ${m.model}`, {
        sz: 8.5,
        f: 'Consolas',
        b: true,
        c: m.model === 'haiku' ? '#b97f08' : dark ? C.amber : C.green,
        algn: 'ctr',
        lhpt: 11,
        sb: 3,
      }),
    ],
  })
}

function teamSlide(): Element[] {
  const line = (x: number, y: number, w: number, h: number) => box(x, y, w, h, { fill: C.line })
  const { center, agents } = agentesTeam
  const NW = 230
  const topX = [64, 365, 666]
  const botX = [200, 530]
  const els: Element[] = [
    bg(C.paper),
    ...header('O time', 'Um tech lead no centro, cinco especialistas ao redor'),
    // conectores (atras dos cartoes)
    line(topX[0] + NW / 2, 262, topX[2] - topX[0], 2),
    ...topX.map((x) => line(x + NW / 2 - 1, 242, 2, 21)),
    line(479, 262, 2, 24),
    line(479, 369, 2, 22),
    line(botX[0] + NW / 2, 390, botX[1] - botX[0], 2),
    ...botX.map((x) => line(x + NW / 2 - 1, 390, 2, 21)),
    // cartoes
    teamNode(center, 350, 285, 260, true),
  ]
  agents.slice(0, 3).forEach((m, i) => els.push(teamNode(m, topX[i], 158, NW)))
  agents.slice(3, 5).forEach((m, i) => els.push(teamNode(m, botX[i], 410, NW)))
  return els
}

/* ---------------------------- montagem ---------------------------- */

const slides: Slide[] = []
const codeBlocks: CodeBlock[] = []
const titles: string[] = []
const downloads: Record<number, SlideDownloadGroup> = {}

function build(spec: AgSlideSpec, n: number): { els: Element[]; title: string } {
  switch (spec.type) {
    case 'cover':
      return {
        title: spec.title,
        els: [
          bg(C.paper),
          box(80, 170, 800, 18, {
            paras: [
              P('Harve TI & Dados', { sz: 10, b: true, caps: true, c: C.green, algn: 'ctr', lhpt: 13 }),
            ],
          }),
          box(80, 196, 800, 120, {
            paras: [P(spec.title, { sz: 34, b: true, c: C.navy, algn: 'ctr', lhpt: 41 })],
          }),
          box(450, 322, 60, 4, { fill: C.amber, radius: 2 }),
          box(120, 344, 720, 60, {
            paras: [P(spec.subtitle, { sz: 14, c: C.gray, algn: 'ctr', lhpt: 19 })],
          }),
        ],
      }

    case 'section':
      return {
        title: spec.title,
        els: [
          bg(C.navy),
          box(450, 232, 60, 4, { fill: C.amber, radius: 2 }),
          box(80, 252, 800, 130, {
            paras: [
              P(spec.title, {
                sz: 30,
                b: true,
                caps: true,
                f: 'Titillium Web',
                c: C.white,
                algn: 'ctr',
                lhpt: 37,
              }),
            ],
          }),
        ],
      }

    case 'question': {
      const sz = spec.text.length <= 100 ? 24 : spec.text.length <= 150 ? 20 : 17
      return {
        title: spec.text.length > 80 ? `${spec.text.slice(0, 77)}...` : spec.text,
        els: [
          bg(C.navy),
          box(740, 96, 180, 210, {
            paras: [P('?', { sz: 150, b: true, c: C.ghost, algn: 'ctr', lhpt: 150 })],
          }),
          box(MX, 210, CW, 18, {
            paras: [P('Pergunta', { sz: 9.5, b: true, caps: true, c: C.amber, lhpt: 12 })],
          }),
          box(MX, 236, CW, 220, {
            paras: [P(spec.text, { sz, c: C.white, lhpt: sz * 1.3 })],
          }),
        ],
      }
    }

    case 'bullets':
      return {
        title: spec.title,
        els: [
          bg(C.paper),
          ...header(spec.kicker, spec.title, spec.subtitle),
          ...bulletList(spec.bullets, { x: MX, y: CARD_Y + 8, w: CW - 40, h: 300 }, {
            maxSz: 18,
            minSz: 13,
            color: C.navy,
            dot: C.green,
          }),
        ],
      }

    case 'prompt': {
      const card = codeCard({
        id: 'code',
        x: MX,
        y: CARD_Y,
        w: CW,
        maxH: 312,
        label: spec.label,
        kind: spec.kind,
        lines: spec.lines,
      })
      codeBlocks.push({ ...card.block, key: `s${n}-code`, slide: n })
      const els = [bg(C.paper), ...header(spec.kicker, spec.title, spec.subtitle), card.el]
      if (spec.badge) {
        els.push(
          box(822, 22, 108, 24, {
            fill: C.green,
            radius: 12,
            anchor: 'ctr',
            paras: [P(spec.badge, { sz: 10, b: true, c: C.white, algn: 'ctr', lhpt: 13 })],
          }),
        )
      }
      return { title: spec.title, els }
    }

    case 'code-bullets': {
      const card = codeCard({
        id: 'code',
        x: 420,
        y: CARD_Y,
        w: 476,
        maxH: 320,
        label: spec.label,
        kind: spec.kind,
        lines: spec.lines,
        maxSz: 9.5,
      })
      codeBlocks.push({ ...card.block, key: `s${n}-code`, slide: n })
      return {
        title: spec.title,
        els: [
          bg(C.paper),
          ...header(spec.kicker, spec.title),
          ...bulletList(spec.bullets, { x: MX, y: CARD_Y + 8, w: 330, h: 300 }, {
            maxSz: 15,
            minSz: 12,
            color: C.navy,
            dot: C.green,
          }),
          card.el,
        ],
      }
    }

    case 'team':
      return { title: 'O time de agentes', els: teamSlide() }

    case 'downloads':
      downloads[n] = {
        box: { x: MX, y: 190, w: CW, h: 220 },
        large: true,
        items: agentesDownloads.map((d) => ({
          href: `/agentes-kit/${d.file}`,
          label: d.label,
          title: `Baixar ${d.file}`,
        })),
      }
      return {
        title: spec.title,
        els: [bg(C.paper), ...header('Kit', spec.title, spec.subtitle)],
      }

    case 'checkpoint':
      return {
        title: spec.title,
        els: [
          bg(C.navy),
          box(MX, 120, CW, 18, {
            paras: [P('Para fechar', { sz: 9.5, b: true, caps: true, c: C.amber, lhpt: 12 })],
          }),
          box(MX, 142, CW, 44, {
            paras: [P(spec.title, { sz: 24, b: true, c: C.white, lhpt: 29 })],
          }),
          ...bulletList(spec.bullets, { x: MX, y: 214, w: CW - 40, h: 260 }, {
            maxSz: 17,
            minSz: 13,
            color: C.white,
            dot: C.amber,
          }),
        ],
      }
  }
}

agentesSlides.forEach((spec, i) => {
  const n = i + 1
  const { els, title } = build(spec, n)
  slides.push({ n, els, notes: '' })
  titles.push(title)
})

export const agentesSource = makeSource({
  basePath: '/agentes',
  mediaPath: '/agentes-media',
  docTitle: 'Time de agentes no Claude Code',
  slides,
  titles,
  codeBlocks,
  preload: 'all',
  downloads,
})

export const AGENTES_TOTAL = agentesSource.total
export const agentesTitles = titles
