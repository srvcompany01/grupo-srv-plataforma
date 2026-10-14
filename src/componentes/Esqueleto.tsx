/** Bloco cinza pulsante. Dê o tamanho por `className` (ex.: `h-4 w-40`). */
export function Esqueleto({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-hover ${className}`} />
}

/** Esqueleto de uma página com título e linhas, usado nos `loading.tsx`. */
export function EsqueletoPagina({ linhas = 8 }: { linhas?: number }) {
  return (
    <div className="page-shell" role="status" aria-label="Carregando">
      <Esqueleto className="h-8 w-56" />
      <Esqueleto className="h-4 w-80 max-w-full" />
      <div className="overflow-hidden rounded-xl border border-borda bg-white">
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-borda px-3 py-3 first:border-t-0">
            <Esqueleto className="h-4 w-4 rounded-full" />
            <Esqueleto className="h-4 flex-1" />
            <Esqueleto className="hidden h-4 w-20 sm:block" />
            <Esqueleto className="hidden h-4 w-14 md:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
