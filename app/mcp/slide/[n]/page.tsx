import { notFound } from 'next/navigation'
import McpDeck from '@/components/McpDeck'
import { MCP_TOTAL, mcpTitles } from '@/lib/mcp-deck'

export function generateStaticParams() {
  return Array.from({ length: MCP_TOTAL }, (_, i) => ({ n: String(i + 1) }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const i = Number(n)
  if (!Number.isInteger(i) || i < 1 || i > MCP_TOTAL) return {}
  return {
    title: `${i}. ${mcpTitles[i - 1]} · MCP e a Lojinha da Marina`,
  }
}

export default async function McpSlidePage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const i = Number(n)
  if (!Number.isInteger(i) || i < 1 || i > MCP_TOTAL) notFound()
  return <McpDeck initial={i} />
}
