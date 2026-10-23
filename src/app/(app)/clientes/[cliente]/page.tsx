import { BarChart3, IdCard, KeyRound, LayoutGrid, ListChecks, MapPin, Megaphone, Search } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import { GaleriaAnuncios } from '@/componentes/anuncios/GaleriaAnuncios'
import { GoogleAds } from '@/componentes/anuncios/GoogleAds'
import { GoogleNegocio } from '@/componentes/anuncios/GoogleNegocio'
import { CarregarRelatorio } from '@/componentes/insights/CarregarRelatorio'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { lerPeriodo } from '@/dominio/periodo-anuncios'
import { notFound } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { CATEGORIAS } from '@/componentes/tarefas/categorias'
import { VisaoLista } from '@/componentes/tarefas/VisaoLista'
import { iniciais } from '@/dominio/clientes-galeria'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { montarArvore, type Categoria } from '@/dominio/tarefas'
import { capasDosClientes, listarCamposCliente, valoresDosClientes } from '@/servicos/clientes-galeria'
import { ROTULO_STATUS_CLIENTE, buscarCliente, linkDoCliente } from '@/servicos/clientes-plataforma'
import { statusDasListas } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { listarEquipe } from '@/servicos/usuarios'
import { BibliotecaAnuncios } from '@/componentes/BibliotecaAnuncios'
import { Modulo } from '@/componentes/Modulo'
import { LinkDoCliente } from '@/componentes/LinkDoCliente'
import { editarCliente } from '../acoes'
import { FormCliente } from '../FormCliente'
import { CamposCliente } from './CamposCliente'
import { ExcluirCliente } from './ExcluirCliente'
import { SeletorCapa } from './SeletorCapa'

export default async function Cliente({ params, searchParams }: PageProps<'/clientes/[cliente]'>) {
  const { cliente: id } = await params
  const sp = await searchParams
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const cliente = await buscarCliente(sb, id)
  if (!cliente) notFound()
  const admin = eu.papel === 'admin'
  const podeGerir = admin || eu.papel === 'gestor'
  const [campos, valores, capas] = await Promise.all([listarCamposCliente(sb), valoresDosClientes(sb), capasDosClientes(sb)])
  const capa = capas[id]
  const linkSlug = cliente.interno ? null : await linkDoCliente(sb, id)
  const cabecalhos = await headers()
  const origem = `${cabecalhos.get('x-forwarded-proto') ?? 'https'}://${cabecalhos.get('host') ?? 'app.gruposrv.com.br'}`

  // Visão por cliente: o trabalho dele em todos os departamentos, uma seção por departamento (lista).
  const hoje = dataDeHoje(new Date())
  const periodo = lerPeriodo(sp, hoje)
  const seletor = <SeletorPeriodo base={`/clientes/${id}`} periodo={periodo} hoje={hoje} />
  const [tarefas, equipe] = await Promise.all([listarTarefas(sb, { todas: true }, { ...lerFiltros({}), clientes: [id] }, hoje), listarEquipe(sb)])
  const statusPorLista = await statusDasListas(sb, [...new Set(tarefas.map((t) => t.listaId))])
  const categoria = (t: { listaId: string; statusId: string }): Categoria => statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)?.categoria ?? 'todo'
  const arvore = montarArvore(tarefas)
  const departamentos = [...new Map(tarefas.map((t) => [t.listaId, t.listaNome])).entries()]
  const ctx = { equipe, hoje, statusPorLista, mostrarLista: false }

  const totalTarefas = arvore.length

  return (
    <div className="page-shell">
      <header className="overflow-hidden rounded-xl border border-borda bg-white">
        <div className="relative h-40 w-full md:h-52" style={{ background: cliente.cor }}>
          {capa?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- origem externa (Unsplash) ou URL assinada do R2
            <img src={capa.url} alt="" width={1600} height={400} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[40px] font-bold tracking-rotulo text-white/90">{iniciais(cliente.nome)}</span>
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <Link href="/clientes" className="absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1 text-rotulo font-medium text-white backdrop-blur hover:bg-black/55">← Clientes</Link>
          <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-white drop-shadow md:text-3xl">{cliente.nome}</h1>
              {cliente.razaoSocial && <p className="truncate text-rotulo text-white/85">{cliente.razaoSocial}</p>}
            </div>
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-legenda font-semibold text-texto">{ROTULO_STATUS_CLIENTE[cliente.status]}</span>
          </div>
          {capa?.credito && <span className="absolute right-2 top-3 rounded bg-black/50 px-1.5 py-0.5 text-legenda text-white/90">{capa.credito}</span>}
        </div>
        {podeGerir && <div className="border-t border-borda px-4 py-2.5"><SeletorCapa clienteId={id} temCapa={!!capa?.url} /></div>}
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
        <Modulo
          icone={ListChecks}
          titulo="Trabalho por departamento"
          descricao="Tarefas com a tag deste cliente, separadas pela lista em que estão"
          acoes={<span className="rounded-full bg-fundo px-2.5 py-0.5 text-legenda font-semibold text-texto-2">{totalTarefas} {totalTarefas === 1 ? 'tarefa' : 'tarefas'}</span>}
        >
          {departamentos.length === 0 ? (
            <p className="py-6 text-center text-corpo text-texto-3">Nenhuma tarefa com a tag deste cliente ainda.</p>
          ) : (
            <div className="space-y-4">
              {departamentos.map(([listaId, listaNome]) => {
                const raizes = arvore.filter((t) => t.listaId === listaId)
                return (
                  <div key={listaId} className="overflow-hidden rounded-lg border border-borda">
                    <div className="flex items-center justify-between gap-2 border-b border-borda bg-fundo/60 px-3 py-2">
                      <h3 className="flex min-w-0 items-center gap-2 text-rotulo font-semibold text-texto">
                        <span className="truncate">{listaNome}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-legenda font-normal text-texto-3">{raizes.length}</span>
                      </h3>
                      <Link href={`/listas/${listaId}`} className="shrink-0 text-legenda font-semibold text-petroleo hover:underline">Abrir lista →</Link>
                    </div>
                    <div className="p-2">
                      <VisaoLista grupos={CATEGORIAS.map((c) => ({ ...c, id: `${listaId}-${c.id}`, tarefas: raizes.filter((t) => categoria(t) === c.id) })).filter((g) => g.tarefas.length)} ctx={ctx} euId={eu.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Modulo>
        {!cliente.interno && (cliente.metaPaginaId || cliente.metaContaId || cliente.googleAdsId) && (
          <Suspense fallback={<Modulo icone={BarChart3} titulo="Relatório do cliente" descricao="Buscando no Meta e no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Montando o relatório (pago, orgânico e os dois juntos)…</p></Modulo>}>
            <CarregarRelatorio cliente={cliente} periodo={periodo} seletor={seletor} />
          </Suspense>
        )}
        {cliente.metaContaId && (
          <Suspense fallback={<Modulo icone={Megaphone} titulo="Anúncios ativos" descricao="Buscando no Meta…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando os anúncios…</p></Modulo>}>
            <GaleriaAnuncios contaId={cliente.metaContaId} periodo={periodo} mostrarGasto seletor={seletor} />
          </Suspense>
        )}
        {cliente.googleAdsId && (
          <Suspense fallback={<Modulo icone={Search} titulo="Google Ads" descricao="Buscando no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando as campanhas…</p></Modulo>}>
            <GoogleAds contaId={cliente.googleAdsId} periodo={periodo} seletor={seletor} />
          </Suspense>
        )}
        {!cliente.interno && (
          <Suspense fallback={<Modulo icone={MapPin} titulo="Google Meu Negócio" descricao="Buscando no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando as métricas…</p></Modulo>}>
            <GoogleNegocio clienteId={id} perfil={cliente.googlePerfil} perfilNome={cliente.googlePerfilNome} periodo={periodo} seletor={seletor} podeGerir={podeGerir} />
          </Suspense>
        )}
        </div>

        <div className="space-y-5">
          <Modulo icone={LayoutGrid} titulo="Informações da galeria" descricao="Campos do cliente; os marcados aparecem no cartão da galeria">
            <CamposCliente clienteId={id} campos={campos} valores={valores[id] ?? {}} podeEditar={podeGerir} />
          </Modulo>
          <BibliotecaAnuncios paginaId={cliente.metaPaginaId} semPagina={podeGerir ? 'Cole o link da Biblioteca de Anúncios do cliente no cadastro para ver os anúncios ativos dele por aqui e no portal.' : undefined} />
          <Modulo icone={IdCard} titulo="Cadastro" descricao="Dados do cliente e as ligações com o Meta e o Google Ads">
            <FormCliente acao={editarCliente.bind(null, id)} cliente={cliente} podeEditar={podeGerir} embutido />
          </Modulo>
          {!cliente.interno && linkSlug && (
            <Modulo icone={KeyRound} titulo="Link do cliente" descricao="Sem login: o cliente aprova os posts e vê anúncios e documentos por este link">
              <LinkDoCliente clienteId={id} url={`${origem}/cliente/${linkSlug}`} podeGerir={podeGerir} />
            </Modulo>
          )}
          {admin && !cliente.interno && <ExcluirCliente clienteId={id} nome={cliente.nome} />}
        </div>
      </div>
    </div>
  )
}
