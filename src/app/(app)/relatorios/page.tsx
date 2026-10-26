import { redirect } from 'next/navigation'

/** Relatórios agora vive dentro de Performance: este endereço só leva para lá (links e favoritos antigos continuam valendo). */
export default async function Relatorios({ searchParams }: PageProps<'/relatorios'>) {
  const sp = await searchParams
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    const valor = Array.isArray(v) ? v[0] : v
    if (valor) q.set(k, k === 'aba' && valor === 'panorama' ? 'resumo' : valor)
  }
  redirect(`/performance${q.size ? `?${q}` : ''}`)
}
