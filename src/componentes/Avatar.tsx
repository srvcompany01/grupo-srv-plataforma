
export function Avatar({ nome, tamanho = 'h-7 w-7 text-xs' }: { nome: string; tamanho?: string }) {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span>
      {iniciais || '?'}
    </span>
  )
}
