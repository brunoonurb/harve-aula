import { createShapeDeck } from '@/lib/shape-deck'
import { agentesDownloads, agentesSlides, agentesTeam } from '@/lib/agentes-content'

/** Deck "Time de agentes no Claude Code" (rota /agentes): so liga conteudo ao builder. */
const deck = createShapeDeck({
  specs: agentesSlides,
  team: agentesTeam,
  downloads: agentesDownloads,
  downloadBase: '/agentes-kit',
  basePath: '/agentes',
  mediaPath: '/agentes-media',
  docTitle: 'Time de agentes no Claude Code',
})

export const agentesSource = deck.source
export const AGENTES_TOTAL = deck.total
export const agentesTitles = deck.titles
