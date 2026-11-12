
export function Avatar({ nome, tamanho = 'h-7 w-7 text-xs' }: { nome: string; tamanho?: string }) {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span className={`avatar ${tamanho}`} style={{ background: corDoNome(nome) }}>
      {iniciais || '?'}
    </span>
  )
}

const CORES_AVATAR = ['#d80d12', '#0d9488', '#7c3aed', '#b45309', '#1d6fe0', '#db2777', '#16a34a', '#e0620d']
/** Cor estável por pessoa (a mesma pessoa sempre tem a mesma cor). */
export function corDoNome(nome: string): string {
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return CORES_AVATAR[h % CORES_AVATAR.length]
}
