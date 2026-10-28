import type { Metadata } from 'next'
import { CartaoPost } from '@/componentes/blog/Pecas'
import { publicados } from '@/servicos/blog'

// Resultado de busca não deve ir para o Google (conteúdo repetido): a página fica fora do índice.
export const metadata: Metadata = { title: 'Buscar no blog', robots: { index: false, follow: true } }

export default async function Busca({ searchParams }: PageProps<'/blog/busca'>) {
  const q = String((await searchParams).q ?? '').trim().slice(0, 80)
  const { posts } = q ? await publicados({ busca: q, limite: 30 }) : { posts: [] }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-[family-name:var(--blog-titulo)] text-5xl font-extrabold uppercase">Buscar no blog</h1>
      <form className="mt-6 flex max-w-2xl gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Ex.: tráfego pago, Instagram, Google Meu Negócio" className="h-12 flex-1 rounded-full border border-[#e6e6e2] bg-white px-5 outline-none focus:border-[#d80d12]" />
        <button className="h-12 rounded-full bg-[#070707] px-6 text-[14px] font-semibold text-claro">Buscar</button>
      </form>
      {q && <p className="mt-6 text-[14px] text-[#656565]">{posts.length} resultado(s) para “{q}”</p>}
      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <CartaoPost key={p.id} p={p} />)}</div>
    </div>
  )
}
