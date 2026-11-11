import { BarChart3, ExternalLink, IdCard, KeyRound, LayoutGrid, ListChecks, MapPin, Megaphone, MessageCircle, Search, Send } from 'lucide-react'
import Link from 'next/link'
import { Ic } from '@/componentes/app/Ic'
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
import { hashtagsDoCliente } from '@/servicos/hashtags-cliente'
import { HashtagsCliente } from './HashtagsCliente'
import { QuadroEstrategia } from '@/componentes/estrategia/Quadros'
import { METODOS, preenchimento } from '@/dominio/estrategia'
import { estrategiaDoCliente } from '@/servicos/estrategia'
import { SeletorCapa } from './SeletorCapa'
import { SeletorLogo } from './SeletorLogo'

const ABAS = [
  { id: 'visao', rotulo: 'Visão geral' },
  { id: 'tarefas', rotulo: 'Tarefas' },
  { id: 'posts', rotulo: 'Posts' },
  { id: 'estrategia', rotulo: 'Estratégia' },
  { id: 'hashtags', rotulo: 'Hashtags' },
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
  const semanasDoMes = [1, 2, 3, 4].map((n) => {
    const doDia = (t: { prazo: string | null }) => Math.min(4, Math.ceil(Number((t.prazo ?? '').slice(8, 10)) / 7))
    const sem = doMes.filter((t) => doDia(t) === n)
    return { l: `S${n}`, plan: sem.length, feitas: sem.filter((t) => t.concluidaEm || categoria(t) === 'done').length }
  })
  const indicadores = [
    { rotulo: 'Posts no mês', valor: doMes.length, vermelho: false, icone: 'photo_library', cor: '#6d3fe0' },
    { rotulo: 'Aprovados ou publicados', valor: doMes.filter((t) => t.concluidaEm || categoria(t) === 'done').length, vermelho: false, icone: 'check_circle', cor: '#16a34a' },
    { rotulo: 'Em atraso', valor: emAtraso, vermelho: emAtraso > 0, icone: 'schedule', cor: '#d80d12' },
  ]

  return (
    <div>
      <div>
        <Link href="/clientes">Clientes</Link>
        <span>/</span>
        <h2>{cliente.nome}</h2>
        <span>{ROTULO_STATUS_CLIENTE[cliente.status]}</span>
      </div>
      <div>
      <div>
        <aside className="hidden" aria-label="Clientes">
          {lista.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}${aba === 'visao' ? '' : `?aba=${aba}`}`}>
              <span>{c.nome}</span>
              {abertasPorCliente.get(c.id) ? <span>{abertasPorCliente.get(c.id)}</span> : null}
            </Link>
          ))}
        </aside>
        <div>
          <nav aria-label="Seções do cliente">
            {ABAS.map((a) => (
              <Link key={a.id} href={a.id === 'visao' ? `/clientes/${id}` : `/clientes/${id}?aba=${a.id}`} aria-current={aba === a.id ? 'page' : undefined}>{a.rotulo}</Link>
            ))}
          </nav>
          {aba === 'visao' && (
            <div>
              <div>
                <Suspense fallback={<div><p>Alcance 30 dias</p><p>…</p></div>}>
                  <AlcanceIndicador paginaId={cliente.metaPaginaId} hoje={hoje} />
                </Suspense>
                {indicadores.map((i) => (
                  <div key={i.rotulo}>
                    <p><span style={{ background: i.cor }}><Ic n={i.icone} s={14} fill /></span><span>{i.rotulo}</span></p>
                    <p>{i.valor}</p>
                  </div>
                ))}
              </div>
      <header>
        <div style={{ background: cliente.cor }}>
          {capa?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- origem externa (Unsplash) ou URL assinada do R2
            <img src={capa.url} alt="" width={1600} height={400} />
          ) : (
            <span>{iniciais(cliente.nome)}</span>
          )}
          <span />
                    <div>
            <div>
              {capa?.logo && (
                // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
                <img src={capa.logo} alt={`Logo de ${cliente.nome}`} width={72} height={72} />
              )}
              <div>
              <h1>{cliente.nome}</h1>
              {cliente.razaoSocial && <p>{cliente.razaoSocial}</p>}
              </div>
            </div>
            
          </div>
          {capa?.credito && <span>{capa.credito}</span>}
        </div>
        {podeGerir && <div><SeletorCapa clienteId={id} temCapa={!!capa?.url} /><SeletorLogo clienteId={id} temLogo={!!capa?.logo} /></div>}
      </header>
              <div>
                <div>
                  <section>
                    <div><span>Entregas do mês</span><Link href={`/clientes/${id}?aba=tarefas`}>Abrir na lista</Link></div>
                    {doMes.length === 0 && <p>Nenhuma entrega com vencimento neste mês.</p>}
                    {doMes.slice(0, 8).map((t) => (
                      <Link key={t.id} href={`/tarefas/${t.id}`}>
                        <span style={{ width: 12, height: 12, flex: 'none', borderRadius: '50%', border: `2px solid ${statusPorLista[t.listaId]?.find((x) => x.id === t.statusId)?.cor ?? '#8b8b94'}`, background: categoria(t) === 'done' ? (statusPorLista[t.listaId]?.find((x) => x.id === t.statusId)?.cor ?? '#8b8b94') : 'transparent' }} />
                        <span>{t.titulo}</span>
                        <span style={{ background: `color-mix(in srgb, ${statusPorLista[t.listaId]?.find((x) => x.id === t.statusId)?.cor ?? '#8b8b94'} 16%, transparent)` }}>{nomeStatus(t)}</span>
                        <span>{t.prazo ? t.prazo.split('-').reverse().slice(0, 2).join('/') : '—'}</span>
                      </Link>
                    ))}
                  </section>
                  <section>
                    <div>
                      <span>Entregas por semana</span>
                      <span><span><span style={{ width: 8, height: 8, borderRadius: 2, background: 'repeating-linear-gradient(135deg, var(--hachura) 0 2px, transparent 2px 6px)' }} />Planejado</span><span><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--text)' }} />Entregue</span></span>
                    </div>
                    <div style={{ height: 140 }}>
                      {semanasDoMes.map((w) => (
                        <div key={w.l}>
                          <div style={{ height: 90 }}>
                            <span style={{ width: 18, height: Math.min(90, w.plan * 20), borderRadius: '6px 6px 0 0', background: 'repeating-linear-gradient(135deg, var(--hachura) 0 2px, transparent 2px 6px)' }} />
                            <span style={{ width: 18, height: Math.min(90, w.feitas * 20), borderRadius: '6px 6px 0 0', background: 'linear-gradient(180deg, #e8262b, #d80d12)' }} />
                          </div>
                          <span>{w.l} · {w.feitas}/{w.plan}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                  <Modulo icone={LayoutGrid} titulo="Dados do cliente" descricao="Campos do cliente; os marcados aparecem no cartão da galeria">
                    <CamposCliente clienteId={id} campos={campos} valores={valores[id] ?? {}} podeEditar={podeGerir} />
                  </Modulo>
                </div>
                <div>
                    <BibliotecaAnuncios paginaId={cliente.metaPaginaId} semPagina={podeGerir ? 'Cole o link da Biblioteca de Anúncios do cliente no cadastro para ver os anúncios ativos dele por aqui e no portal.' : undefined} />
                </div>
              </div>
            </div>
          )}
          {aba === 'tarefas' && <div>
        <Modulo
          icone={ListChecks}
          titulo="Trabalho por departamento"
          descricao="Tarefas com a tag deste cliente, separadas pela lista em que estão"
          acoes={<span>{totalTarefas} {totalTarefas === 1 ? 'tarefa' : 'tarefas'}</span>}
        >
          {departamentos.length === 0 ? (
            <p>Nenhuma tarefa com a tag deste cliente ainda.</p>
          ) : (
            <div>
              {departamentos.map(([listaId, listaNome]) => {
                const raizes = arvore.filter((t) => t.listaId === listaId)
                return (
                  <div key={listaId}>
                    <div>
                      <h3>
                        <span>{listaNome}</span>
                        <span>{raizes.length}</span>
                      </h3>
                      <Link href={`/listas/${listaId}`}>Abrir lista →</Link>
                    </div>
                    <div>
                      <VisaoLista grupos={CATEGORIAS.map((c) => ({ ...c, id: `${listaId}-${c.id}`, tarefas: raizes.filter((t) => categoria(t) === c.id) })).filter((g) => g.tarefas.length)} ctx={ctx} euId={eu.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Modulo>
          </div>}
          {aba === 'estrategia' && <EstrategiaDoCliente clienteId={id} />}
          {aba === 'hashtags' && <HashtagsCliente clienteId={id} iniciais={{ instagram: (await hashtagsDoCliente(sb, id, 'instagram')).join(' ') }} />}
          {aba === 'posts' && (
            <Modulo icone={ListChecks} titulo="Posts" descricao="Tarefas das listas de conteúdo com a tag deste cliente" acoes={<span>{posts.length}</span>}>
              {posts.length === 0 ? <p>Nenhum post deste cliente ainda.</p> : (
                <ul>
                  {posts.map((t) => (
                    <li key={t.id}>
                      <Link href={`/tarefas/${t.id}`}>
                        <span>{t.titulo}</span>
                        <span className="hidden">{t.listaNome}</span>
                        <span>{nomeStatus(t)}</span>
                        <span>{t.prazo ? t.prazo.split('-').reverse().slice(0, 2).join('/') : '—'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Modulo>
          )}
          {aba === 'arquivos' && (
            <Modulo icone={IdCard} titulo="Arquivos" descricao="Documentos ligados a este cliente" acoes={<Link href="/documentos">Abrir Documentos</Link>}>
              {arquivos.length === 0 ? <p>Nenhum documento deste cliente.</p> : (
                <ul>
                  {arquivos.map((d) => (
                    <li key={d.id}>
                      <Link href={`/documentos/${d.id}`}>
                        <span>{d.icone ? `${d.icone} ` : ''}{d.titulo}</span>
                        <span>{d.donoNome}</span>
                        <span>{new Date(d.atualizadoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Belem', day: '2-digit', month: '2-digit' })}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Modulo>
          )}
          {aba === 'relatorio' && <div>
        {!cliente.interno && (cliente.metaPaginaId || cliente.metaContaId || cliente.googleAdsId) && (
          <Suspense fallback={<Modulo icone={BarChart3} titulo="Relatório do cliente" descricao="Buscando no Meta e no Google…"><p>Montando o relatório (pago, orgânico e os dois juntos)…</p></Modulo>}>
            <CarregarRelatorio cliente={cliente} periodo={periodo} seletor={seletor} />
          </Suspense>
        )}
        {!cliente.interno && (
          <div id="relatorios">
            <Modulo icone={Send} titulo="Relatório para o cliente" descricao="Gera um link com os números do período (anúncios, Instagram e Google) e o texto pronto para o WhatsApp">
              <div>
                <EnviarRelatorio clienteId={cliente.id} hoje={dataDeHoje(new Date())} temWhatsapp={!!cliente.whatsapp} />
                <Suspense fallback={null}>
                  <RelatoriosGerados clienteId={cliente.id} whatsapp={cliente.whatsapp} />
                </Suspense>
              </div>
            </Modulo>
          </div>
        )}
        {cliente.metaContaId && (
          <Suspense fallback={<Modulo icone={Megaphone} titulo="Anúncios ativos" descricao="Buscando no Meta…"><p>Carregando os anúncios…</p></Modulo>}>
            <GaleriaAnuncios contaId={cliente.metaContaId} periodo={periodo} mostrarGasto seletor={seletor} />
          </Suspense>
        )}
        {cliente.googleAdsId && (
          <Suspense fallback={<Modulo icone={Search} titulo="Google Ads" descricao="Buscando no Google…"><p>Carregando as campanhas…</p></Modulo>}>
            <GoogleAds contaId={cliente.googleAdsId} periodo={periodo} seletor={seletor} />
          </Suspense>
        )}
        {!cliente.interno && (
          <Suspense fallback={<Modulo icone={MapPin} titulo="Google Meu Negócio" descricao="Buscando no Google…"><p>Carregando as métricas…</p></Modulo>}>
            <GoogleNegocio clienteId={id} perfil={cliente.googlePerfil} perfilNome={cliente.googlePerfilNome} periodo={periodo} seletor={seletor} podeGerir={podeGerir} />
          </Suspense>
        )}
          </div>}
          {aba === 'acessos' && <div>
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
    <div>
      <p><span style={{ background: '#1d6fe0' }}><Ic n="donut_large" s={14} fill /></span><span>Alcance 30 dias</span></p>
      <p>{valor}</p>
    </div>
  )
}

/** Os últimos relatórios gerados (inclusive os automáticos do dia 1), com o WhatsApp e o link. */
async function RelatoriosGerados({ clienteId, whatsapp }: { clienteId: string; whatsapp: string | null }) {
  const lista = await relatoriosDoCliente(await criarClienteServidor(), { id: clienteId, whatsapp })
  if (!lista.length) return null
  const data = (d: string) => d.split('-').reverse().slice(0, 2).join('/')
  return (
    <div>
      <p>Gerados</p>
      <ul>
        {lista.map((r) => (
          <li key={r.id}>
            <span>
              {data(r.de)} a {data(r.ate)}
              {r.automatico && <span>automático</span>}
              {r.desatualizado && <span title="Há uma versão mais nova do cálculo e da separação entre pago e orgânico. Gere novamente antes de enviar.">desatualizado</span>}
              {r.revogado && <span>revogado</span>}
              {r.avisos.length > 0 && <span title={r.avisos.join('\n')}>{r.avisos.length} aviso(s)</span>}
            </span>
            <span>{new Date(r.em).toLocaleDateString('pt-BR', { timeZone: 'America/Belem' })}</span>
            {!r.revogado && <a href={r.whatsapp ?? `https://wa.me/?text=${encodeURIComponent(r.texto)}`} target="_blank" rel="noreferrer" title={r.whatsapp ? 'Para o WhatsApp do cadastro' : 'Sem WhatsApp no cadastro: escolha o contato'}><MessageCircle /> WhatsApp</a>}
            <a href={r.url} target="_blank" rel="noreferrer"><ExternalLink /> Abrir</a>
            {!r.revogado && <a href={`${r.url}?imprimir=1`} target="_blank" rel="noreferrer" title="Abre o relatório já na impressão: escolha Salvar como PDF">PDF</a>}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Tudo o que foi construído na aba Estratégia, reunido e só para leitura (edita-se lá). */
async function EstrategiaDoCliente({ clienteId }: { clienteId: string }) {
  const est = await estrategiaDoCliente(await criarClienteServidor(), clienteId)
  return (
    <div>
      <nav aria-label="Seções da estratégia">
        {METODOS.map((m) => (
          <a key={m.id} href={`#est-${m.id}`}>
            <Ic n={m.icone} s={15} /> {m.curto} <span>{Math.round(preenchimento(m.id, est[m.id]) * 100)}%</span>
          </a>
        ))}
      </nav>
      {METODOS.map((m) => (
        <section key={m.id} id={`est-${m.id}`}>
          <div>
            <h3><Ic n={m.icone} s={18} /> {m.rotulo}</h3>
            <Link href={`/estrategia?secao=${m.id}&cliente=${clienteId}`}>Editar</Link>
          </div>
          {preenchimento(m.id, est[m.id]) > 0 || est[m.id].marcados.length ? (
            <QuadroEstrategia metodo={m.id} clienteId={clienteId} inicial={est[m.id]} leitura />
          ) : (
            <p>Ainda não preenchido. <Link href={`/estrategia?secao=${m.id}&cliente=${clienteId}`}>Começar</Link></p>
          )}
        </section>
      ))}
    </div>
  )
}
