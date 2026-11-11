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
      <div>
        <h1>Blog da Grupo SRV</h1>
        <p>Os primeiros artigos estão chegando. Deixe seu e-mail para receber.</p>
        <div><Newsletter origem="blog-inicio" /></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="sr-only">Blog da Grupo SRV: marketing e vendas para empresas</h1>
      {lidos.posts.length > 0 && (
        <div>
          <span>Em alta</span>
          {lidos.posts.slice(0, 3).map((p) => <Link key={p.id} href={`/blog/${p.slug}`}>{p.titulo}</Link>)}
        </div>
      )}

      <section>
        <CartaoPost p={manchete} destaque prioridade />
        <div>
          {resto.slice(0, 2).map((p) => <CartaoPost key={p.id} p={p} />)}
        </div>
      </section>

      <section>
        <div>
          <h2>Últimos artigos</h2>
          <div>
            {resto.slice(2).map((p) => (
              <article key={p.id}>
                <div>
                  {p.capa && (
                    // eslint-disable-next-line @next/next/no-img-element -- imagem servida por /blog/imagem
                    <img src={p.capa} alt={p.capaAlt} loading="lazy" />
                  )}
                </div>
                <div>
                  {p.categoria && <SeloCategoria c={p.categoria} />}
                  <h3><Link href={`/blog/${p.slug}`}>{p.titulo}</Link></h3>
                  <p>{p.resumo}</p>
                  <div><Meta p={p} /></div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside>
          {lidos.posts.length > 0 && (
            <div>
              <h2>Mais lidos</h2>
              <ol>
                {lidos.posts.map((p, i) => (
                  <li key={p.id}>
                    <span>{i + 1}</span>
                    <Link href={`/blog/${p.slug}`}>{p.titulo}</Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div>
            <p>Receba no seu e-mail</p>
            <p>Os melhores conteúdos de marketing e vendas, direto ao ponto.</p>
            <div><Newsletter origem="blog-inicio-lateral" compacta /></div>
          </div>
        </aside>
      </section>

      {porCategoria.filter((x) => x.posts.length).map(({ c, posts }) => (
        <section key={c.id}>
          <div>
            <h2 style={{ color: c.cor }}>{c.nome}</h2>
            <Link href={`/blog/categoria/${c.slug}`}>Ver tudo →</Link>
          </div>
          <div>{posts.map((p) => <CartaoPost key={p.id} p={p} />)}</div>
        </section>
      ))}

      <ChamadaLanding slug="blog-inicio" />
    </div>
  )
}
