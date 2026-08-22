'use client'

import { CodeBlock, TOTAL, slideTitles, slides, stripPlaceholders } from '@/lib/deck'
import { useCopy } from '@/lib/useCopy'
import Thumb from '@/components/Thumb'

function mmss(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Painel do apresentador (tecla P): cronometro, proximo slide e acesso
 * rapido aos prompts do slide atual. O PPTX nao traz notas do orador —
 * apenas o marcador de numero de pagina — por isso o painel mostra o
 * roteiro visual em vez de notas.
 */
export default function PresenterPanel({
  current,
  seconds,
  running,
  onToggleTimer,
  onResetTimer,
  onGo,
  prompts,
  onExpand,
}: {
  current: number
  seconds: number
  running: boolean
  onToggleTimer: () => void
  onResetTimer: () => void
  onGo: (n: number) => void
  prompts: CodeBlock[]
  onExpand: (b: CodeBlock) => void
}) {
  const { copied, copy } = useCopy()
  const next = current < TOTAL ? slides[current] : null // slides[] e 0-based: current+1

  return (
    <aside className="presenter" aria-label="Painel do apresentador">
      <div className="pres-col pres-timer">
        <span className="pres-label">Tempo</span>
        <strong className={`pres-clock${running ? ' is-running' : ''}`}>{mmss(seconds)}</strong>
        <div className="pres-btns">
          <button type="button" className="btn btn-sm" onClick={onToggleTimer}>
            {running ? 'Pausar' : 'Iniciar'}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onResetTimer}>
            Zerar
          </button>
        </div>
      </div>

      <div className="pres-col pres-now">
        <span className="pres-label">
          Slide {current} de {TOTAL}
        </span>
        <strong className="pres-title">{slideTitles[current - 1]}</strong>
        {prompts.length > 0 ? (
          <div className="pres-prompts">
            {prompts.map((b) => (
              <div className="pres-prompt" key={b.key}>
                <span className="pres-prompt-name">{b.label}</span>
                <button type="button" className="btn btn-sm" onClick={() => copy(b.text, b.key)}>
                  {copied === b.key ? '✓ copiado' : 'Copiar'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => copy(stripPlaceholders(b.text), `${b.key}-c`)}
                >
                  {copied === `${b.key}-c` ? '✓' : 'sem 【 】'}
                </button>
                {b.expandable && (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => onExpand(b)}>
                    Tela cheia
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="pres-hint">
            Sem prompt neste slide. <kbd>→</kbd> avança, <kbd>G</kbd> abre a grade.
          </p>
        )}
      </div>

      <div className="pres-col pres-next">
        <span className="pres-label">A seguir</span>
        {next ? (
          <button type="button" className="pres-next-btn" onClick={() => onGo(next.n)}>
            <Thumb slide={next} width={168} />
            <span className="pres-next-title">
              {next.n}. {slideTitles[next.n - 1]}
            </span>
          </button>
        ) : (
          <span className="pres-hint">Último slide</span>
        )}
      </div>
    </aside>
  )
}
