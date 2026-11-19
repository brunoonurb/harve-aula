/* Tipos dos specs de slides montados em codigo (builder lib/shape-deck.ts). */

export type TeamMember = { name: string; role: string; model: string }

export type ShapeSlideSpec =
  | { type: 'cover'; title: string; subtitle: string }
  | { type: 'section'; title: string }
  | { type: 'question'; text: string }
  | { type: 'bullets'; kicker: string; title: string; subtitle?: string; bullets: string[] }
  | {
      type: 'prompt'
      kicker: string
      title: string
      subtitle?: string
      badge?: string
      label: string
      kind: 'prompt' | 'cmd' | 'code'
      lines: string[]
    }
  | {
      type: 'code-bullets'
      kicker: string
      title: string
      bullets: string[]
      label: string
      kind: 'code' | 'cmd'
      lines: string[]
    }
  | { type: 'team'; title?: string }
  | { type: 'downloads'; title: string; subtitle?: string }
  | { type: 'checkpoint'; title: string; bullets: string[] }
