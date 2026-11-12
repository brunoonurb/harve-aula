import type { Metadata } from 'next'

/** Metadados da apresentacao "Time de agentes no Claude Code" (todas as rotas /agentes/...). */
export const metadata: Metadata = {
  title: 'Time de agentes no Claude Code · Harve',
  description:
    'Aula Harve: como montar um time de subagentes no Claude Code, com um tech lead e especialistas, e baixar o kit pronto.',
  openGraph: {
    title: 'Time de agentes no Claude Code',
    description: 'Aula Harve — Time de agentes no Claude Code.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function AgentesLayout({ children }: { children: React.ReactNode }) {
  return children
}
