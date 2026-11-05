'use client'

import Deck from '@/components/Deck'
import { mainSource } from '@/lib/deck'

/** Deck "Da Planilha ao Aplicativo" (rotas / e /slide/N). */
export default function MainDeck({ initial = 1 }: { initial?: number }) {
  return <Deck source={mainSource} initial={initial} />
}
