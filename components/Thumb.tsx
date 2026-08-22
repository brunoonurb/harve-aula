'use client'

import { SLIDE_H, SLIDE_W, Slide } from '@/lib/deck'
import SlideView from '@/components/SlideView'

/** Miniatura real do slide (nao e imagem: e o mesmo HTML em escala menor). */
export default function Thumb({ slide, width }: { slide: Slide; width: number }) {
  const scale = width / SLIDE_W
  return (
    <div className="thumb" style={{ width, height: SLIDE_H * scale }} aria-hidden="true">
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <SlideView slide={slide} interactive={false} highlight={false} />
      </div>
    </div>
  )
}
