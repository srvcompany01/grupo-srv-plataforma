import type { Metadata } from 'next'
import Link from 'next/link'
import { CartaoPost, ChamadaLanding, Meta, SeloCategoria } from '@/componentes/blog/Pecas'
import { Newsletter } from '@/componentes/blog/Newsletter'
import { SITE } from '@/dominio/blog'
import { categorias, publicados } from '@/servicos/blog'

export const revalidate = 300
export const metadata: Metadata = { alternates: { canonical: `${SITE}/blog` } }

/** Início do blog: manchete, destaques, mais lidos, últimos, um bloco por categoria, newsletter e chamada para a landing. */
export default async function InicioBlog() {
  // Se o banco não responder (ex.: montagem de prévia), mostra o estado vazio; o cache se refaz em 5 minutos.
  const vazio = { posts: [], total: 0 }
  const [cats, recentes, lidos] = await Promise.all([categorias().catch(() => []), publicados({ limite: 10 }).catch(() => vazio), publicados({ limite: 5, ordem: 'lidos' }).catch(() => vazio)])
  const porCategoria = await Promise.all(cats.map(async (c) => ({ c, posts: (await publicados({ categoriaId: c.id, limite: 4 }).catch(() => vazio)).posts })))
  const [manchete, ...resto] = recentes.posts

  if (!manchete) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-[family-name:var(--blog-titulo)] text-5xl font-extrabold uppercase">Blog da Grupo SRV</h1>
        <p className="mt-3 text-[#4a4a4a]">Os primeiros artigos estão chegando. Deixe seu e-mail para receber.</p>
        <div className="mx-auto mt-8 max-w-2xl"><Newsletter origem="blog-inicio" /></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4">
      <h1 className="sr-only">Blog da Grupo SRV: marketing e vendas para empresas</h1>
      {lidos.posts.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto border-b border-[#e6e6e2] py-3 text-[13px]">
          <span className="shrink-0 rounded-md bg-[#d80d12] px-2.5 py-0.5 font-[family-name:var(--blog-mono)] text-[11px] font-semibold uppercase tracking-wider text-claro">Em alta</span>
          {lidos.posts.slice(0, 3).map((p) => <Link key={p.id} href={`/blog/${p.slug}`} className="shrink-0 font-medium hover:text-[#d80d12]">{p.titulo}</Link>)}
        </div>
      )}

      <section className="grid gap-8 py-8 lg:grid-cols-[1.6fr_1fr]">
        <CartaoPost p={manchete} destaque prioridade />
        <div className="space-y-6">
          {resto.slice(0, 2).map((p) => <CartaoPost key={p.id} p={p} />)}
        </div>
      </section>

      <section className="grid gap-10 border-t border-[#e6e6e2] py-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="mb-6 font-[family-name:var(--blog-titulo)] text-3xl font-extrabold uppercase">Últimos artigos</h2>
          <div className="space-y-6">
            {resto.slice(2).map((p) => (
              <article key={p.id} className="group relative grid grid-cols-[120px_1fr] gap-4 sm:grid-cols-[180px_1fr]">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#f0f0ec]">
                  {p.capa && (
                    // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem
                    <img src={p.capa} alt={p.capaAlt} loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="space-y-1">
                  {p.categoria && <SeloCategoria c={p.categoria} />}
                  <h3 className="font-[family-name:var(--blog-titulo)] text-xl font-bold leading-tight"><Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 hover:text-[#d80d12]">{p.titulo}</Link></h3>
                  <p className="line-clamp-2 text-[14px] text-[#4a4a4a]">{p.resumo}</p>
                  <div className="relative z-10"><Meta p={p} /></div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="space-y-8">
          {lidos.posts.length > 0 && (
            <div>
              <h2 className="mb-4 font-[family-name:var(--blog-titulo)] text-2xl font-extrabold uppercase">Mais lidos</h2>
              <ol className="space-y-4">
                {lidos.posts.map((p, i) => (
                  <li key={p.id} className="flex gap-3">
                    <span className="font-[family-name:var(--blog-titulo)] text-3xl font-extrabold leading-none text-[#d80d12]">{i + 1}</span>
                    <Link href={`/blog/${p.slug}`} className="font-medium leading-snug hover:text-[#d80d12]">{p.titulo}</Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e6e6e2]">
            <p className="font-[family-name:var(--blog-titulo)] text-2xl font-extrabold uppercase leading-none">Receba no seu e-mail</p>
            <p className="mt-2 text-[14px] text-[#4a4a4a]">Os melhores conteúdos de marketing e vendas, direto ao ponto.</p>
            <div className="mt-4"><Newsletter origem="blog-inicio-lateral" compacta /></div>
          </div>
        </aside>
      </section>

      {porCategoria.filter((x) => x.posts.length).map(({ c, posts }) => (
        <section key={c.id} className="border-t border-[#e6e6e2] py-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--blog-titulo)] text-3xl font-extrabold uppercase" style={{ color: c.cor }}>{c.nome}</h2>
            <Link href={`/blog/categoria/${c.slug}`} className="shrink-0 text-[13px] font-semibold hover:text-[#d80d12]">Ver tudo →</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{posts.map((p) => <CartaoPost key={p.id} p={p} />)}</div>
        </section>
      ))}

      <ChamadaLanding slug="blog-inicio" />
    </div>
  )
}
