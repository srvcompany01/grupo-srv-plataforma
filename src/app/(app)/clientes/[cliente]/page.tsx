import { BarChart3, ExternalLink, IdCard, KeyRound, LayoutGrid, ListChecks, MapPin, Megaphone, MessageCircle, Search, Send } from 'lucide-react'
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
import { ROTULO_STATUS_CLIENTE, buscarCliente, linkDoCliente, listarClientes } from '@/servicos/clientes-plataforma'
import { statusDasListas } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { listarDocumentos } from '@/servicos/documentos'
import { instagramDoCliente } from '@/servicos/insights-instagram'
import { atalhoPeriodo } from '@/dominio/periodo-anuncios'
import { listarEquipe } from '@/servicos/usuarios'
import { BibliotecaAnuncios } from '@/componentes/BibliotecaAnuncios'
import { Modulo } from '@/componentes/Modulo'
import { LinkDoCliente } from '@/componentes/LinkDoCliente'
import { editarCliente } from '../acoes'
import { FormCliente } from '../FormCliente'
import { CamposCliente } from './CamposCliente'
import { ExcluirCliente } from './ExcluirCliente'
import { EnviarRelatorio } from '@/componentes/relatorios/EnviarRelatorio'
import { relatoriosDoCliente } from '@/servicos/relatorio-compartilhado'
import { SeletorCapa } from './SeletorCapa'
import { SeletorLogo } from './SeletorLogo'

const ABAS = [
  { id: 'visao', rotulo: 'Visão geral' },
  { id: 'tarefas', rotulo: 'Tarefas' },
  { id: 'posts', rotulo: 'Posts' },
  { id: 'relatorio', rotulo: 'Relatório' },
  { id: 'arquivos', rotulo: 'Arquivos' },
  { id: 'acessos', rotulo: 'Acessos' },
] as const

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
  const pedida = Array.isArray(sp.aba) ? sp.aba[0] : sp.aba
  const aba = ABAS.find((a) => a.id === pedida)?.id ?? 'visao'
  const seletor = <SeletorPeriodo base={aba === 'visao' ? `/clientes/${id}` : `/clientes/${id}?aba=${aba}`} periodo={periodo} hoje={hoje} />
  const [tarefas, equipe] = await Promise.all([listarTarefas(sb, { todas: true }, { ...lerFiltros({}), clientes: [id] }, hoje), listarEquipe(sb)])
  const statusPorLista = await statusDasListas(sb, [...new Set(tarefas.map((t) => t.listaId))])
  const categoria = (t: { listaId: string; statusId: string }): Categoria => statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)?.categoria ?? 'todo'
  const arvore = montarArvore(tarefas)
  const departamentos = [...new Map(tarefas.map((t) => [t.listaId, t.listaNome])).entries()]
  const ctx = { equipe, hoje, statusPorLista, mostrarLista: false }

  const totalTarefas = arvore.length
  const lista = (await listarClientes(sb).catch(() => [])).filter((c) => !c.interno)
  const abertasPorCliente = new Map<string, number>()
  if (lista.length) {
    for (const t of await listarTarefas(sb, { todas: true }, lerFiltros({}), hoje).catch(() => [])) if (!t.paiId && !t.concluidaEm && t.clienteId) abertasPorCliente.set(t.clienteId, (abertasPorCliente.get(t.clienteId) ?? 0) + 1)
  }
  const raizes = tarefas.filter((t) => !t.paiId)
  const doMes = raizes.filter((t) => t.prazo?.startsWith(hoje.slice(0, 7)))
  const emAtraso = raizes.filter((t) => !t.concluidaEm && categoria(t) !== 'done' && t.prazo && t.prazo < hoje).length
  const tiposDeLista = new Map((await sb.from('lists').select('id, kind').in('id', [...new Set(tarefas.map((t) => t.listaId))]).then((q) => q.data ?? [])).map((l) => [l.id, l.kind]))
  const posts = raizes.filter((t) => tiposDeLista.get(t.listaId) === 'conteudo').sort((a, b) => (b.prazo ?? '').localeCompare(a.prazo ?? ''))
  const arquivos = aba === 'arquivos' ? (await listarDocumentos(sb).catch(() => [])).filter((d) => d.clienteId === id && !d.arquivadoEm) : []
  const nomeStatus = (t: { listaId: string; statusId: string }) => statusPorLista[t.listaId]?.find((x) => x.id === t.statusId)?.nome ?? ''
  const indicadores = [
    { rotulo: 'Posts no mês', valor: doMes.length, vermelho: false },
    { rotulo: 'Aprovados ou publicados', valor: doMes.filter((t) => t.concluidaEm || categoria(t) === 'done').length, vermelho: false },
    { rotulo: 'Em atraso', valor: emAtraso, vermelho: emAtraso > 0 },
  ]

  return (
    <div>
      <div className="sticky top-0 z-10 flex h-10 items-center gap-2 border-b border-borda-fraca bg-white px-3 text-corpo">
        <Link href="/clientes" className="text-texto-2 hover:text-texto">Clientes</Link>
        <span className="text-texto-3">/</span>
        <h2 className="truncate text-destaque font-bold text-[var(--client)]">{cliente.nome}</h2>
        <span className="rounded bg-[var(--bg-active)] px-1.5 text-legenda font-semibold text-texto-2">{ROTULO_STATUS_CLIENTE[cliente.status]}</span>
      </div>
      <div>
      <div className="flex items-start">
        <aside className="sticky top-10 hidden max-h-[calc(100dvh-122px)] w-[220px] shrink-0 overflow-y-auto border-r border-borda-fraca bg-[var(--bg-subtle)] p-2 lg:block" aria-label="Clientes">
          {lista.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}${aba === 'visao' ? '' : `?aba=${aba}`}`} className={`flex h-8 items-center justify-between gap-2 rounded px-2 text-corpo hover:bg-hover ${c.id === id ? 'bg-[var(--bg-active)]' : ''}`}>
              <span className="truncate font-bold text-[var(--client)]">{c.nome}</span>
              {abertasPorCliente.get(c.id) ? <span className="text-rotulo tabular-nums text-texto-3">{abertasPorCliente.get(c.id)}</span> : null}
            </Link>
          ))}
        </aside>
        <div className="min-w-0 flex-1 space-y-4 p-3">
          <nav className="flex gap-1 border-b border-borda-fraca" aria-label="Seções do cliente">
            {ABAS.map((a) => (
              <Link key={a.id} href={a.id === 'visao' ? `/clientes/${id}` : `/clientes/${id}?aba=${a.id}`} aria-current={aba === a.id ? 'page' : undefined} className={`h-9 border-b-2 px-2 text-corpo leading-9 ${aba === a.id ? 'border-texto font-semibold text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}>{a.rotulo}</Link>
            ))}
          </nav>
          {aba === 'visao' && (
            <div className="max-w-[1100px] space-y-4">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
                <Suspense fallback={<div className="rounded-lg border border-borda px-3 py-2.5"><p className="text-rotulo text-texto-2">Alcance 30 dias</p><p className="text-xl font-semibold text-texto-3">…</p></div>}>
                  <AlcanceIndicador paginaId={cliente.metaPaginaId} hoje={hoje} />
                </Suspense>
                {indicadores.map((i) => (
                  <div key={i.rotulo} className="rounded-lg border border-borda px-3 py-2.5">
                    <p className="text-rotulo text-texto-2">{i.rotulo}</p>
                    <p className={`text-xl font-semibold tabular-nums ${i.vermelho ? 'text-[var(--red)]' : ''}`}>{i.valor}</p>
                  </div>
                ))}
              </div>
      <header className="overflow-hidden rounded-lg border border-borda bg-white">
        <div className="relative h-28 w-full md:h-36" style={{ background: cliente.cor }}>
          {capa?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- origem externa (Unsplash) ou URL assinada do R2
            <img src={capa.url} alt="" width={1600} height={400} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[40px] font-bold tracking-rotulo text-claro/90">{iniciais(cliente.nome)}</span>
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
            <div className="flex min-w-0 items-end gap-3">
              {capa?.logo && (
                // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
                <img src={capa.logo} alt={`Logo de ${cliente.nome}`} width={72} height={72} className="h-14 w-14 shrink-0 rounded-lg border-2 border-claro bg-white object-cover" />
              )}
              <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-claro drop-shadow md:text-2xl">{cliente.nome}</h1>
              {cliente.razaoSocial && <p className="truncate text-rotulo text-claro/85">{cliente.razaoSocial}</p>}
              </div>
            </div>
            
          </div>
          {capa?.credito && <span className="absolute right-2 top-3 rounded bg-black/50 px-1.5 py-0.5 text-legenda text-claro/90">{capa.credito}</span>}
        </div>
        {podeGerir && <div className="flex flex-wrap items-center gap-2 border-t border-borda px-4 py-2.5"><SeletorCapa clienteId={id} temCapa={!!capa?.url} /><SeletorLogo clienteId={id} temLogo={!!capa?.logo} /></div>}
      </header>
              <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
                <div className="min-w-0 space-y-4">
                  <Modulo icone={LayoutGrid} titulo="Dados do cliente" descricao="Campos do cliente; os marcados aparecem no cartão da galeria">
                    <CamposCliente clienteId={id} campos={campos} valores={valores[id] ?? {}} podeEditar={podeGerir} />
                  </Modulo>
                </div>
                <div className="space-y-4">
                    <BibliotecaAnuncios paginaId={cliente.metaPaginaId} semPagina={podeGerir ? 'Cole o link da Biblioteca de Anúncios do cliente no cadastro para ver os anúncios ativos dele por aqui e no portal.' : undefined} />
                </div>
              </div>
            </div>
          )}
          {aba === 'tarefas' && <div className="space-y-4">
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
          </div>}
          {aba === 'posts' && (
            <Modulo icone={ListChecks} titulo="Posts" descricao="Tarefas das listas de conteúdo com a tag deste cliente" acoes={<span className="text-rotulo text-texto-3">{posts.length}</span>}>
              {posts.length === 0 ? <p className="py-6 text-center text-corpo text-texto-3">Nenhum post deste cliente ainda.</p> : (
                <ul className="-mx-3 -my-3">
                  {posts.map((t) => (
                    <li key={t.id}>
                      <Link href={`/tarefas/${t.id}`} className="flex h-9 items-center gap-3 border-b border-borda-fraca px-3 text-corpo last:border-b-0 hover:bg-hover">
                        <span className="min-w-0 flex-1 truncate">{t.titulo}</span>
                        <span className="hidden w-40 truncate text-rotulo text-texto-3 sm:block">{t.listaNome}</span>
                        <span className="w-28 truncate text-rotulo text-texto-2">{nomeStatus(t)}</span>
                        <span className={`w-16 text-right text-rotulo tabular-nums ${t.prazo && t.prazo < hoje && !t.concluidaEm ? 'text-[var(--red)]' : 'text-texto-3'}`}>{t.prazo ? t.prazo.split('-').reverse().slice(0, 2).join('/') : '—'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Modulo>
          )}
          {aba === 'arquivos' && (
            <Modulo icone={IdCard} titulo="Arquivos" descricao="Documentos ligados a este cliente" acoes={<Link href="/documentos" className="text-rotulo text-texto-2 hover:text-texto">Abrir Documentos</Link>}>
              {arquivos.length === 0 ? <p className="py-6 text-center text-corpo text-texto-3">Nenhum documento deste cliente.</p> : (
                <ul className="-mx-3 -my-3">
                  {arquivos.map((d) => (
                    <li key={d.id}>
                      <Link href={`/documentos/${d.id}`} className="flex h-9 items-center gap-3 border-b border-borda-fraca px-3 text-corpo last:border-b-0 hover:bg-hover">
                        <span className="min-w-0 flex-1 truncate">{d.icone ? `${d.icone} ` : ''}{d.titulo}</span>
                        <span className="w-32 truncate text-rotulo text-texto-3">{d.donoNome}</span>
                        <span className="w-20 text-right text-rotulo tabular-nums text-texto-3">{new Date(d.atualizadoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Belem', day: '2-digit', month: '2-digit' })}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Modulo>
          )}
          {aba === 'relatorio' && <div className="space-y-4">
        {!cliente.interno && (cliente.metaPaginaId || cliente.metaContaId || cliente.googleAdsId) && (
          <Suspense fallback={<Modulo icone={BarChart3} titulo="Relatório do cliente" descricao="Buscando no Meta e no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Montando o relatório (pago, orgânico e os dois juntos)…</p></Modulo>}>
            <CarregarRelatorio cliente={cliente} periodo={periodo} seletor={seletor} />
          </Suspense>
        )}
        {!cliente.interno && (
          <div id="relatorios">
            <Modulo icone={Send} titulo="Relatório para o cliente" descricao="Gera um link com os números do período (anúncios, Instagram e Google) e o texto pronto para o WhatsApp">
              <div className="space-y-4">
                <EnviarRelatorio clienteId={cliente.id} hoje={dataDeHoje(new Date())} temWhatsapp={!!cliente.whatsapp} />
                <Suspense fallback={null}>
                  <RelatoriosGerados clienteId={cliente.id} whatsapp={cliente.whatsapp} />
                </Suspense>
              </div>
            </Modulo>
          </div>
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
          </div>}
          {aba === 'acessos' && <div className="max-w-[720px] space-y-4">
          <Modulo icone={IdCard} titulo="Cadastro" descricao="Dados do cliente e as ligações com o Meta e o Google Ads">
            <FormCliente acao={editarCliente.bind(null, id)} cliente={cliente} podeEditar={podeGerir} embutido />
          </Modulo>
          {!cliente.interno && linkSlug && (
            <Modulo icone={KeyRound} titulo="Link do cliente" descricao="Sem login: o cliente aprova os posts e vê anúncios e documentos por este link">
              <LinkDoCliente clienteId={id} url={`${origem}/cliente/${linkSlug}`} podeGerir={podeGerir} />
            </Modulo>
          )}
          {admin && !cliente.interno && <ExcluirCliente clienteId={id} nome={cliente.nome} />}
          </div>}
        </div>
      </div>
      </div>
    </div>
  )
}

/** Alcance do Instagram nos últimos 30 dias (Meta). Sem página ligada ou com erro, mostra traço. */
async function AlcanceIndicador({ paginaId, hoje }: { paginaId: string | null; hoje: string }) {
  const r = paginaId ? await instagramDoCliente(paginaId, atalhoPeriodo(30, hoje), false).catch(() => null) : null
  const valor = r && !('erro' in r) ? r.alcance.toLocaleString('pt-BR') : '—'
  return (
    <div className="rounded-lg border border-borda px-3 py-2.5">
      <p className="text-rotulo text-texto-2">Alcance 30 dias</p>
      <p className="text-xl font-semibold tabular-nums">{valor}</p>
    </div>
  )
}

/** Os últimos relatórios gerados (inclusive os automáticos do dia 1), com o WhatsApp e o link. */
async function RelatoriosGerados({ clienteId, whatsapp }: { clienteId: string; whatsapp: string | null }) {
  const lista = await relatoriosDoCliente(await criarClienteServidor(), { id: clienteId, whatsapp })
  if (!lista.length) return null
  const data = (d: string) => d.split('-').reverse().slice(0, 2).join('/')
  return (
    <div className="space-y-1">
      <p className="text-legenda font-semibold text-texto-3">Gerados</p>
      <ul className="divide-y divide-borda/60 rounded-lg border border-borda text-rotulo">
        {lista.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5">
            <span className="min-w-0 flex-1">
              {data(r.de)} a {data(r.ate)}
              {r.automatico && <span className="ml-1.5 rounded-full bg-fundo px-1.5 text-micro font-semibold text-texto-3">automático</span>}
              {r.desatualizado && <span className="ml-1.5 rounded-full bg-aviso-fundo px-1.5 text-micro font-semibold text-aviso-forte" title="Há uma versão mais nova do cálculo e da separação entre pago e orgânico. Gere novamente antes de enviar.">desatualizado</span>}
              {r.revogado && <span className="ml-1.5 rounded-full bg-perigo-fundo px-1.5 text-micro font-semibold text-perigo-forte">revogado</span>}
              {r.avisos.length > 0 && <span className="ml-1.5 rounded-full bg-aviso-fundo px-1.5 text-micro font-semibold text-aviso-forte" title={r.avisos.join('\n')}>{r.avisos.length} aviso(s)</span>}
            </span>
            <span className="text-legenda text-texto-3">{new Date(r.em).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })}</span>
            {!r.revogado && <a href={r.whatsapp ?? `https://wa.me/?text=${encodeURIComponent(r.texto)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-legenda font-semibold text-sucesso-forte hover:underline" title={r.whatsapp ? 'Para o WhatsApp do cadastro' : 'Sem WhatsApp no cadastro: escolha o contato'}><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>}
            <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-legenda font-semibold text-[#1d6fe0] hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Abrir</a>
            {!r.revogado && <a href={`${r.url}?imprimir=1`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-legenda font-semibold text-[#1d6fe0] hover:underline" title="Abre o relatório já na impressão: escolha Salvar como PDF">PDF</a>}
          </li>
        ))}
      </ul>
    </div>
  )
}
