import type { Metadata } from 'next'

/** Metadados da apresentacao "React com Next.js e IA" (todas as rotas /next/...). */
export const metadata: Metadata = {
  title: 'React com Next.js e IA · Harve',
  description:
    'Aula "React com Next.js e IA" da Harve: do esqueleto do app ao deploy na Vercel, com prompts e códigos de referência para copiar.',
  openGraph: {
    title: 'React com Next.js e IA',
    description: 'Aula Harve — React com Next.js e IA.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function NextLayout({ children }: { children: React.ReactNode }) {
  return children
}
