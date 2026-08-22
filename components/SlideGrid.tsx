'use client'

import { useEffect, useRef } from 'react'
import { codeBlocksOf, slideTitles, slides } from '@/lib/deck'
import Thumb from '@/components/Thumb'

/** Grade com todos os slides (tecla G). */
export default function SlideGrid({
  current,
  onPick,
  onClose,
}: {
  current: number
  onPick: (n: number) => void
  onClose: () => void
}) {
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="overlay grid-overlay" role="dialog" aria-modal="true" aria-label="Todos os slides">
      <header className="overlay-head">
        <h2>
          Todos os slides <span className="muted">· {slides.length}</span>
        </h2>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Fechar <kbd>Esc</kbd>
        </button>
      </header>
      <div className="grid-scroll">
        <div className="grid-items">
          {slides.map((s, i) => {
            const prompts = codeBlocksOf(s.n).filter((b) => b.expandable).length
            const active = s.n === current
            return (
              <button
                type="button"
                key={s.n}
                ref={active ? activeRef : undefined}
                className={`grid-item${active ? ' is-active' : ''}`}
                onClick={() => onPick(s.n)}
              >
                <Thumb slide={s} width={232} />
                <span className="grid-meta">
                  <span className="grid-n">{s.n}</span>
                  <span className="grid-title">{slideTitles[i]}</span>
                  {prompts > 0 && (
                    <span className="grid-tag" title="Contém prompt para copiar">
                      {prompts > 1 ? `${prompts} prompts` : 'prompt'}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
