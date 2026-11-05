'use client'

import Deck from '@/components/Deck'
import { nextSource } from '@/lib/next-deck'

/** Deck "React com Next.js e IA" (rotas /next e /next/slide/N). */
export default function NextDeck({ initial = 1 }: { initial?: number }) {
  return <Deck source={nextSource} initial={initial} />
}
