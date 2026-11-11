/** Plataformas que ainda vão entrar (mostradas como "em breve"). */
export function EmBreve({ itens }: { itens: string[] }) {
  return (
    <div>
      <span>Em breve:</span>
      {itens.map((i) => <span key={i}>{i}</span>)}
    </div>
  )
}
