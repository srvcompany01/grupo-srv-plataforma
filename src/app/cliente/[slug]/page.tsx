import { FileText } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { GaleriaAnuncios } from '@/componentes/anuncios/GaleriaAnuncios'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { dataDeHoje } from '@/dominio/filtros'
import { lerPeriodo } from '@/dominio/periodo-anuncios'
import { BibliotecaAnuncios } from '@/componentes/BibliotecaAnuncios'
import { notFound } from 'next/navigation'
import { Marca } from '@/componentes/Marca'
import { clientePorLink, documentosDoCliente, postsDoCliente, type PostPortal } from '@/servicos/portal-conteudo'
import { ROTULO_FORMATO } from '@/dominio/conteudo'

const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const quando = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

function SeloPost({ p }: { p: PostPortal }) {
  const [texto, cor] = p.status === 'publicado' ? ['Publicado', 'bg-sucesso text-white'] : p.aprovacao === 'aguardando' ? ['Aguardando sua aprovação', 'bg-aviso text-white'] : p.aprovacao === 'aprovado' ? ['Aprovado', 'bg-sucesso-fundo text-sucesso-forte'] : ['Ajuste pedido', 'bg-perigo-fundo text-perigo-forte']
  return <span className={`rounded-full px-2 py-0.5 text-micro font-semibold ${cor}`}>{texto}</span>
}

function CartaoPost({ p, base }: { p: PostPortal; base: string }) {
  const capa = p.midias[0]
  return (
    <Link href={`${base}/posts/${p.id}`} className={`flex gap-3 rounded-xl border bg-white p-2.5 transition hover:border-borda-forte ${p.aprovacao === 'aguardando' ? 'border-aviso' : 'border-borda'}`}>
      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-fundo">
        {capa && (capa.tipo === 'video' ? <video src={capa.url} muted className="h-full w-full object-cover" /> : (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
          <img src={capa.url} alt="" className="h-full w-full object-cover" />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-corpo font-semibold text-texto">{p.titulo}</span>
        <span className="block text-legenda capitalize text-texto-3">{ROTULO_FORMATO[p.formato]} · {p.publicarEm ? quando.format(new Date(p.publicarEm)) : 'data a combinar'}</span>
        <span className="mt-1 block"><SeloPost p={p} /></span>
      </span>
    </Link>
  )
}

/** Página do cliente pelo link (sem login): posts para aprovar, anúncios e documentos liberados. */
export default async function PaginaDoCliente({ params, searchParams }: PageProps<'/cliente/[slug]'>) {
  const { slug } = await params
  const sp = await searchParams
  const cliente = await clientePorLink(slug).catch(() => null)
  if (!cliente) notFound()
  const base = `/cliente/${cliente.slug}`
  const hoje = dataDeHoje(new Date())
  const periodo = lerPeriodo(sp, hoje)
  // Sem a migration de publicação, a lista de posts fica vazia.
  const [posts, docs] = await Promise.all([postsDoCliente(cliente.id).catch(() => []), documentosDoCliente(cliente.id).catch(() => [])])
  const aguardando = posts.filter((p) => p.aprovacao === 'aguardando')
  const demais = posts.filter((p) => p.aprovacao !== 'aguardando').slice(0, 12)
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 py-10">
      <div className="flex items-center gap-3">
        <Marca tamanho="h-11 w-11 text-lg" />
        <div>
          <p className="text-legenda font-semibold uppercase tracking-wide text-texto-3">Área do cliente</p>
          <h1 className="text-xl font-semibold">{cliente.nome}</h1>
        </div>
      </div>
      {posts.length > 0 && (
        <section className="space-y-3 rounded-xl border border-borda bg-white p-4" aria-label="Seus posts">
          <div>
            <h2 className="text-corpo font-semibold text-texto">Seus posts</h2>
            <p className="text-legenda text-texto-3">{aguardando.length ? `${aguardando.length} ${aguardando.length === 1 ? 'post espera' : 'posts esperam'} a sua aprovação.` : 'Nada esperando a sua aprovação agora.'}</p>
          </div>
          {aguardando.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{aguardando.map((p) => <CartaoPost key={p.id} p={p} base={base} />)}</div>}
          {demais.length > 0 && (
            <details className="group" open={!aguardando.length}>
              <summary className="cursor-pointer text-rotulo font-semibold text-texto-2">Aprovados e publicados ({demais.length})</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{demais.map((p) => <CartaoPost key={p.id} p={p} base={base} />)}</div>
            </details>
          )}
        </section>
      )}
      {cliente.metaContaId && (
        <Suspense fallback={<p className="rounded-xl border border-borda bg-white p-4 text-rotulo text-texto-3">Carregando seus anúncios…</p>}>
          <GaleriaAnuncios contaId={cliente.metaContaId} periodo={periodo} mostrarGasto={false} seletor={<SeletorPeriodo base={base} periodo={periodo} hoje={hoje} />} />
        </Suspense>
      )}
      <BibliotecaAnuncios paginaId={cliente.metaPaginaId} />
      <section className="space-y-2">
        <h2 className="text-rotulo font-semibold text-texto-3">Documentos para você</h2>
        {docs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-borda p-6 text-center text-corpo text-texto-3">Nenhum documento disponível por enquanto.</p>
        ) : (
          docs.map((d) => (
            <Link key={d.id} href={`${base}/documentos/${d.id}`} className="flex items-center gap-3 rounded-lg border border-borda bg-white p-3 hover:border-marca-clara">
              <FileText className="h-4 w-4 text-texto-3" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-corpo font-semibold text-texto">{d.titulo}</span>
                <span className="block text-legenda text-texto-3">Atualizado em {dia.format(new Date(d.atualizadoEm))}</span>
              </span>
            </Link>
          ))
        )}
      </section>
    </main>
  )
}
