/** Bloco cinza pulsante. Dê o tamanho por `className` (ex.: `h-4 w-40`). */
export function Esqueleto({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" />
}

/** Esqueleto de uma página com título e linhas, usado nos `loading.tsx`. */
export function EsqueletoPagina({ linhas = 8 }: { linhas?: number }) {
  return (
    <div role="status" aria-label="Carregando">
      <Esqueleto />
      <div>
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i}>
            <Esqueleto />
            <Esqueleto />
            <Esqueleto className="hidden sm:block" />
            <Esqueleto className="hidden md:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
