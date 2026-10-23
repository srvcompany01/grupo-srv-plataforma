import { Camera, Eye, Heart, LayoutGrid, MapPin, MessageCircle, Radar, Sparkles, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { GoogleNegocio } from '@/componentes/anuncios/GoogleNegocio'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { BlocoAnalise, Numeros } from '@/componentes/insights/BlocoAnalise'
import { CORES_SERIE } from '@/componentes/insights/GraficoDiario'
import { AtualizarComentarios, ListaComentarios } from '@/componentes/insights/ComentariosRedes'
import { InstagramInsights } from '@/componentes/insights/InstagramInsights'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { Modulo } from '@/componentes/Modulo'
import { dataDeHoje } from '@/dominio/filtros'
import { analisarOrganico, engajamento, tomEngajamento, tomVariacao, type ResumoInstagram } from '@/dominio/insights'
import { SeloTom } from '@/componentes/insights/tom'
import { consultaPeriodo, diasDoPeriodo, lerPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { listarComentarios, resumoComentarios, type FiltroComentarios } from '@/servicos/comentarios-redes'
import { instagramDoCliente } from '@/servicos/insights-instagram'

// O botão "Atualizar agora" dos comentários lê a Meta de todos os clientes.
export const maxDuration = 300

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

/** Plataformas orgânicas: as que já funcionam e as que vêm aí. */
const PLATAFORMAS: { nome: string; situacao: string; ativa: boolean; cor: string }[] = [
  { nome: 'Instagram', situacao: 'Ativo', ativa: true, cor: 'linear-gradient(45deg, #f9a825, #e1306c 45%, #833ab4)' },
  { nome: 'Google Meu Negócio', situacao: 'Aguardando o Google', ativa: false, cor: '#1a73e8' },
  { nome: 'TikTok', situacao: 'Em breve', ativa: false, cor: '#111111' },
  { nome: 'YouTube', situacao: 'Em breve', ativa: false, cor: '#ff0033' },
  { nome: 'Facebook (Página)', situacao: 'Em breve', ativa: false, cor: '#0866ff' },
  { nome: 'LinkedIn', situacao: 'Em breve', ativa: false, cor: '#0a66c2' },
]

/** Insights orgânicos: panorama de todos os clientes ou, com ?cliente=, o detalhe de um (com recomendações). */
export default async function Insights({ searchParams }: PageProps<'/insights'>) {
  await exigirEquipe()
  const sp = await searchParams
  const hoje = dataDeHoje(new Date())
  const periodo = lerPeriodo(sp, hoje)
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado' && c.metaPaginaId)
  const escolhido = clientes.find((c) => c.id === sp.cliente) ?? null
  const seletor = <SeletorPeriodo base={escolhido ? `/insights?cliente=${escolhido.id}` : '/insights'} periodo={periodo} hoje={hoje} />
  const aba = sp.aba === 'organico' || sp.aba === 'anuncios' ? sp.aba : 'geral'
  const filtro: FiltroComentarios = ['sem_resposta', 'alerta', 'respondidos', 'ocultos'].includes(String(sp.filtro)) ? (sp.filtro as FiltroComentarios) : 'todos'
  const resumo = await resumoComentarios(sb, escolhido?.id ?? null).catch(() => null)
  const linkAba = (a: string, f?: string) => `/insights?${[a !== 'geral' ? `aba=${a}` : '', escolhido ? `cliente=${escolhido.id}` : '', f && f !== 'todos' ? `filtro=${f}` : ''].filter(Boolean).join('&')}`.replace(/\?$/, '')

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Orgânico</p>
          <h1 className="page-title mt-1">Insights</h1>
        </div>
        <SeletorCliente base={aba === 'geral' ? '/insights' : `/insights?aba=${aba}`} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={consultaPeriodo(periodo)} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PLATAFORMAS.map((p) => (
          <span key={p.nome} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-legenda ${p.ativa ? 'font-semibold text-white shadow-sm' : 'border border-dashed border-borda bg-white text-texto-3'}`} style={p.ativa ? { background: p.cor } : undefined}>
            {!p.ativa && <span className="h-2 w-2 rounded-full" style={{ background: p.cor }} aria-hidden />}
            {p.nome}{!p.ativa && ` · ${p.situacao}`}
          </span>
        ))}
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-borda" aria-label="Abas de insights">
        {([['geral', 'Visão geral', null], ['organico', 'Comentários orgânicos', resumo?.organico], ['anuncios', 'Comentários de anúncios', resumo?.anuncio]] as const).map(([a, rotulo, n]) => (
          <Link key={a} href={linkAba(a)} className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-rotulo font-semibold ${aba === a ? 'border-petroleo text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}>
            {a !== 'geral' && <MessageCircle className="h-3.5 w-3.5" />}{rotulo}
            {n && n.alertas > 0 && <span className="rounded-full bg-perigo px-1.5 text-micro font-bold text-white" title="Negativos ou agressivos sem decisão">{n.alertas}</span>}
            {n && n.semResposta > 0 && <span className="rounded-full bg-fundo px-1.5 text-micro font-semibold text-texto-2" title="Sem resposta">{n.semResposta}</span>}
          </Link>
        ))}
      </nav>

      {aba !== 'geral' ? (
        <Modulo
          icone={MessageCircle}
          titulo={aba === 'organico' ? 'Comentários nos posts' : 'Comentários nos anúncios'}
          descricao={`${escolhido ? escolhido.nome : 'Todos os clientes'} · Instagram e Facebook · atualiza sozinho a cada 15 minutos`}
          acoes={<AtualizarComentarios clienteId={escolhido?.id ?? null} />}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {([['todos', 'Todos'], ['sem_resposta', 'Sem resposta'], ['alerta', 'Negativos e agressivos'], ['respondidos', 'Respondidos'], ['ocultos', 'Ocultos']] as const).map(([f, r]) => (
                <Link key={f} href={linkAba(aba, f)} className={`rounded-full border px-2.5 py-1 text-legenda font-semibold ${filtro === f ? (f === 'alerta' ? 'border-perigo bg-perigo text-white' : 'border-petroleo bg-petroleo text-white') : 'border-borda bg-white text-texto-2 hover:bg-hover'}`}>{r}</Link>
              ))}
            </div>
            <Suspense fallback={<p className="py-6 text-center text-rotulo text-texto-3">Carregando os comentários…</p>}>
              <Comentarios origem={aba === 'organico' ? 'organico' : 'anuncio'} clienteId={escolhido?.id ?? null} filtro={filtro} />
            </Suspense>
          </div>
        </Modulo>
      ) : escolhido ? (
        <>
          <Suspense fallback={<Carregando titulo={`Instagram de ${escolhido.nome}`} />}>
            <DetalheInstagram cliente={escolhido} periodo={periodo} seletor={seletor} />
          </Suspense>
          <Suspense fallback={<Modulo icone={MapPin} titulo="Google Meu Negócio" descricao="Buscando no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando…</p></Modulo>}>
            <GoogleNegocio clienteId={escolhido.id} perfil={escolhido.googlePerfil} perfilNome={escolhido.googlePerfilNome} periodo={periodo} seletor={seletor} podeGerir={false} />
          </Suspense>
        </>
      ) : (
        <Suspense fallback={<Carregando titulo="Panorama do Instagram" />}>
          <Panorama clientes={clientes} periodo={periodo} seletor={seletor} />
        </Suspense>
      )}
    </div>
  )
}

async function Comentarios({ origem, clienteId, filtro }: { origem: 'organico' | 'anuncio'; clienteId: string | null; filtro: FiltroComentarios }) {
  const lista = await listarComentarios(await criarClienteServidor(), { origem, clienteId, filtro })
  if (!lista) return <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">Falta rodar a migração dos comentários (20261024000055_comentarios_redes.sql) no Supabase.</p>
  return <ListaComentarios comentarios={lista} />
}

function Carregando({ titulo }: { titulo: string }) {
  return <Modulo icone={Camera} titulo={titulo} descricao="Buscando no Meta…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando os insights…</p></Modulo>
}

async function DetalheInstagram({ cliente, periodo, seletor }: { cliente: Cliente; periodo: PeriodoAnuncios; seletor: ReactNode }) {
  const ig = await instagramDoCliente(cliente.metaPaginaId!, periodo, true)
  const dias = diasDoPeriodo(periodo)
  return (
    <>
      <Modulo icone={Camera} titulo={'erro' in ig ? `Instagram de ${cliente.nome}` : `@${ig.usuario}`} descricao={`${cliente.nome} · ${rotuloPeriodo(periodo)}`} acoes={seletor}>
        {'erro' in ig ? <p className="rounded-xl border border-perigo-borda bg-perigo-fundo/40 px-3 py-2 text-rotulo text-perigo-forte">{ig.erro}</p> : <InstagramInsights ig={ig} dias={dias} />}
      </Modulo>
      {!('erro' in ig) && (
        <Modulo icone={Sparkles} titulo="Insights e recomendações" descricao="O que os números mostram e o que fazer no orgânico">
          <div className="space-y-2">
            <BlocoAnalise analise={analisarOrganico(ig, dias.length)} />
            <p className="text-legenda text-texto-3">Para cruzar com o tráfego pago, veja o relatório na <Link href={`/clientes/${cliente.id}`} className="font-semibold text-petroleo hover:underline">página do cliente</Link>.</p>
          </div>
        </Modulo>
      )}
    </>
  )
}

async function Panorama({ clientes, periodo, seletor }: { clientes: Cliente[]; periodo: PeriodoAnuncios; seletor: ReactNode }) {
  const linhas = await Promise.all(clientes.map(async (c) => ({ c, ig: await instagramDoCliente(c.metaPaginaId!, periodo, false) })))
  const ok = linhas.filter((l): l is { c: Cliente; ig: ResumoInstagram } => !('erro' in l.ig))
  const soma = (k: 'alcance' | 'interacoes' | 'seguidores' | 'visualizacoes' | 'novosSeguidores') => ok.reduce((s, l) => s + l.ig[k], 0)
  const posts = ok.reduce((s, l) => s + l.ig.posts.length, 0)
  const ordenadas = [...linhas].sort((a, b) => ('erro' in b.ig ? -1 : b.ig.alcance) - ('erro' in a.ig ? -1 : a.ig.alcance))
  const maiorAlcance = Math.max(1, ...ok.map((l) => l.ig.alcance))
  const q = consultaPeriodo(periodo)
  return (
    <Modulo icone={Camera} titulo="Panorama do Instagram" descricao={`Todos os clientes com Instagram ligado · ${rotuloPeriodo(periodo)}`} acoes={seletor}>
      <div className="space-y-4">
        <Numeros
          itens={[
            { rotulo: 'Seguidores somados', valor: numero.format(soma('seguidores')), extra: soma('novosSeguidores') ? `${soma('novosSeguidores') > 0 ? '▲ +' : '▼ '}${numero.format(soma('novosSeguidores'))} no período` : undefined, tom: tomVariacao(soma('novosSeguidores')), rotuloTom: soma('novosSeguidores') > 0 ? 'Crescendo' : 'Caindo', icone: Users, cor: '#6250d6' },
            { rotulo: 'Alcance', valor: numero.format(soma('alcance')), icone: Radar, cor: '#2a78d6' },
            { rotulo: 'Visualizações', valor: numero.format(soma('visualizacoes')), icone: Eye, cor: '#1baf7a' },
            { rotulo: 'Interações', valor: numero.format(soma('interacoes')), extra: `${pct(engajamento(soma('interacoes'), soma('alcance')))} do alcance`, tom: tomEngajamento(engajamento(soma('interacoes'), soma('alcance'))), icone: Heart, cor: '#e87ba4' },
            { rotulo: 'Posts', valor: String(posts), icone: LayoutGrid, cor: '#eb6834' },
            { rotulo: 'Perfis', valor: `${ok.length} de ${linhas.length}`, tom: ok.length < linhas.length ? 'atencao' : undefined, extra: ok.length < linhas.length ? `${linhas.length - ok.length} com erro` : undefined, icone: UserCheck, cor: '#eda100' },
          ]}
        />
        {linhas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borda py-10 text-center text-corpo text-texto-3">Nenhum cliente com a Página do Facebook no cadastro (é por ela que o Instagram profissional é encontrado).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-rotulo">
              <thead>
                <tr className="border-b border-borda text-left text-legenda text-texto-3">
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 text-right font-medium">Seguidores</th>
                  <th className="py-2 pr-3 font-medium">Alcance</th>
                  <th className="py-2 pr-3 text-right font-medium">Interações</th>
                  <th className="py-2 pr-3 text-right font-medium">Engajamento</th>
                  <th className="py-2 pr-3 text-right font-medium">Posts</th>
                  <th className="py-2 text-right font-medium">Novos seguidores</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map(({ c, ig }) => (
                  <tr key={c.id} className="border-b border-borda/60 last:border-0">
                    <td className="py-2 pr-3">
                      <Link href={`/insights?cliente=${c.id}${q ? `&${q}` : ''}`} className="font-medium text-texto hover:underline">{c.nome}</Link>
                      {!('erro' in ig) && <p className="text-micro text-texto-3">@{ig.usuario}</p>}
                    </td>
                    {'erro' in ig ? (
                      <td colSpan={6} className="py-2 text-legenda text-perigo">{ig.erro}</td>
                    ) : (
                      <>
                        <td className="py-2 pr-3 text-right tabular-nums">{numero.format(ig.seguidores)}</td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 rounded-sm" style={{ width: `${Math.max(2, (ig.alcance / maiorAlcance) * 96)}px`, background: CORES_SERIE[0] }} />
                            <span className="tabular-nums">{numero.format(ig.alcance)}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{numero.format(ig.interacoes)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums"><span className="inline-flex items-center justify-end gap-1.5">{pct(engajamento(ig.interacoes, ig.alcance))} {tomEngajamento(engajamento(ig.interacoes, ig.alcance)) !== 'neutro' && <SeloTom tom={tomEngajamento(engajamento(ig.interacoes, ig.alcance))} />}</span></td>
                        <td className="py-2 pr-3 text-right tabular-nums">{ig.posts.length}</td>
                        <td className={`py-2 text-right font-semibold tabular-nums ${ig.novosSeguidores > 0 ? 'text-sucesso-forte' : ig.novosSeguidores < 0 ? 'text-perigo-forte' : 'text-texto-3'}`}>{ig.novosSeguidores > 0 ? '▲ +' : ig.novosSeguidores < 0 ? '▼ ' : ''}{numero.format(ig.novosSeguidores)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-legenda text-texto-3">Dados do Instagram pela API do Meta, atualizados a cada hora. Clique no cliente (ou escolha no seletor) para ver os posts, o melhor formato e as recomendações.</p>
      </div>
    </Modulo>
  )
}
