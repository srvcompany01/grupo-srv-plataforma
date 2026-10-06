/** Monograma provisório da marca, deliberadamente simples e legível em tamanhos pequenos. */
export function Marca({ tamanho = 'h-8 w-8 text-sm' }: { tamanho?: string }) {
  return (
    <span
      className={`${tamanho} inline-flex shrink-0 items-center justify-center rounded-[10px] bg-marca font-[var(--font-plus-jakarta)] font-extrabold text-white`}
    >
      S
    </span>
  )
}
