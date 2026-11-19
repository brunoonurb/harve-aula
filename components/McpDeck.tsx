'use client'

import Deck from '@/components/Deck'
import { mcpSource } from '@/lib/mcp-deck'

/** Deck "MCP e a Lojinha da Marina" (rotas /mcp e /mcp/slide/N). */
export default function McpDeck({ initial = 1 }: { initial?: number }) {
  return <Deck source={mcpSource} initial={initial} />
}
