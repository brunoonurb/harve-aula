'use client'

import { CSSProperties, Fragment, ReactNode } from 'react'
import {
  CodeBlock,
  Element,
  LINE_SPACING_BASE,
  Para,
  PT_TO_PX,
  Run,
  SLIDE_H,
  SLIDE_W,
  Slide,
  TextBody,
  codeBlockFor,
  fontSpec,
  isLightColor,
  placeholderSegments,
} from '@/lib/deck'
import CodeBlockControls from '@/components/CodeBlockControls'

/* ------------------------------------------------------------------ *
 * Renderiza um slide no palco fixo de 960x540 px, com cada shape
 * posicionado exatamente onde o PPTX o coloca. Quem escala e o
 * SlideStage (transform), entao o layout nunca muda de dimensao —
 * o texto e vetorial e permanece nitido em qualquer resolucao.
 * ------------------------------------------------------------------ */

type Props = {
  slide: Slide
  /** thumbnails desligam botoes de copiar/expandir */
  interactive?: boolean
  /** destaque dos 【placeholders】 nos blocos de prompt */
  highlight?: boolean
  onExpand?: (block: CodeBlock) => void
}

type Segments = Map<string, { t: string; ph: boolean }[]>

export default function SlideView({ slide, interactive = false, highlight = true, onExpand }: Props) {
  return (
    <div className="slide-root" style={{ width: SLIDE_W, height: SLIDE_H }}>
      {slide.els.map((el, i) => (
        <ElementView
          key={`${slide.n}-${el.id ?? 'x'}-${i}`}
          el={el}
          slideN={slide.n}
          interactive={interactive}
          highlight={highlight}
          onExpand={onExpand}
        />
      ))}
    </div>
  )
}

function ElementView({
  el,
  slideN,
  interactive,
  highlight,
  onExpand,
}: {
  el: Element
  slideN: number
  interactive: boolean
  highlight: boolean
  onExpand?: (block: CodeBlock) => void
}) {
  const frame: CSSProperties = {
    position: 'absolute',
    left: el.box.x,
    top: el.box.y,
    width: el.box.w,
    height: el.box.h,
  }

  if (el.kind === 'image') {
    const flip = [el.box.flipH && 'scaleX(-1)', el.box.flipV && 'scaleY(-1)']
      .filter(Boolean)
      .join(' ')
    const crop = el.crop
    const inner: CSSProperties = crop
      ? {
          position: 'absolute',
          width: el.box.w / Math.max(1e-6, 1 - crop.l - crop.r),
          height: el.box.h / Math.max(1e-6, 1 - crop.t - crop.b),
          left: -(crop.l / Math.max(1e-6, 1 - crop.l - crop.r)) * el.box.w,
          top: -(crop.t / Math.max(1e-6, 1 - crop.t - crop.b)) * el.box.h,
        }
      : { width: '100%', height: '100%', display: 'block' }
    return (
      <div
        style={{
          ...frame,
          overflow: crop ? 'hidden' : undefined,
          borderRadius: el.radius ?? undefined,
          transform: flip || undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/media/${el.src}`} alt="" draggable={false} style={inner} />
      </div>
    )
  }

  const block = el.text && el.id ? codeBlockFor(slideN, el.id) : undefined
  const style: CSSProperties = {
    ...frame,
    background: el.fill,
    borderRadius: el.radius ?? undefined,
    boxSizing: 'border-box',
  }
  if (el.line) style.border = `${el.line.width}px solid ${el.line.color}`

  if (!el.text) return <div style={style} />

  const body = el.text
  const justify =
    body.anchor === 'ctr' ? 'center' : body.anchor === 'b' ? 'flex-end' : 'flex-start'
  // O destaque vale so nos blocos de prompt, onde os 【 】 sao instrucao ao aluno.
  // A segmentacao roda no corpo inteiro porque um placeholder pode comecar em
  // uma linha e terminar na seguinte.
  const segs: Segments | null = block && highlight ? placeholderSegments(body.paras) : null

  return (
    <div
      style={{
        ...style,
        paddingLeft: body.pl,
        paddingTop: body.pt,
        paddingRight: body.pr,
        paddingBottom: body.pb,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
      }}
      className={block ? 'code-block' : undefined}
    >
      {body.paras.map((p, i) => (
        <ParaView key={i} p={p} pi={i} body={body} segs={segs} />
      ))}
      {block && interactive && <CodeBlockControls block={block} onExpand={onExpand} />}
    </div>
  )
}

/** Run dominante do paragrafo: o de maior corpo, que define a altura da linha. */
function dominantRun(p: Para): Run | undefined {
  let best: Run | undefined
  for (const r of p.runs) if (!best || (r.sz ?? 0) > (best.sz ?? 0)) best = r
  return best
}

function ParaView({
  p,
  pi,
  body,
  segs,
}: {
  p: Para
  pi: number
  body: TextBody
  segs: Segments | null
}) {
  const dom = dominantRun(p)
  const sizePt = dom?.sz ?? 12
  const domSpec = fontSpec(dom?.f, dom?.b)
  // O PPTX mede o espacamento sobre o corpo original da fonte (nao sobre o
  // tamanho ja reduzido do monospace), por isso a altura de linha vai em px.
  const lineHeight = p.lhpt
    ? `${p.lhpt * PT_TO_PX}px`
    : `${(p.lh ?? 1) * LINE_SPACING_BASE * sizePt * PT_TO_PX}px`

  const style: CSSProperties = {
    margin: 0,
    lineHeight,
    // O "strut" do paragrafo tem de usar a mesma fonte e corpo do maior run:
    // se ficar menor (o 16px herdado do body), a caixa de linha do navegador
    // cresce para caber os dois e o texto desce alguns px.
    fontFamily: domSpec.family,
    fontWeight: domSpec.weight,
    fontSize: sizePt * PT_TO_PX * domSpec.scale,
    textAlign: p.algn === 'ctr' ? 'center' : p.algn === 'r' ? 'right' : p.algn === 'just' ? 'justify' : 'left',
    marginTop: p.sb ? p.sb * PT_TO_PX : undefined,
    marginBottom: p.sa ? p.sa * PT_TO_PX : undefined,
    paddingLeft: p.marL ? p.marL : undefined,
    textIndent: p.indent ? p.indent : undefined,
    // wrap="square" e o padrao do PPTX: a linha quebra na largura da caixa.
    // Como as metricas das fontes batem com o original, quebra no mesmo ponto.
    whiteSpace: body.wrap === 'none' ? 'pre' : 'pre-wrap',
  }

  if (p.empty || p.runs.length === 0) {
    const spec = fontSpec(p.runs[0]?.f, false)
    return (
      <p style={{ ...style, fontSize: sizePt * PT_TO_PX * spec.scale }}>
        {' '}
      </p>
    )
  }

  return (
    <p style={style}>
      {p.runs.map((r, i) => (
        <RunView key={i} r={r} segs={segs?.get(`${pi}:${i}`)} />
      ))}
    </p>
  )
}

function RunView({ r, segs }: { r: Run; segs?: { t: string; ph: boolean }[] }) {
  if (r.br) return <br />
  const spec = fontSpec(r.f, r.b)
  const style: CSSProperties = {
    fontFamily: spec.family,
    fontWeight: spec.weight,
    fontSize: (r.sz ?? 12) * PT_TO_PX * spec.scale,
    color: r.c,
    // <a:highlight> do PPTX: fundo do trecho, sem padding para nao alterar a metrica
    background: r.hl,
    fontStyle: r.i ? 'italic' : undefined,
    textDecoration: r.u ? 'underline' : r.s ? 'line-through' : undefined,
    textTransform: r.caps ? 'uppercase' : undefined,
  }

  // Em cartoes coloridos o texto e claro: o destaque usa a variante invertida.
  const phClass = isLightColor(r.c) ? 'ph ph-invert' : 'ph'
  const content: ReactNode = segs
    ? segs.map((part, i) => (
        <Fragment key={i}>{part.ph ? <mark className={phClass}>{part.t}</mark> : part.t}</Fragment>
      ))
    : r.t

  if (r.href) {
    return (
      <a href={r.href} target="_blank" rel="noreferrer noopener" style={style}>
        {content}
      </a>
    )
  }
  return <span style={style}>{content}</span>
}
