import { notFound } from 'next/navigation'
import Deck from '@/components/Deck'
import { TOTAL, slideTitles } from '@/lib/deck'

/** Uma rota estatica por slide: /slide/16 abre direto no prompt do Passo 2. */
export function generateStaticParams() {
  return Array.from({ length: TOTAL }, (_, i) => ({ n: String(i + 1) }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const i = Number(n)
  if (!Number.isInteger(i) || i < 1 || i > TOTAL) return {}
  return {
    title: `${i}. ${slideTitles[i - 1]} · Da Planilha ao Aplicativo`,
  }
}

export default async function SlidePage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const i = Number(n)
  if (!Number.isInteger(i) || i < 1 || i > TOTAL) notFound()
  return <Deck initial={i} />
}
