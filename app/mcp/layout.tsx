import type { Metadata } from 'next'

/** Metadados da apresentacao "MCP e a Lojinha da Marina" (todas as rotas /mcp/...). */
export const metadata: Metadata = {
  title: 'MCP e a Lojinha da Marina · Harve',
  description:
    'Aula Harve: conecte o Claude Code ao banco via MCP e use um time de agentes para construir a API da Lojinha da Marina.',
  openGraph: {
    title: 'MCP e a Lojinha da Marina',
    description: 'Aula Harve — MCP e a Lojinha da Marina.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function McpLayout({ children }: { children: React.ReactNode }) {
  return children
}
