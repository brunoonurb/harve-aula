'use client'

import { useEffect, useRef, useState } from 'react'
import { CodeBlock, hasPlaceholders, stripPlaceholders } from '@/lib/deck'
import { useCopy } from '@/lib/useCopy'

/** Barra de controles que se esconde sozinha durante a apresentacao. */
export default function Toolbar({
  n,
  total,
  onPrev,
  onNext,
  onGo,
  onGrid,
  onHelp,
  onFullscreen,
  onPresenter,
  presenter,
  prompts,
  onExpand,
}: {
  n: number
  total: number
  onPrev: () => void
  onNext: () => void
  onGo: (n: number) => void
  onGrid: () => void
  onHelp: () => void
  onFullscreen: () => void
  onPresenter: () => void
  presenter: boolean
  prompts: CodeBlock[]
  onExpand: (b: CodeBlock) => void
}) {
  const [idle, setIdle] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { copied, copy } = useCopy()
  const prompt = prompts.find((p) => p.expandable) ?? prompts[0]
  const copyLabel = prompt?.expandable ? 'Copiar prompt' : 'Copiar código'
  const showClean = !!prompt && hasPlaceholders(prompt.text)

  useEffect(() => {
    const wake = () => {
      setIdle(false)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setIdle(true), 2800)
    }
    wake()
    window.addEventListener('pointermove', wake)
    window.addEventListener('keydown', wake)
    window.addEventListener('pointerdown', wake)
    return () => {
      if (timer.current) clearTimeout(timer.current)
      window.removeEventListener('pointermove', wake)
      window.removeEventListener('keydown', wake)
      window.removeEventListener('pointerdown', wake)
    }
  }, [])

  return (
    <>
      <div
        className="progress"
        role="progressbar"
        aria-label="Progresso da apresentação"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={n}
        title="Clique para pular para um ponto da apresentação"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          onGo(Math.max(1, Math.ceil(((e.clientX - r.left) / r.width) * total)))
        }}
      >
        <span className="progress-fill" style={{ width: `${(n / total) * 100}%` }} />
      </div>

      <div className={`toolbar${idle ? ' is-idle' : ''}`}>
        <button type="button" className="tb-btn" onClick={onPrev} disabled={n === 1} aria-label="Slide anterior">
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <path d="M10 2 4 8l6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button type="button" className="tb-count" onClick={onGrid} title="Ver todos os slides (G)">
          <strong>{n}</strong>
          <span>/ {total}</span>
        </button>

        <button type="button" className="tb-btn" onClick={onNext} disabled={n === total} aria-label="Próximo slide">
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <path d="M6 2l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="tb-sep" />

        {prompt ? (
          <>
            <button
              type="button"
              className="tb-btn tb-btn-wide tb-accent"
              onClick={() => copy(prompt.text, 'raw')}
              title="Copiar o prompt deste slide (C)"
            >
              {copied === 'raw' ? '✓ Copiado' : copyLabel}
            </button>
            {showClean && (
              <button
                type="button"
                className="tb-btn tb-btn-wide"
                onClick={() => copy(stripPlaceholders(prompt.text), 'clean')}
                title="Copiar sem os 【 】, com os valores da planilha-modelo (Shift+C)"
              >
                {copied === 'clean' ? '✓ Copiado' : 'sem 【 】'}
              </button>
            )}
            {prompt.expandable && (
              <button
                type="button"
                className="tb-btn"
                onClick={() => onExpand(prompt)}
                title="Prompt em tela cheia (E)"
                aria-label="Prompt em tela cheia"
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="M6 1H1v5M10 15h5v-5M1 10v5h5M15 6V1h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <span className="tb-sep" />
          </>
        ) : null}

        <button
          type="button"
          className={`tb-btn${presenter ? ' is-on' : ''}`}
          onClick={onPresenter}
          title="Modo apresentador (A)"
          aria-label="Modo apresentador"
        >
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 14h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <button type="button" className="tb-btn" onClick={onFullscreen} title="Tela cheia (F)" aria-label="Tela cheia">
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <path d="M1 6V1h5M15 10v5h-5M10 1h5v5M6 15H1v-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>

        <button type="button" className="tb-btn" onClick={onHelp} title="Atalhos (?)" aria-label="Atalhos do teclado">
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6.2 6.1a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.6" r=".9" fill="currentColor" />
          </svg>
        </button>
      </div>
    </>
  )
}
