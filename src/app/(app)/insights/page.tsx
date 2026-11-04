import { Eye, Heart, LayoutGrid, MapPin, MessageCircle, Radar, Share2, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { GoogleNegocio } from '@/componentes/anuncios/GoogleNegocio'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { BlocoAnalise } from '@/componentes/insights/BlocoAnalise'
import { AtualizarComentarios, ListaComentarios } from '@/componentes/insights/ComentariosRedes'
import { InstagramSocial } from '@/componentes/insights/social/InstagramSocial'
import { CartaoSocial, GradeKpis } from '@/componentes/insights/social/Social'
import { LogoRede } from '@/componentes/redes/LogoRede'
import type { SlugRede } from '@/dominio/redes-sociais'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { Modulo } from '@/componentes/Modulo'
import { dataDeHoje } from '@/dominio/filtros'
import { analisarOrganico, engajamento, type ResumoInstagram } from '@/dominio/insights'
import { consultaPeriodo, diasDoPeriodo, lerPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { seguidoresPagosNoPeriodo } from '@/servicos/meta-anuncios'
import { cliquesLinkBioNoPeriodo } from '@/servicos/performance'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { listarComentarios, resumoComentarios, type FiltroComentarios } from '@/servicos/comentarios-redes'
import { instagramDoCliente } from '@/servicos/insights-instagram'
import { NomeCliente } from '@/componentes/NomeCliente'

// O botão "Atualizar agora" dos comentários lê a Meta de todos os clientes.
export const maxDuration = 300

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

/** Plataformas orgânicas: as que já funcionam e as que vêm aí. */
const PLATAFORMAS: { nome: string; situacao: string; ativa: boolean; slug?: SlugRede; cor: string }[] = [
  { nome: 'Instagram', situacao: 'Ativo', ativa: true, slug: 'instagram', cor: '#e1306c' },
  { nome: 'Google Meu Negócio', situacao: 'Aguardando o Google', ativa: false, slug: 'gmn', cor: '#1a73e8' },
  { nome: 'TikTok', situacao: 'Em breve', ativa: false, slug: 'tiktok', cor: '#111111' },
  { nome: 'YouTube', situacao: 'Em breve', ativa: false, slug: 'youtube', cor: '#ff0033' },
  { nome: 'Facebook (Página)', situacao: 'Em breve', ativa: false, cor: '#0866ff' },
  { nome: 'LinkedIn', situacao: 'Em breve', ativa: false, slug: 'linkedin', cor: '#0a66c2' },
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
    <div className="page-shell ins" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--ins-acc-suave)', color: 'var(--ins-acc)' }}><Share2 className="h-5 w-5" strokeWidth={1.7} /></span>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-.02em', lineHeight: 1.1 }}>Insights</h1>
            <p className="ins-sub">Redes sociais orgânicas · todos os clientes</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorCliente social base={aba === 'geral' ? '/insights' : `/insights?aba=${aba}`} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={consultaPeriodo(periodo)} />
          {aba === 'geral' && <SeletorPeriodo social base={escolhido ? `/insights?cliente=${escolhido.id}` : '/insights'} periodo={periodo} hoje={hoje} />}
        </div>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Abas de insights">
        {([['geral', 'Métricas', null], ['organico', 'Comentários orgânicos', resumo?.organico], ['anuncios', 'Comentários de anúncios', resumo?.anuncio]] as const).map(([a, rotulo, n]) => (
          <Link key={a} href={linkAba(a)} aria-current={aba === a ? 'page' : undefined} className="ins-aba">
            {a !== 'geral' && <MessageCircle className="h-3.5 w-3.5" />}{rotulo}
            {n && n.alertas > 0 && <span className="rounded-md bg-perigo px-1.5 text-micro font-bold text-claro" title="Negativos ou agressivos sem decisão">{n.alertas}</span>}
            {n && n.semResposta > 0 && <span className="rounded-md px-1.5 text-micro font-semibold" style={{ background: 'rgba(0,0,0,.1)' }} title="Sem resposta">{n.semResposta}</span>}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap gap-2">
        {PLATAFORMAS.map((p) => (
          <span key={p.nome} className="ins-rede" data-ativa={p.ativa || undefined} data-breve={!p.ativa || undefined}>
            {p.slug ? <LogoRede slug={p.slug} tamanho={26} /> : <span className="h-[26px] w-[26px] rounded-md" style={{ background: p.cor }} aria-hidden />}
            <span><span className="font-semibold">{p.nome}</span><small>{p.situacao}</small></span>
          </span>
        ))}
      </div>

      {aba !== 'geral' ? (
        <CartaoSocial
          titulo={aba === 'organico' ? 'Comentários nos posts' : 'Comentários nos anúncios'}
          sub={<>{escolhido ? <NomeCliente nome={escolhido.nome} /> : 'Todos os clientes'} · Instagram e Facebook · atualiza sozinho a cada 15 minutos</>}
          direita={<AtualizarComentarios clienteId={escolhido?.id ?? null} />}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {([['todos', 'Todos'], ['sem_resposta', 'Sem resposta'], ['alerta', 'Negativos e agressivos'], ['respondidos', 'Respondidos'], ['ocultos', 'Ocultos']] as const).map(([f, r]) => (
                <Link key={f} href={linkAba(aba, f)} data-on={filtro === f || undefined} className="ins-filtro">{r}</Link>
              ))}
            </div>
            <Suspense fallback={<p className="py-6 text-center text-rotulo text-texto-3">Carregando os comentários…</p>}>
              <Comentarios origem={aba === 'organico' ? 'organico' : 'anuncio'} clienteId={escolhido?.id ?? null} filtro={filtro} />
            </Suspense>
          </div>
        </CartaoSocial>
      ) : escolhido ? (
        <>
          <Suspense fallback={<Carregando titulo={`Instagram de ${escolhido.nome}`} />}>
            <DetalheInstagram cliente={escolhido} periodo={periodo} />
          </Suspense>
          <Suspense fallback={<Modulo icone={MapPin} titulo="Google Meu Negócio" descricao="Buscando no Google…"><p className="py-6 text-center text-rotulo text-texto-3">Carregando…</p></Modulo>}>
            <GoogleNegocio clienteId={escolhido.id} perfil={escolhido.googlePerfil} perfilNome={escolhido.googlePerfilNome} periodo={periodo} seletor={seletor} podeGerir={false} />
          </Suspense>
        </>
      ) : (
        <Suspense fallback={<Carregando titulo="Panorama do Instagram" />}>
          <Panorama clientes={clientes} periodo={periodo} />
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
  return <CartaoSocial titulo={titulo} sub="Buscando no Meta…"><p className="py-8 text-center text-[13px]" style={{ color: 'var(--ins-suave)' }}>Carregando os insights…</p></CartaoSocial>
}

async function DetalheInstagram({ cliente, periodo }: { cliente: Cliente; periodo: PeriodoAnuncios }) {
  const [ig, cliquesLinkBio, seguidoresPagos] = await Promise.all([instagramDoCliente(cliente.metaPaginaId!, periodo, true), criarClienteServidor().then((sb) => cliquesLinkBioNoPeriodo(sb, cliente.id, periodo.de, periodo.ate)), seguidoresPagosNoPeriodo(cliente.metaContaId, periodo)])
  const dias = diasDoPeriodo(periodo)
  if ('erro' in ig) return <CartaoSocial titulo={`Instagram de ${cliente.nome}`}><p className="rounded-xl border border-perigo-borda bg-perigo-fundo/40 px-3 py-2 text-rotulo text-perigo-forte">{ig.erro}</p></CartaoSocial>
  return (
    <>
      <InstagramSocial ig={ig} dias={dias} rotuloPeriodo={rotuloPeriodo(periodo)} cliquesLinkBio={cliquesLinkBio} seguidoresPagos={seguidoresPagos} />
      {periodo.atalho === 'hoje' && <p className="ins-sub">Dados consultados agora no Instagram; a própria Meta pode levar alguns minutos para consolidar o dia.</p>}
      <CartaoSocial titulo="Insights e recomendações" sub="O que os números mostram e o que fazer no orgânico">
        <div className="space-y-2">
          <BlocoAnalise analise={analisarOrganico(ig, dias.length)} />
          <p className="ins-sub">Para cruzar com o tráfego pago, veja o relatório na <Link href={`/clientes/${cliente.id}`} className="font-semibold hover:underline" style={{ color: 'var(--ins-acc)' }}>página do cliente</Link>.</p>
        </div>
      </CartaoSocial>
    </>
  )
}

async function Panorama({ clientes, periodo }: { clientes: Cliente[]; periodo: PeriodoAnuncios }) {
  const linhas = await Promise.all(clientes.map(async (c) => ({ c, ig: await instagramDoCliente(c.metaPaginaId!, periodo, false) })))
  const ok = linhas.filter((l): l is { c: Cliente; ig: ResumoInstagram } => !('erro' in l.ig))
  const soma = (k: 'alcance' | 'interacoes' | 'seguidores' | 'visualizacoes' | 'novosSeguidores') => ok.reduce((s, l) => s + l.ig[k], 0)
  const posts = ok.reduce((s, l) => s + l.ig.posts.length, 0)
  const ordenadas = [...linhas].sort((a, b) => ('erro' in b.ig ? -1 : b.ig.alcance) - ('erro' in a.ig ? -1 : a.ig.alcance))
  const maiorAlcance = Math.max(1, ...ok.map((l) => l.ig.alcance))
  const q = consultaPeriodo(periodo)
  return (
    <CartaoSocial titulo="Panorama do Instagram" sub={`Todos os clientes com Instagram ligado · ${rotuloPeriodo(periodo)}`}>
      <div className="space-y-4">
        <GradeKpis
          itens={[
            { id: 'seg', rotulo: 'Seguidores somados', valor: numero.format(soma('seguidores')), chip: soma('novosSeguidores') ? `${soma('novosSeguidores') > 0 ? '+' : ''}${numero.format(soma('novosSeguidores'))}` : undefined, tom: soma('novosSeguidores') > 0 ? 'bom' : soma('novosSeguidores') < 0 ? 'ruim' : undefined, extra: 'saldo no período', icone: Users, cor: '#ef6a1a' },
            { id: 'alc', rotulo: 'Alcance', valor: numero.format(soma('alcance')), icone: Radar, cor: '#2a78d6' },
            { id: 'views', rotulo: 'Visualizações', valor: numero.format(soma('visualizacoes')), icone: Eye, cor: '#6250d6' },
            { id: 'int', rotulo: 'Interações', valor: numero.format(soma('interacoes')), extra: 'alcance da conta inclui anúncios', icone: Heart, cor: '#d6336c' },
            { id: 'posts', rotulo: 'Posts', valor: String(posts), icone: LayoutGrid, cor: '#eda100' },
            { id: 'perfis', rotulo: 'Perfis', valor: `${ok.length} de ${linhas.length}`, extra: ok.length < linhas.length ? `${linhas.length - ok.length} com erro` : undefined, tom: ok.length < linhas.length ? 'ruim' : undefined, icone: UserCheck, cor: '#1d9a5b' },
          ]}
        />
        {linhas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-borda py-10 text-center text-corpo text-texto-3">Nenhum cliente com a Página do Facebook no cadastro (é por ela que o Instagram profissional é encontrado).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ins-tabela min-w-[48rem]">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="text-right">Seguidores</th>
                  <th>Alcance</th>
                  <th className="text-right">Interações</th>
                  <th className="text-right">Interações ÷ alcance</th>
                  <th className="text-right">Posts</th>
                  <th className="text-right">Novos seguidores</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map(({ c, ig }) => (
                  <tr key={c.id}>
                    <td>
                      <NomeCliente nome={c.nome} href={`/insights?cliente=${c.id}${q ? `&${q}` : ''}`} />
                      {!('erro' in ig) && <p className="text-micro text-texto-3">@{ig.usuario}</p>}
                    </td>
                    {'erro' in ig ? (
                      <td colSpan={6} className="text-legenda text-perigo">{ig.erro}</td>
                    ) : (
                      <>
                        <td className="text-right tabular-nums">{numero.format(ig.seguidores)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="h-2 rounded-sm" style={{ width: `${Math.max(2, (ig.alcance / maiorAlcance) * 96)}px`, background: 'var(--ins-acc)' }} />
                            <span className="tabular-nums">{numero.format(ig.alcance)}</span>
                          </div>
                        </td>
                        <td className="text-right tabular-nums">{numero.format(ig.interacoes)}</td>
                        <td className="text-right tabular-nums" title="Interações ÷ alcance da conta (o alcance da conta inclui anúncios; o engajamento dos posts fica no detalhe do cliente)">{pct(engajamento(ig.interacoes, ig.alcance))}</td>
                        <td className="text-right tabular-nums">{ig.posts.length}</td>
                        <td className={`text-right font-semibold tabular-nums ${ig.novosSeguidores > 0 ? 'text-sucesso-forte' : ig.novosSeguidores < 0 ? 'text-perigo-forte' : 'text-texto-3'}`}>{ig.novosSeguidores > 0 ? '▲ +' : ig.novosSeguidores < 0 ? '▼ ' : ''}{numero.format(ig.novosSeguidores)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-legenda text-texto-3">{periodo.atalho === 'hoje' ? 'Dados consultados agora no Instagram; a própria Meta pode levar alguns minutos para consolidar o dia.' : 'Dados do Instagram pela API do Meta, atualizados a cada hora.'} Clique no cliente (ou escolha no seletor) para ver os posts, o melhor formato e as recomendações.</p>
      </div>
    </CartaoSocial>
  )
}
