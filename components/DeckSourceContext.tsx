'use client'

import { createContext, useContext } from 'react'
import type { DeckSource } from '@/lib/deck-core'

/**
 * Entrega a fonte de dados (slides, titulos, blocos copiaveis, basePath) a
 * todo o motor sem prop drilling. Cada rota monta o seu Deck com a sua fonte.
 */
const Ctx = createContext<DeckSource | null>(null)

export const DeckSourceProvider = Ctx.Provider

export function useDeckSource(): DeckSource {
  const s = useContext(Ctx)
  if (!s) throw new Error('useDeckSource fora de <DeckSourceProvider>')
  return s
}
