import type { Metadata } from 'next'
import { CartaoPost } from '@/componentes/blog/Pecas'
import { publicados } from '@/servicos/blog'

// Resultado de busca não deve ir para o Google (conteúdo repetido): a página fica fora do índice.
export const metadata: Metadata = { title: 'Buscar no blog', robots: { index: false, follow: true } }

export default async function Busca({ searchParams }: PageProps<'/blog/busca'>) {
  const q = String((await searchParams).q ?? '').trim().slice(0, 80)
  const { posts } = q ? await publicados({ busca: q, limite: 30 }) : { posts: [] }
  return (
    <div>
      <h1>Buscar no blog</h1>
      <form role="search">
        <input name="q" defaultValue={q} placeholder="Ex.: tráfego pago, Instagram, Google Meu Negócio" />
        <button>Buscar</button>
      </form>
      {q && <p>{posts.length} resultado(s) para “{q}”</p>}
      <div>{posts.map((p) => <CartaoPost key={p.id} p={p} />)}</div>
    </div>
  )
}
