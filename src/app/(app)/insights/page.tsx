import { MapPin, MessageCircle, Share2 } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { GoogleNegocio } from '@/componentes/anuncios/GoogleNegocio'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { AtualizarComentarios, ListaComentarios } from '@/componentes/insights/ComentariosRedes'
import { InstagramSocial } from '@/componentes/insights/social/InstagramSocial'
import { CartaoSocial } from '@/componentes/insights/social/Cartao'
import { GradeMetricas } from '@/componentes/insights/social/Metricas'
import { RedesFaixa } from '@/componentes/insights/social/RedesFaixa'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { Modulo } from '@/componentes/Modulo'
import { dataDeHoje } from '@/dominio/filtros'
import { engajamento, type ResumoInstagram } from '@/dominio/insights'
import { somarDias } from '@/dominio/agenda'
import { consultaPeriodo, diasDoPeriodo, lerPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { seguidoresPagosNoPeriodo } from '@/servicos/meta-anuncios'
import { cliquesLinkBioNoPeriodo } from '@/servicos/performance'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { listarComentarios, resumoComentarios, type FiltroComentarios } from '@/servicos/comentarios-redes'
import { instagramDoCliente } from '@/servicos/insights-instagram'
import { NomeCliente } from '@/componentes/NomeCliente'
import { FunilOrganico } from '@/componentes/FunilConversao'

// O botão "Atualizar agora" dos comentários lê a Meta de todos os clientes.
export const maxDuration = 300

const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

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
    <div>
      <header>
        <Share2 style={{ color: 'var(--text-2)' }} strokeWidth={1.7} />
        <h1>Insights</h1>
        <SeletorCliente social base={aba === 'geral' ? '/insights' : `/insights?aba=${aba}`} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo={consultaPeriodo(periodo)} />
        <span />
        <span className="hidden xl:inline" style={{ color: 'var(--ins-suave)' }}>{periodo.atalho === 'hoje' ? 'dados de hoje, ao vivo' : 'atualiza a cada hora'}</span>
        {aba === 'geral' && <SeletorPeriodo social base={escolhido ? `/insights?cliente=${escolhido.id}` : '/insights'} periodo={periodo} hoje={hoje} />}
      </header>
      <div>
      <nav aria-label="Abas de insights">
        {([['geral', 'Métricas', null], ['organico', 'Comentários orgânicos', resumo?.organico], ['anuncios', 'Comentários de anúncios', resumo?.anuncio]] as const).map(([a, rotulo, n]) => (
          <Link key={a} href={linkAba(a)} aria-current={aba === a ? 'page' : undefined}>
            {a !== 'geral' && <MessageCircle />}{rotulo}
            {n && n.alertas > 0 && <span title="Negativos ou agressivos sem decisão">{n.alertas}</span>}
            {n && n.semResposta > 0 && <span style={{ background: 'var(--bg-active)' }} title="Sem resposta">{n.semResposta}</span>}
          </Link>
        ))}
      </nav>

      {aba !== 'geral' ? (
        <CartaoSocial
          titulo={aba === 'organico' ? 'Comentários nos posts' : 'Comentários nos anúncios'}
          sub={<>{escolhido ? <NomeCliente nome={escolhido.nome} /> : 'Todos os clientes'} · Instagram e Facebook · atualiza sozinho a cada 15 minutos</>}
          direita={<AtualizarComentarios clienteId={escolhido?.id ?? null} />}
        >
          <div>
            <div>
              {([['todos', 'Todos'], ['sem_resposta', 'Sem resposta'], ['alerta', 'Negativos e agressivos'], ['respondidos', 'Respondidos'], ['ocultos', 'Ocultos']] as const).map(([f, r]) => (
                <Link key={f} href={linkAba(aba, f)} data-on={filtro === f || undefined}>{r}</Link>
              ))}
            </div>
            <Suspense fallback={<p>Carregando os comentários…</p>}>
              <Comentarios origem={aba === 'organico' ? 'organico' : 'anuncio'} clienteId={escolhido?.id ?? null} filtro={filtro} />
            </Suspense>
          </div>
        </CartaoSocial>
      ) : escolhido ? (
        <>
          <Suspense fallback={<><RedesFaixa /><Carregando titulo={`Instagram de ${escolhido.nome}`} /></>}>
            <DetalheInstagram cliente={escolhido} periodo={periodo} />
          </Suspense>
          <Suspense fallback={<Modulo icone={MapPin} titulo="Google Meu Negócio" descricao="Buscando no Google…"><p>Carregando…</p></Modulo>}>
            <GoogleNegocio clienteId={escolhido.id} perfil={escolhido.googlePerfil} perfilNome={escolhido.googlePerfilNome} periodo={periodo} seletor={seletor} podeGerir={false} />
          </Suspense>
        </>
      ) : (
        <Suspense fallback={<><RedesFaixa /><Carregando titulo="Panorama do Instagram" /></>}>
          <Panorama clientes={clientes} periodo={periodo} />
        </Suspense>
      )}
      </div>
    </div>
  )
}

async function Comentarios({ origem, clienteId, filtro }: { origem: 'organico' | 'anuncio'; clienteId: string | null; filtro: FiltroComentarios }) {
  const lista = await listarComentarios(await criarClienteServidor(), { origem, clienteId, filtro })
  if (!lista) return <p>Falta rodar a migração dos comentários (20261024000055_comentarios_redes.sql) no Supabase.</p>
  return <ListaComentarios comentarios={lista} />
}

function Carregando({ titulo }: { titulo: string }) {
  return <CartaoSocial titulo={titulo} sub="Buscando no Meta…"><p style={{ color: 'var(--ins-suave)' }}>Carregando os insights…</p></CartaoSocial>
}

async function DetalheInstagram({ cliente, periodo }: { cliente: Cliente; periodo: PeriodoAnuncios }) {
  const [ig, cliquesLinkBio, seguidoresPagos] = await Promise.all([instagramDoCliente(cliente.metaPaginaId!, periodo, true), criarClienteServidor().then((sb) => cliquesLinkBioNoPeriodo(sb, cliente.id, periodo.de, periodo.ate)), seguidoresPagosNoPeriodo(cliente.metaContaId, periodo)])
  const dias = diasDoPeriodo(periodo)
  const fimAnterior = somarDias(periodo.de, -1)
  const anterior = 'erro' in ig ? null : await instagramDoCliente(cliente.metaPaginaId!, { de: somarDias(fimAnterior, -(dias.length - 1)), ate: fimAnterior }, false)
  if ('erro' in ig) return <><RedesFaixa /><CartaoSocial titulo={`Instagram de ${cliente.nome}`}><p>{ig.erro}</p></CartaoSocial></>
  return (
    <>
      <RedesFaixa seguidoresInstagram={`${numero.format(ig.seguidores)} seguidores`} />
      <InstagramSocial ig={ig} anterior={anterior && !('erro' in anterior) ? anterior : null} dias={dias} rotuloPeriodo={rotuloPeriodo(periodo)} cliquesLinkBio={cliquesLinkBio} seguidoresPagos={seguidoresPagos} />
      <CartaoSocial titulo="Funil do orgânico" sub={`Do conteúdo visto até o clique no link · ${rotuloPeriodo(periodo)}`}>
        <FunilOrganico ig={ig} cliquesLinkBio={cliquesLinkBio} />
      </CartaoSocial>
      {periodo.atalho === 'hoje' && <p>Dados consultados agora no Instagram; a própria Meta pode levar alguns minutos para consolidar o dia.</p>}
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
    <>
    <RedesFaixa seguidoresInstagram={`${numero.format(soma('seguidores'))} seguidores`} />
    <CartaoSocial titulo="Panorama do Instagram" sub={`Todos os clientes com Instagram ligado · ${rotuloPeriodo(periodo)}`}>
      <div>
        <GradeMetricas
          dias={diasDoPeriodo(periodo).length}
          itens={[
            { id: 'seguidores', rotulo: 'Seguidores somados', valor: numero.format(soma('seguidores')), icone: 'person_add', cor: '#e08a00', extra: soma('novosSeguidores') ? `${soma('novosSeguidores') > 0 ? '+' : ''}${numero.format(soma('novosSeguidores'))} no período` : undefined },
            { id: 'alcance', rotulo: 'Alcance', valor: numero.format(soma('alcance')), icone: 'donut_large', cor: '#1d6fe0', extra: 'inclui anúncios' },
            { id: 'views', rotulo: 'Visualizações', valor: numero.format(soma('visualizacoes')), icone: 'visibility', cor: '#7c3aed' },
            { id: 'interacoes', rotulo: 'Interações', valor: numero.format(soma('interacoes')), icone: 'touch_app', cor: '#16a34a' },
            { id: 'posts', rotulo: 'Posts', valor: String(posts), icone: 'photo_library', cor: '#8b5cf6' },
            { id: 'perfis', rotulo: 'Perfis', valor: `${ok.length} de ${linhas.length}`, icone: 'account_circle', cor: ok.length < linhas.length ? '#e5484d' : '#16a34a', extra: ok.length < linhas.length ? `${linhas.length - ok.length} com erro` : 'todos respondendo' },
          ]}
        />
        {linhas.length === 0 ? (
          <p>Nenhum cliente com a Página do Facebook no cadastro (é por ela que o Instagram profissional é encontrado).</p>
        ) : (
          <div>
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Seguidores</th>
                  <th>Alcance</th>
                  <th>Interações</th>
                  <th>Interações ÷ alcance</th>
                  <th>Posts</th>
                  <th>Novos seguidores</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map(({ c, ig }) => (
                  <tr key={c.id}>
                    <td>
                      <NomeCliente nome={c.nome} href={`/insights?cliente=${c.id}${q ? `&${q}` : ''}`} />
                      {!('erro' in ig) && <p>@{ig.usuario}</p>}
                    </td>
                    {'erro' in ig ? (
                      <td colSpan={6}>{ig.erro}</td>
                    ) : (
                      <>
                        <td>{numero.format(ig.seguidores)}</td>
                        <td>
                          <div>
                            <span style={{ width: `${Math.max(2, (ig.alcance / maiorAlcance) * 96)}px`, background: 'var(--ins-acc)' }} />
                            <span>{numero.format(ig.alcance)}</span>
                          </div>
                        </td>
                        <td>{numero.format(ig.interacoes)}</td>
                        <td title="Interações ÷ alcance da conta (o alcance da conta inclui anúncios; o engajamento dos posts fica no detalhe do cliente)">{pct(engajamento(ig.interacoes, ig.alcance))}</td>
                        <td>{ig.posts.length}</td>
                        <td>{ig.novosSeguidores > 0 ? '▲ +' : ig.novosSeguidores < 0 ? '▼ ' : ''}{numero.format(ig.novosSeguidores)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p>{periodo.atalho === 'hoje' ? 'Dados consultados agora no Instagram; a própria Meta pode levar alguns minutos para consolidar o dia.' : 'Dados do Instagram pela API do Meta, atualizados a cada hora.'} Clique no cliente (ou escolha no seletor) para ver os posts, o melhor formato e as recomendações.</p>
      </div>
    </CartaoSocial>
    </>
  )
}
