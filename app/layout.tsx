import type { Metadata, Viewport } from 'next'
import { Nunito, Roboto_Mono, Titillium_Web } from 'next/font/google'
import './globals.css'

/* As mesmas familias do PPTX. Nunito e Titillium Web sao exatas;
 * Roboto Mono substitui a Consolas com compensacao de metrica
 * (ver MONO_SCALE em lib/deck.ts). */
const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-nunito',
  display: 'block',
})

const titillium = Titillium_Web({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-titillium',
  display: 'block',
})

const mono = Roboto_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'block',
})

export const metadata: Metadata = {
  title: 'Da Planilha ao Aplicativo · Harve TI & Dados',
  description:
    'Um roteiro prático para transformar dados de uma planilha em um app web real, rodando na sua máquina — usando IA gratuita para gerar o código, sem digitar uma linha do zero.',
  openGraph: {
    title: 'Da Planilha ao Aplicativo',
    description: 'Oficina Harve TI & Dados — Next.js, Supabase e Node.js em 3 horas.',
    type: 'website',
    locale: 'pt_BR',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#101013',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${titillium.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
