/** Selo do Grupo SRV no lugar do logo: quadrado com degradê da paleta. */
export function Marca({ tamanho = 'h-8 w-8 text-sm' }: { tamanho?: string }) {
  return (
    <span
      className={`${tamanho} inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-marca via-violet-500 to-pink-500 font-bold text-white shadow-sm`}
    >
      S
    </span>
  )
}
