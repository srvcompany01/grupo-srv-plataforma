import { corAvatar } from '@/lib/ui'

export function Avatar({ nome, tamanho = 'h-7 w-7 text-xs' }: { nome: string; tamanho?: string }) {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span className={`${tamanho} ${corAvatar(nome)} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}>
      {iniciais || '?'}
    </span>
  )
}
