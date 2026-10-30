/** Plataformas que ainda vão entrar (mostradas como "em breve"). */
export function EmBreve({ itens }: { itens: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-legenda text-texto-3">
      <span>Em breve:</span>
      {itens.map((i) => <span key={i} className="rounded-md border border-dashed border-borda px-2 py-0.5">{i}</span>)}
    </div>
  )
}
