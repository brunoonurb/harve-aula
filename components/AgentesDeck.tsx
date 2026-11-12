'use client'

import Deck from '@/components/Deck'
import { agentesSource } from '@/lib/agentes-deck'

/** Deck "Time de agentes no Claude Code" (rotas /agentes e /agentes/slide/N). */
export default function AgentesDeck({ initial = 1 }: { initial?: number }) {
  return <Deck source={agentesSource} initial={initial} />
}
