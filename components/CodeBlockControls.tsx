'use client'

import { CodeBlock, hasPlaceholders, stripPlaceholders } from '@/lib/deck-core'
import { useCopy } from '@/lib/useCopy'

/**
 * Controles sobrepostos ao canto superior direito de um bloco de prompt.
 * Ficam discretos (opacidade baixa) para nao alterar a leitura do slide e
 * ganham destaque no hover/foco.
 */
export default function CodeBlockControls({
  block,
  onExpand,
}: {
  block: CodeBlock
  onExpand?: (block: CodeBlock) => void
}) {
  const { copied, copy } = useCopy()
  const clean = hasPlaceholders(block.text)
  const noun = block.kind === 'code' ? 'o código' : block.kind === 'cmd' ? 'o comando' : 'o prompt'

  return (
    <div className="cb-controls" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="cb-btn"
        onClick={() => copy(block.text, 'raw')}
        title={clean ? 'Copiar o prompt com os 【placeholders】' : `Copiar ${noun}`}
      >
        {copied === 'raw' ? '✓ copiado' : 'Copiar'}
      </button>
      {clean && (
        <button
          type="button"
          className="cb-btn"
          onClick={() => copy(stripPlaceholders(block.text), 'clean')}
          title="Copiar sem os 【 】, usando os valores da planilha-modelo"
        >
          {copied === 'clean' ? '✓ copiado' : 'Copiar sem 【 】'}
        </button>
      )}
      {block.expandable && onExpand && (
        <button
          type="button"
          className="cb-btn cb-btn-icon"
          onClick={() => onExpand(block)}
          title={`Abrir ${noun} em tela cheia (E)`}
          aria-label={`Abrir ${noun} em tela cheia`}
        >
          <svg viewBox="0 0 16 16" width="9" height="9" aria-hidden="true">
            <path
              d="M6 1H1v5M10 15h5v-5M1 10v5h5M15 6V1h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
