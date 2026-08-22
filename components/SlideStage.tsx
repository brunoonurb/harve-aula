'use client'

import { ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { SLIDE_H, SLIDE_W } from '@/lib/deck'

/**
 * Palco fixo de 960x540 px escalado por transform para caber no espaco
 * disponivel. O layout e sempre calculado em 960x540, entao as quebras de
 * linha nunca mudam com o tamanho da janela — a apresentacao fica identica
 * ao PPTX em qualquer tela.
 */
export default function SlideStage({
  children,
  className,
  onSwipe,
}: {
  children: ReactNode
  className?: string
  onSwipe?: (dir: 1 | -1) => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const down = useRef<{ x: number; y: number; t: number } | null>(null)

  const measure = useCallback(() => {
    const el = hostRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return
    setScale(Math.min(r.width / SLIDE_W, r.height / SLIDE_H))
  }, [])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (hostRef.current) ro.observe(hostRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  return (
    <div
      ref={hostRef}
      className={`stage-host${className ? ` ${className}` : ''}`}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') return
        down.current = { x: e.clientX, y: e.clientY, t: Date.now() }
      }}
      onPointerUp={(e) => {
        const d = down.current
        down.current = null
        if (!d || !onSwipe) return
        const dx = e.clientX - d.x
        const dy = e.clientY - d.y
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - d.t < 900) {
          onSwipe(dx < 0 ? 1 : -1)
        }
      }}
    >
      <div
        className="stage"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale || 0.0001})`,
          visibility: scale ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}
