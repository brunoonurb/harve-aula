import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        height: '100dvh',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 22 }}>Slide não encontrado</h1>
      <p style={{ margin: 0, color: '#a0a0ad' }}>Esta apresentação tem 36 slides.</p>
      <Link href="/" className="btn btn-primary">
        Voltar ao início
      </Link>
    </main>
  )
}
