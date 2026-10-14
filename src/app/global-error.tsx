'use client'

// Substitui o layout raiz quando ele mesmo falha: não herda CSS nem fonte, por isso os estilos são inline.
export default function ErroGlobal({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', color: '#111111', background: '#ffffff' }}>
        <div role="alert" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>Algo deu errado</h1>
          <p style={{ margin: 0, maxWidth: 360, fontSize: 13, color: '#555555' }}>Não foi possível carregar a plataforma. Tente de novo; se continuar, avise a equipe{error.digest ? ` informando o código ${error.digest}` : ''}.</p>
          <button type="button" onClick={() => retry()} style={{ height: 36, padding: '0 16px', border: 0, borderRadius: 999, background: '#111111', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  )
}
