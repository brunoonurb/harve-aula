'use client'

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CodeBlock, hasPlaceholders, splitPlaceholders, stripPlaceholders } from '@/lib/deck-core'
import { useCopy } from '@/lib/useCopy'

/**
 * Prompt em tela cheia: texto real (selecionavel), corpo dimensionado para
 * ocupar a tela — legivel em projecao — e copia com ou sem os 【 】.
 */
export default function PromptModal({
  block,
  onClose,
  highlight,
}: {
  block: CodeBlock
  onClose: () => void
  highlight: boolean
}) {
  const { copied, copy } = useCopy()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(18)
  const clean = hasPlaceholders(block.text)
  const lines = useMemo(() => block.text.split('\n'), [block.text])
  const maxLen = Math.max(...lines.map((l) => l.length), 20)
  // Prompts em linguagem natural (deck /next) trazem um paragrafo por linha:
  // quebram na tela em vez de rolar na horizontal.
  const wrap = block.kind === 'prompt'

  const fit = useCallback(() => {
    const box = wrapRef.current
    if (!box) return
    const w = box.clientWidth
    const h = box.clientHeight
    // monospace: cada caractere ocupa ~0.6em de largura; 1.55em por linha
    if (wrap) {
      // maior corpo em que o texto, quebrado em palavras (~90% das colunas uteis), cabe na altura
      let fs = 26
      for (; fs > 10; fs -= 0.5) {
        const cols = Math.max(10, Math.floor((w * 0.9) / (fs * 0.6)))
        const rows = lines.reduce((acc, l) => acc + Math.max(1, Math.ceil(l.length / cols)), 0)
        if (rows * 1.55 * fs + fs <= h) break
      }
      setFontSize(fs)
      return
    }
    const byWidth = w / (maxLen * 0.6 + 0.6)
    const byHeight = h / (lines.length * 1.55 + 0.5)
    setFontSize(Math.max(9, Math.min(40, Math.floor(Math.min(byWidth, byHeight) * 10) / 10)))
  }, [lines, maxLen, wrap])

  useLayoutEffect(() => {
    fit()
    const ro = new ResizeObserver(fit)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [fit])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        const sel = window.getSelection()?.toString()
        if (!sel) copy(e.shiftKey ? stripPlaceholders(block.text) : block.text, e.shiftKey ? 'clean' : 'raw')
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [block.text, copy, onClose])

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-label={block.label}>
      <div className="modal-card">
        <header className="modal-head">
          <div className="modal-title">
            <span className="modal-badge">Slide {block.slide}</span>
            <h2>{block.label}</h2>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => copy(block.text, 'raw')}>
              {copied === 'raw' ? '✓ Copiado' : block.kind === 'code' ? 'Copiar código' : 'Copiar prompt'}
            </button>
            {clean && (
              <button
                type="button"
                className="btn"
                onClick={() => copy(stripPlaceholders(block.text), 'clean')}
                title="Copia usando os valores da planilha-modelo"
              >
                {copied === 'clean' ? '✓ Copiado' : 'Copiar sem 【 】'}
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Fechar">
              Fechar <kbd>Esc</kbd>
            </button>
          </div>
        </header>

        <div className="modal-body" ref={wrapRef}>
          <pre
            className="prompt-pre"
            style={{ fontSize, lineHeight: 1.55, whiteSpace: wrap ? 'pre-wrap' : undefined }}
          >
            {highlight
              ? splitPlaceholders(block.text).map((part, i) => (
                  <Fragment key={i}>
                    {part.ph ? <mark className="ph ph-lg">{part.t}</mark> : part.t}
                  </Fragment>
                ))
              : block.text}
          </pre>
        </div>

        {clean && (
          <footer className="modal-foot">
            <span className="ph ph-lg">assim</span> = trecho que muda conforme a sua planilha. Os
            valores mostrados são os da planilha-modelo.
          </footer>
        )}
      </div>
    </div>
  )
}
