/** Bloco cinza pulsante. Dê o tamanho por `className` (ex.: `h-4 w-40`). */
export function Esqueleto({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-[var(--skel)] ${className}`} />
}

/** Esqueleto de uma página com título e linhas, usado nos `loading.tsx`. */
export function EsqueletoPagina({ linhas = 8 }: { linhas?: number }) {
  return (
    <div className="page-shell" role="status" aria-label="Carregando">
      <Esqueleto className="h-6 w-48" />
      <div className="overflow-hidden rounded-lg border border-borda bg-white">
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i} className="flex items-center gap-3 h-8 border-t border-borda-fraca px-3 first:border-t-0">
            <Esqueleto className="h-3.5 w-3.5 rounded-full" />
            <Esqueleto className="h-2.5 flex-1" />
            <Esqueleto className="hidden h-2.5 w-20 sm:block" />
            <Esqueleto className="hidden h-2.5 w-14 md:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
