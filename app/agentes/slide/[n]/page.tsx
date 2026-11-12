import { notFound } from 'next/navigation'
import AgentesDeck from '@/components/AgentesDeck'
import { AGENTES_TOTAL, agentesTitles } from '@/lib/agentes-deck'

export function generateStaticParams() {
  return Array.from({ length: AGENTES_TOTAL }, (_, i) => ({ n: String(i + 1) }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const i = Number(n)
  if (!Number.isInteger(i) || i < 1 || i > AGENTES_TOTAL) return {}
  return {
    title: `${i}. ${agentesTitles[i - 1]} · Time de agentes no Claude Code`,
  }
}

export default async function AgentesSlidePage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const i = Number(n)
  if (!Number.isInteger(i) || i < 1 || i > AGENTES_TOTAL) notFound()
  return <AgentesDeck initial={i} />
}
