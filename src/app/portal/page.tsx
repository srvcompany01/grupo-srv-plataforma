import { FileText } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { GaleriaAnuncios } from '@/componentes/anuncios/GaleriaAnuncios'
import { lerPeriodoAnuncios } from '@/dominio/anuncios-meta'
import { BibliotecaAnuncios } from '@/componentes/BibliotecaAnuncios'
import { Marca } from '@/componentes/Marca'
import { BotaoSair } from '@/componentes/app/BotaoSair'
import { exigirCliente } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarDocumentos } from '@/servicos/documentos'
import { clienteDoUsuario, postsDoCliente, type PostPortal } from '@/servicos/portal-conteudo'
import { ROTULO_FORMATO } from '@/dominio/conteudo'

const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const quando = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

function SeloPost({ p }: { p: PostPortal }) {
  const [texto, cor] = p.status === 'publicado' ? ['Publicado', 'bg-sucesso text-white'] : p.aprovacao === 'aguardando' ? ['Aguardando sua aprovação', 'bg-aviso text-white'] : p.aprovacao === 'aprovado' ? ['Aprovado', 'bg-sucesso-fundo text-sucesso-forte'] : ['Ajuste pedido', 'bg-perigo-fundo text-perigo-forte']
  return <span className={`rounded-full px-2 py-0.5 text-micro font-semibold ${cor}`}>{texto}</span>
}

function CartaoPost({ p }: { p: PostPortal }) {
  const capa = p.midias[0]
  return (
    <Link href={`/portal/posts/${p.id}`} className={`flex gap-3 rounded-xl border bg-white p-2.5 transition hover:border-borda-forte ${p.aprovacao === 'aguardando' ? 'border-aviso' : 'border-borda'}`}>
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

export default async function Portal({ searchParams }: PageProps<'/portal'>) {
  const sp = await searchParams
  const dias = lerPeriodoAnuncios(typeof sp.anuncios === 'string' ? sp.anuncios : undefined)
  const eu = await exigirCliente()
  const sb = await criarClienteServidor()
  // A RLS entrega só os documentos liberados e só o cadastro do próprio cliente.
  const [docs, cliente] = await Promise.all([
    listarDocumentos(sb).catch(() => []),
    sb.from('clients').select('meta_page_id, meta_ad_account_id').maybeSingle().then((r) => r.data, () => null),
  ])
  // Posts enviados para o cliente (sem a migration de publicação, a lista fica vazia).
  const meuCliente = await clienteDoUsuario(eu.id).catch(() => null)
  const posts = meuCliente ? await postsDoCliente(meuCliente.id).catch(() => []) : []
  const aguardando = posts.filter((p) => p.aprovacao === 'aguardando')
  const demais = posts.filter((p) => p.aprovacao !== 'aguardando').slice(0, 12)
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Marca tamanho="h-11 w-11 text-lg" />
          <h1 className="text-xl font-semibold">Olá, {eu.nome || 'cliente'}!</h1>
        </div>
        <BotaoSair />
      </div>
      {posts.length > 0 && (
        <section className="space-y-3 rounded-xl border border-borda bg-white p-4" aria-label="Seus posts">
          <div>
            <h2 className="text-corpo font-semibold text-texto">Seus posts</h2>
            <p className="text-legenda text-texto-3">{aguardando.length ? `${aguardando.length} ${aguardando.length === 1 ? 'post espera' : 'posts esperam'} a sua aprovação.` : 'Nada esperando a sua aprovação agora.'}</p>
          </div>
          {aguardando.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{aguardando.map((p) => <CartaoPost key={p.id} p={p} />)}</div>}
          {demais.length > 0 && (
            <details className="group" open={!aguardando.length}>
              <summary className="cursor-pointer text-rotulo font-semibold text-texto-2">Aprovados e publicados ({demais.length})</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{demais.map((p) => <CartaoPost key={p.id} p={p} />)}</div>
            </details>
          )}
        </section>
      )}
      {cliente?.meta_ad_account_id && (
        <Suspense fallback={<p className="rounded-xl border border-borda bg-white p-4 text-rotulo text-texto-3">Carregando seus anúncios…</p>}>
          <GaleriaAnuncios contaId={cliente.meta_ad_account_id} dias={dias} mostrarGasto={false} href={(d) => (d === 7 ? '/portal' : `/portal?anuncios=${d}`)} />
        </Suspense>
      )}
      <BibliotecaAnuncios paginaId={cliente?.meta_page_id ?? null} />
      <section className="space-y-2">
        <h2 className="text-rotulo font-semibold text-texto-3">Documentos para você</h2>
        {docs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-borda p-6 text-center text-corpo text-texto-3">Nenhum documento disponível por enquanto.</p>
        ) : (
          docs.map((d) => (
            <Link key={d.id} href={`/portal/documentos/${d.id}`} className="flex items-center gap-3 rounded-lg border border-borda bg-white p-3 hover:border-marca-clara">
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
