import { notFound } from 'next/navigation'
import NextDeck from '@/components/NextDeck'
import { NEXT_TOTAL, nextTitles } from '@/lib/next-deck'

/** Uma rota estatica por slide: /next/slide/33 abre direto no codigo da action. */
export function generateStaticParams() {
  return Array.from({ length: NEXT_TOTAL }, (_, i) => ({ n: String(i + 1) }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const i = Number(n)
  if (!Number.isInteger(i) || i < 1 || i > NEXT_TOTAL) return {}
  return {
    title: `${i}. ${nextTitles[i - 1]} · React com Next.js e IA`,
  }
}

export default async function NextSlidePage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const i = Number(n)
  if (!Number.isInteger(i) || i < 1 || i > NEXT_TOTAL) notFound()
  return <NextDeck initial={i} />
}
