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
  const [texto, cor] = p.status === 'publicado' ? ['Publicado', 'bg-sucesso text-claro'] : p.aprovacao === 'aguardando' ? ['Aguardando sua aprovação', 'bg-aviso text-claro'] : p.aprovacao === 'aprovado' ? ['Aprovado', 'bg-sucesso-fundo text-sucesso-forte'] : ['Ajuste pedido', 'bg-perigo-fundo text-perigo-forte']
  return <span>{texto}</span>
}

function CartaoPost({ p, base }: { p: PostPortal; base: string }) {
  const capa = p.midias[0]
  return (
    <Link href={`${base}/posts/${p.id}`}>
      <span>
        {capa && (capa.tipo === 'video' ? <video src={capa.url} muted /> : (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
          <img src={capa.url} alt="" />
        ))}
      </span>
      <span>
        <span>{p.titulo}</span>
        <span>{ROTULO_FORMATO[p.formato]} · {p.publicarEm ? quando.format(new Date(p.publicarEm)) : 'data a combinar'}</span>
        <span><SeloPost p={p} /></span>
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
    <main>
      <div>
        <Marca tamanho="h-11 w-11 text-lg" />
        <div>
          <p>Área do cliente</p>
          <h1>{cliente.nome}</h1>
        </div>
      </div>
      {posts.length > 0 && (
        <section aria-label="Seus posts">
          <div>
            <h2>Seus posts</h2>
            <p>{aguardando.length ? `${aguardando.length} ${aguardando.length === 1 ? 'post espera' : 'posts esperam'} a sua aprovação.` : 'Nada esperando a sua aprovação agora.'}</p>
          </div>
          {aguardando.length > 0 && <div>{aguardando.map((p) => <CartaoPost key={p.id} p={p} base={base} />)}</div>}
          {demais.length > 0 && (
            <details open={!aguardando.length}>
              <summary>Aprovados e publicados ({demais.length})</summary>
              <div>{demais.map((p) => <CartaoPost key={p.id} p={p} base={base} />)}</div>
            </details>
          )}
        </section>
      )}
      {cliente.metaContaId && (
        <Suspense fallback={<p>Carregando seus anúncios…</p>}>
          <GaleriaAnuncios contaId={cliente.metaContaId} periodo={periodo} mostrarGasto={false} seletor={<SeletorPeriodo base={base} periodo={periodo} hoje={hoje} />} />
        </Suspense>
      )}
      <BibliotecaAnuncios paginaId={cliente.metaPaginaId} />
      <section>
        <h2>Documentos para você</h2>
        {docs.length === 0 ? (
          <p>Nenhum documento disponível por enquanto.</p>
        ) : (
          docs.map((d) => (
            <Link key={d.id} href={`${base}/documentos/${d.id}`}>
              <FileText />
              <span>
                <span>{d.titulo}</span>
                <span>Atualizado em {dia.format(new Date(d.atualizadoEm))}</span>
              </span>
            </Link>
          ))
        )}
      </section>
    </main>
  )
}
