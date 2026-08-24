'use client'

import { SlideDownloadGroup } from '@/lib/deck'

/**
 * Botoes de download ancorados sobre o slide (palco 960x540). Sao links
 * comuns com `download`, entao funcionam tambem na saida estatica.
 * O stopPropagation evita que o clique vire swipe/avanco de slide.
 */
export default function SlideDownloads({ group }: { group: SlideDownloadGroup }) {
  return (
    <div
      className="dl-group"
      style={{
        position: 'absolute',
        left: group.box.x,
        top: group.box.y,
        width: group.box.w,
        height: group.box.h,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {group.items.map((d) => (
        <a
          key={d.href}
          className={`dl-btn${d.primary ? ' dl-btn-primary' : ''}`}
          href={d.href}
          download
          title={d.title}
        >
          <svg viewBox="0 0 16 16" width="9" height="9" aria-hidden="true">
            <path
              d="M8 1.6v8.2M4.4 6.4 8 10l3.6-3.6M2.2 13.4h11.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {d.label}
        </a>
      ))}
    </div>
  )
}
