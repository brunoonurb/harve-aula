import { createShapeDeck } from '@/lib/shape-deck'
import { mcpDownloads, mcpSlides, mcpTeam } from '@/lib/mcp-content'

/** Deck "MCP e a Lojinha da Marina" (rota /mcp): so liga conteudo ao builder. */
const deck = createShapeDeck({
  specs: mcpSlides,
  team: mcpTeam,
  downloads: mcpDownloads,
  downloadBase: '/mcp-kit',
  basePath: '/mcp',
  mediaPath: '/mcp-media',
  docTitle: 'MCP e a Lojinha da Marina',
})

export const mcpSource = deck.source
export const MCP_TOTAL = deck.total
export const mcpTitles = deck.titles
