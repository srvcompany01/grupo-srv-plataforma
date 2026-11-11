import { BadgeDollarSign, Camera, Heart, LayoutDashboard, Link2, MapPin, Megaphone, MessageCircle, MousePointerClick, Radar, Search, Star, Target, Users, Wallet } from 'lucide-react'
import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { GaleriaAnuncios } from '@/componentes/anuncios/GaleriaAnuncios'
import { GoogleAds } from '@/componentes/anuncios/GoogleAds'
import { GoogleNegocio } from '@/componentes/anuncios/GoogleNegocio'
import { SeletorPeriodo } from '@/componentes/anuncios/SeletorPeriodo'
import { MapaGrade } from '@/componentes/gmn/MapaGrade'
import { CartaoLugar, ItensSaude, Placar, tomNota } from '@/componentes/gmn/PerfilGmn'
import { BlocoAnalise, Numeros } from '@/componentes/insights/BlocoAnalise'
import { EmBreve } from '@/componentes/insights/EmBreve'
import { GraficoDiario } from '@/componentes/insights/GraficoDiario'
import { InstagramInsights } from '@/componentes/insights/InstagramInsights'
import { SeloTom } from '@/componentes/insights/tom'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { analisarSaude } from '@/dominio/gmn'
import { avisosGoogle, totaisCampanhas } from '@/dominio/google'
import { dataDeHoje } from '@/dominio/filtros'
import { analisarOrganico, analisarPago, engajamentoOrganico, tomCtrMeta } from '@/dominio/insights'
import { consultaPeriodo, diasDoPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import type { Cliente } from '@/servicos/clientes-plataforma'
import { campanhasGoogle, pagoPorDiaGoogle, situacaoGoogle } from '@/servicos/google-agencia'
import { instagramDoCliente } from '@/servicos/insights-instagram'
import { metaPorDiaPorTipo, resumoMetaPorTipo, seguidoresPagosNoPeriodo } from '@/servicos/meta-anuncios'
import * as places from '@/servicos/places'
import { cliquesLinkBioNoPeriodo } from '@/servicos/performance'
import { FunilConversao, FunilOrganico } from '@/componentes/FunilConversao'
import { calcularRelatorio } from '@/servicos/relatorio-compartilhado'
import { dadosDoCliente } from '@/servicos/relatorio-cliente'

export type Aba = 'resumo' | 'projecao' | 'meta' | 'google' | 'organico' | 'gmn' | 'evolucao' | 'lancamentos'

const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const reaisCurto = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const n = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const compacto = (v: number) => v.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (v: number) => `${n(v)}%`

export const Aviso = ({ children }: { children: ReactNode }) => <p>{children}</p>
const Erro = ({ texto: t }: { texto: string }) => <p>{t}</p>

/** Tabela comparando os clientes no canal. */
function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: { c: Cliente; href: string; celulas: ReactNode[] }[] }) {
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            {cabecalho.map((h) => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.c.id}>
              <td><NomeCliente nome={l.c.nome} href={l.href} /></td>
              {l.celulas.map((x, i) => <td key={i}>{x}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const hrefCliente = (aba: Aba, c: Cliente, periodo: PeriodoAnuncios) => `/performance?aba=${aba}&cliente=${c.id}${consultaPeriodo(periodo) ? `&${consultaPeriodo(periodo)}` : ''}`

// ───────────────────────────── Meta Ads ─────────────────────────────

export async function MetaTodos({ clientes, periodo }: { clientes: Cliente[]; periodo: PeriodoAnuncios }) {
  const comConta = clientes.filter((c) => c.metaContaId)
  const linhas = (await Promise.all(comConta.map(async (c) => ({ c, t: await resumoMetaPorTipo(c.metaContaId!, periodo) })))).sort((a, b) => ('erro' in b.t ? -1 : b.t.total.gasto) - ('erro' in a.t ? -1 : a.t.total.gasto))
  const ok = linhas.flatMap((l) => ('erro' in l.t ? [] : [l.t]))
  const gasto = ok.reduce((s, t) => s + t.total.gasto, 0)
  const captacao = ok.reduce((s, t) => ({ gasto: s.gasto + t.captacao.gasto, leads: s.leads + t.captacao.leads }), { gasto: 0, leads: 0 })
  const reconhecimento = ok.reduce((s, t) => ({ gasto: s.gasto + t.reconhecimento.gasto, cliques: s.cliques + t.reconhecimento.cliquesLink }), { gasto: 0, cliques: 0 })
  return (
    <Modulo icone={Megaphone} titulo="Meta Ads · todos os clientes" descricao={rotuloPeriodo(periodo)}>
      <div>
        <Numeros itens={[
          { rotulo: 'Investido', valor: reais(gasto), icone: Wallet, cor: '#0866ff' },
          { rotulo: 'Captação', valor: reais(captacao.gasto), extra: `${n(captacao.leads)} leads`, icone: Users, cor: '#1baf7a' },
          { rotulo: 'CPL de captação', valor: captacao.leads ? reais(captacao.gasto / captacao.leads) : '—', icone: Target, cor: '#eb6834' },
          { rotulo: 'Reconhecimento', valor: reais(reconhecimento.gasto), extra: `${compacto(reconhecimento.cliques)} cliques no link`, icone: MousePointerClick, cor: '#6250d6' },
          { rotulo: 'Clientes com Meta', valor: String(comConta.length), icone: Megaphone, cor: '#6250d6' },
        ]} />
        {linhas.length === 0 ? <Aviso>Nenhum cliente com conta de anúncios da Meta no cadastro.</Aviso> : (
          <Tabela cabecalho={['Captação', 'Leads', 'CPL', 'Reconhecimento', 'Cliques', 'CPC']} linhas={linhas.map(({ c, t }) => ({
            c, href: hrefCliente('meta', c, periodo),
            celulas: 'erro' in t ? [<span key="e" title={t.erro}>erro</span>, '', '', '', '', ''] : [
              reais(t.captacao.gasto), n(t.captacao.leads), t.captacao.custoPorLead === null ? '—' : reais(t.captacao.custoPorLead), reais(t.reconhecimento.gasto), compacto(t.reconhecimento.cliquesLink), t.reconhecimento.custoPorClique === null ? '—' : reais(t.reconhecimento.custoPorClique),
            ],
          }))} />
        )}
      </div>
    </Modulo>
  )
}

export async function MetaCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  if (!c.metaContaId) return <Aviso>A <strong>{c.nome}</strong> não tem conta de anúncios da Meta no cadastro.</Aviso>
  const [d, t, porDia] = await Promise.all([dadosDoCliente(c, periodo, false, { organico: false }), resumoMetaPorTipo(c.metaContaId, periodo), metaPorDiaPorTipo(c.metaContaId, periodo)])
  const dias = diasDoPeriodo(periodo)
  const m = d.pago.meta
  const tot = 'erro' in t ? null : t
  const diaMap = 'erro' in porDia ? new Map() : porDia
  const seletor = <SeletorPeriodo base={`/performance?aba=meta&cliente=${c.id}`} periodo={periodo} hoje={dataDeHoje(new Date())} />
  return (
    <>
      <Modulo icone={Megaphone} titulo="Meta Ads" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · Facebook e Instagram · {rotuloPeriodo(periodo)}</>}>
        <div>
          {'erro' in t && <Erro texto={t.erro} />}
          <Numeros itens={[
            { rotulo: 'Investido', valor: reais(tot?.total.gasto ?? m?.gasto ?? 0), icone: Wallet, cor: '#0866ff' },
            { rotulo: 'Captação', valor: reais(tot?.captacao.gasto ?? 0), extra: tot ? [tot.captacao.conversas ? `${n(tot.captacao.conversas)} conversas` : '', tot.captacao.formularios ? `${n(tot.captacao.formularios)} formulários` : '', tot.captacao.site ? `${n(tot.captacao.site)} do site` : ''].filter(Boolean).join(' · ') || `${n(tot.captacao.leads)} leads` : undefined, icone: Users, cor: '#1baf7a' },
            { rotulo: 'CPL de captação', valor: tot?.captacao.custoPorLead === null || !tot ? '—' : reais(tot.captacao.custoPorLead), icone: Target, cor: '#eb6834' },
            { rotulo: 'Reconhecimento', valor: reais(tot?.reconhecimento.gasto ?? 0), extra: tot ? `${compacto(tot.reconhecimento.visitasPerfil || tot.reconhecimento.cliquesLink)} ${tot.reconhecimento.visitasPerfil ? 'visitas ao perfil' : 'cliques no link'}` : undefined, icone: MousePointerClick, cor: '#6250d6' },
            tot?.reconhecimento.visitasPerfil
              ? { rotulo: 'Custo por visita ao perfil', valor: tot.reconhecimento.custoPorVisitaPerfil === null ? '—' : reais(tot.reconhecimento.custoPorVisitaPerfil), extra: `${compacto(tot.reconhecimento.visitasPerfil)} visitas`, icone: MousePointerClick, cor: '#e87ba4' }
              : { rotulo: 'CPC de reconhecimento', valor: tot?.reconhecimento.custoPorClique === null || !tot ? '—' : reais(tot.reconhecimento.custoPorClique), icone: MousePointerClick, cor: '#e87ba4' },
            ...(tot?.total.seguidoresAnuncio ? [{ rotulo: 'Seguidores pelos anúncios', valor: n(tot.total.seguidoresAnuncio), extra: [tot.reconhecimento.custoPorSeguidor === null ? '' : `${reais(tot.reconhecimento.custoPorSeguidor)} por seguidor (campanhas de perfil)`, tot.reconhecimento.seguidoresAnuncio ? `${n(tot.reconhecimento.seguidoresAnuncio)} em campanhas de perfil` : '', tot.captacao.seguidoresAnuncio ? `${n(tot.captacao.seguidoresAnuncio)} em campanhas de captação` : '', tot.reconhecimento.taxaSeguidor === null ? '' : `${pct(tot.reconhecimento.taxaSeguidor)} das visitas ao perfil`].filter(Boolean).join(' · ') || undefined, icone: Users, cor: '#6250d6' }] : []),
            { rotulo: 'CTR', valor: m ? pct(m.ctr) : '—', tom: m ? tomCtrMeta(m.ctr) : undefined, icone: Target, cor: '#eda100' },
          ]} />
          {tot && (
            <div>
              <div>
                <h3>Funil de captação</h3>
                <FunilConversao principal="lead" etapas={[
                  { rotulo: 'Impressões', valor: tot.captacao.impressoes, extra: 'campanhas de captação' },
                  { rotulo: 'Cliques', valor: tot.captacao.cliques, extra: 'todos os cliques' },
                  { rotulo: 'Leads', valor: tot.captacao.leads, extra: 'conversas, formulários e site' },
                ]} />
              </div>
              <div>
                <h3>Funil de reconhecimento</h3>
                <FunilConversao principal="seguidor" etapas={[
                  { rotulo: 'Impressões', valor: tot.reconhecimento.impressoes, extra: 'campanhas de perfil e tráfego' },
                  { rotulo: 'Cliques no link', valor: tot.reconhecimento.cliquesLink },
                  ...(tot.reconhecimento.visitasPerfil ? [{ rotulo: 'Visitas ao perfil', valor: tot.reconhecimento.visitasPerfil }] : []),
                  { rotulo: 'Seguidores', valor: tot.reconhecimento.seguidoresAnuncio, extra: 'atribuídos aos anúncios' },
                ]} />
              </div>
            </div>
          )}
          <GraficoDiario titulo="Investimento diário por tipo de campanha" dias={dias} series={[{ nome: 'Captação', valores: dias.map((x) => diaMap.get(x)?.captacao.gasto ?? 0) }, { nome: 'Reconhecimento', valores: dias.map((x) => diaMap.get(x)?.reconhecimento.gasto ?? 0) }]} formato={reaisCurto} />
          <BlocoAnalise analise={analisarPago({ meta: m, google: null })} />
        </div>
      </Modulo>
      <GaleriaAnuncios contaId={c.metaContaId} periodo={periodo} mostrarGasto seletor={seletor} />
    </>
  )
}

// ───────────────────────────── Google Ads ─────────────────────────────

export async function GoogleTodos({ clientes, periodo }: { clientes: Cliente[]; periodo: PeriodoAnuncios }) {
  const g = await situacaoGoogle()
  if (!g.conectado) return <Aviso>A conta Google da agência não está conectada (aba Anúncios).</Aviso>
  const comConta = clientes.filter((c) => c.googleAdsId)
  const linhas = await Promise.all(comConta.map(async (c) => ({ c, r: await campanhasGoogle(c.googleAdsId!, periodo) })))
  const ok = linhas.flatMap((l) => ('erro' in l.r ? [] : [totaisCampanhas(l.r.campanhas)]))
  const custo = ok.reduce((s, t) => s + t.custo, 0)
  const conv = ok.reduce((s, t) => s + t.conversoes, 0)
  return (
    <Modulo icone={Search} titulo="Google Ads · todos os clientes" descricao={rotuloPeriodo(periodo)}>
      <div>
        <Numeros itens={[
          { rotulo: 'Investido', valor: reais(custo), icone: Wallet, cor: '#eb6834' },
          { rotulo: 'Conversões', valor: n(conv), icone: Target, cor: '#1baf7a' },
          { rotulo: 'Custo por conversão', valor: conv ? reais(custo / conv) : '—', icone: BadgeDollarSign, cor: '#6250d6' },
          { rotulo: 'Clientes com Google Ads', valor: String(comConta.length), icone: Search, cor: '#2a78d6' },
        ]} />
        {linhas.length === 0 ? <Aviso>Nenhum cliente com conta do Google Ads no cadastro.</Aviso> : (
          <Tabela cabecalho={['Investido', 'Cliques', 'CTR', 'Conversões', 'Custo por conversão']} linhas={linhas.map(({ c, r }) => {
            if ('erro' in r) return { c, href: hrefCliente('google', c, periodo), celulas: [<span key="e" title={r.erro}>erro</span>, '', '', '', ''] }
            const t = totaisCampanhas(r.campanhas)
            return { c, href: hrefCliente('google', c, periodo), celulas: [reais(t.custo), compacto(t.cliques), t.impressoes ? pct((t.cliques / t.impressoes) * 100) : '—', <span key="v">{n(t.conversoes)}</span>, t.conversoes ? reais(t.custo / t.conversoes) : '—'] }
          })} />
        )}
      </div>
    </Modulo>
  )
}

export async function GoogleCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  if (!c.googleAdsId) return <Aviso>A <strong>{c.nome}</strong> não tem conta do Google Ads no cadastro.</Aviso>
  const g = await situacaoGoogle()
  if (!g.conectado) return <Aviso>A conta Google da agência não está conectada (aba Anúncios).</Aviso>
  const [d, porDia, r] = await Promise.all([dadosDoCliente(c, periodo, true, { organico: false }), pagoPorDiaGoogle(c.googleAdsId, periodo), campanhasGoogle(c.googleAdsId, periodo)])
  const dias = diasDoPeriodo(periodo)
  const diaMap = new Map(('erro' in porDia ? [] : porDia).map((x) => [x.dia, x.gasto]))
  const avisos = 'erro' in r ? [] : avisosGoogle(totaisCampanhas(r.campanhas))
  const seletor = <SeletorPeriodo base={`/performance?aba=google&cliente=${c.id}`} periodo={periodo} hoje={dataDeHoje(new Date())} />
  return (
    <>
      <Modulo icone={Search} titulo="Análise do Google Ads" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)}</>}>
        <div>
          {avisos.map((a) => <p key={a}>{a}</p>)}
          <GraficoDiario titulo="Investimento por dia" dias={dias} series={[{ nome: 'Investido', valores: dias.map((x) => diaMap.get(x) ?? 0) }]} formato={reaisCurto} tipo="barras" />
          {!('erro' in r) && (() => {
            const t = totaisCampanhas(r.campanhas)
            return <FunilConversao principal="conversão" etapas={[{ rotulo: 'Impressões', valor: t.impressoes, extra: 'anúncios exibidos' }, { rotulo: 'Cliques', valor: t.cliques, extra: 'entraram no site' }, { rotulo: 'Conversões', valor: t.conversoes, extra: 'ligações, formulários, WhatsApp' }]} />
          })()}
          <BlocoAnalise analise={analisarPago({ meta: null, google: d.pago.google })} />
        </div>
      </Modulo>
      <GoogleAds contaId={c.googleAdsId} periodo={periodo} seletor={seletor} />
    </>
  )
}

// ───────────────────────────── Orgânico ─────────────────────────────

const OUTRAS_REDES = ['TikTok', 'YouTube', 'Facebook (Página)', 'LinkedIn']

export async function OrganicoTodos({ clientes, periodo }: { clientes: Cliente[]; periodo: PeriodoAnuncios }) {
  const comPagina = clientes.filter((c) => c.metaPaginaId)
  const sb = await criarClienteServidor()
  const linhas = (await Promise.all(comPagina.map(async (c) => ({ c, ig: await instagramDoCliente(c.metaPaginaId!, periodo, false), bio: await cliquesLinkBioNoPeriodo(sb, c.id, periodo.de, periodo.ate) })))).sort((a, b) => ('erro' in b.ig ? -1 : b.ig.posts.length) - ('erro' in a.ig ? -1 : a.ig.posts.length))
  return (
    <>
      <Modulo icone={Camera} titulo="Instagram · todos os clientes" descricao={`${rotuloPeriodo(periodo)} · somente publicações orgânicas`}>
        {linhas.length === 0 ? <Aviso>Nenhum cliente com a Página do Facebook (Instagram) no cadastro.</Aviso> : (
          <Tabela cabecalho={['Seguidores', 'Novos', 'Posts orgânicos', 'Cliques no link da bio']} linhas={linhas.map(({ c, ig, bio }) => ({
            c, href: hrefCliente('organico', c, periodo),
            celulas: 'erro' in ig ? [<span key="e" title={ig.erro}>erro</span>, '', '', ''] : [
              compacto(ig.seguidores), <span key="n">{ig.novosSeguidores > 0 ? '+' : ''}{n(ig.novosSeguidores)}</span>, String(ig.posts.length), bio === null ? '—' : n(bio),
            ],
          }))} />
        )}
      </Modulo>
      <EmBreve itens={OUTRAS_REDES} />
    </>
  )
}

export async function OrganicoCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  if (!c.metaPaginaId) return <><Aviso>A <strong>{c.nome}</strong> não tem a Página do Facebook (Instagram) no cadastro.</Aviso><EmBreve itens={OUTRAS_REDES} /></>
  const [ig, cliquesLinkBio, seguidoresPagos] = await Promise.all([instagramDoCliente(c.metaPaginaId, periodo, true), criarClienteServidor().then((sb) => cliquesLinkBioNoPeriodo(sb, c.id, periodo.de, periodo.ate)), seguidoresPagosNoPeriodo(c.metaContaId, periodo)])
  const dias = diasDoPeriodo(periodo)
  return (
    <>
      <Modulo icone={Camera} titulo={'erro' in ig ? 'Instagram' : `Instagram @${ig.usuario}`} descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)}</>}>
        {'erro' in ig ? <Erro texto={ig.erro} /> : (
          <div>
            <InstagramInsights ig={ig} dias={dias} cliquesLinkBio={cliquesLinkBio} seguidoresPagos={seguidoresPagos} />
            <FunilOrganico ig={ig} cliquesLinkBio={cliquesLinkBio} />
            <p>Engajamento orgânico nos posts: {engajamentoOrganico(ig) === null ? '—' : pct(engajamentoOrganico(ig)!)}. Os totais da conta que incluem anúncios não entram nesta aba.</p>
          </div>
        )}
      </Modulo>
      {!('erro' in ig) && (
        <Modulo icone={Heart} titulo="Insights e recomendações do orgânico" descricao="O que os números mostram e o que fazer">
          <BlocoAnalise analise={analisarOrganico(ig, dias.length)} />
        </Modulo>
      )}
      <EmBreve itens={OUTRAS_REDES} />
    </>
  )
}

// ───────────────────────────── Google Meu Negócio ─────────────────────────────

export async function GmnTodos({ clientes }: { clientes: Cliente[] }) {
  if (!places.placesConfigurado()) return <Aviso>Falta a chave da Places API (GOOGLE_PLACES_API_KEY).</Aviso>
  const sb = await criarClienteServidor()
  const hoje = dataDeHoje(new Date())
  const ligados = clientes.filter((c) => c.googlePlaceId)
  const linhas = await Promise.all(ligados.map(async (c) => {
    try {
      const [d, ultima] = await Promise.all([places.detalhesDoLugar(sb, c.googlePlaceId!), places.varreduras(sb, c.id, 1).then((v) => v[0])])
      return { c, d, saude: analisarSaude(d.perfil, hoje).nota, ultima }
    } catch (e) {
      return { c, erro: e instanceof Error ? e.message : 'erro' }
    }
  }))
  return (
    <Modulo icone={MapPin} titulo="Google Meu Negócio · todos os clientes" descricao="Nota, avaliações, saúde do perfil e a última varredura do geogrid">
      {linhas.length === 0 ? <Aviso>Nenhum cliente com o perfil do Google ligado. Ligue na aba GMN.</Aviso> : (
        <Tabela cabecalho={['Nota', 'Avaliações', 'Saúde', 'Top 3 no Maps']} linhas={linhas.map((l) => ({
          c: l.c, href: `/performance?aba=gmn&cliente=${l.c.id}`,
          celulas: 'erro' in l ? [<span key="e" title={l.erro}>erro</span>, '', '', ''] : [
            l.d.nota === null ? '—' : `★ ${n(l.d.nota)}`, n(l.d.avaliacoes), <SeloTom key="s" tom={tomNota(l.saude)} rotulo={`${l.saude}/100`} />, l.ultima ? `${n(l.ultima.metricas.top3)}% ("${l.ultima.palavra}")` : '—',
          ],
        }))} />
      )}
    </Modulo>
  )
}

export async function GmnCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  const seletor = <SeletorPeriodo base={`/performance?aba=gmn&cliente=${c.id}`} periodo={periodo} hoje={dataDeHoje(new Date())} />
  const metricas = (
    <Suspense fallback={null}>
      <GoogleNegocio clienteId={c.id} perfil={c.googlePerfil} perfilNome={c.googlePerfilNome} periodo={periodo} seletor={seletor} podeGerir={false} />
    </Suspense>
  )
  if (!c.googlePlaceId) return <><Aviso>Ligue o perfil do Google da <strong>{c.nome}</strong> na aba <Link href={`/gmn?cliente=${c.id}`}>GMN</Link> para ver a saúde e o geogrid.</Aviso>{metricas}</>
  const sb = await criarClienteServidor()
  let s
  try {
    s = await places.saudeDoCliente(sb, c.googlePlaceId, dataDeHoje(new Date()), c.id)
  } catch (e) {
    return <Erro texto={e instanceof Error ? e.message : 'Não foi possível falar com o Google.'} />
  }
  const ultima = (await places.varreduras(sb, c.id, 1))[0]
  return (
    <>
      <div>
        <Modulo icone={Star} titulo="Saúde do perfil no Google" descricao={<><NomeCliente nome={c.nome} href={`/gmn?cliente=${c.id}`} /> · dados públicos do Google</>}>
          <div>
            <Placar nota={s.nota} itens={s.itens} />
            <ItensSaude itens={s.itens} />
          </div>
        </Modulo>
        <CartaoLugar d={s.detalhes} />
      </div>
      <Modulo icone={Radar} titulo="Posição no Google Maps" descricao={ultima ? `Última varredura: "${ultima.palavra}" · top 3 em ${n(ultima.metricas.top3)}% dos pontos · posição média ${n(ultima.metricas.posicaoMediaTotal)}º` : 'Sem varredura ainda'}>
        {ultima ? <div><MapaGrade centro={ultima.centro} pontos={ultima.pontos} rotulo={`Mapa de posições para ${ultima.palavra}`} /></div> : <p>Rode um geogrid na aba <Link href={`/gmn?cliente=${c.id}&aba=geogrid`}>GMN</Link>.</p>}
      </Modulo>
      <Modulo icone={MessageCircle} titulo="Avaliações em destaque" descricao="As que o Google mostra primeiro">
        {s.detalhes.avaliacoesRecentes.length === 0 ? <p>Sem avaliações visíveis.</p> : (
          <ul>
            {s.detalhes.avaliacoesRecentes.map((a, i) => (
              <li key={i}>
                <p><strong>{a.autor || 'Cliente'}</strong><span>{'★'.repeat(a.nota ?? 0)}</span><span>{a.quando}</span></p>
                {a.texto && <p>{a.texto}</p>}
              </li>
            ))}
          </ul>
        )}
      </Modulo>
      {metricas}
    </>
  )
}

// ───────────────────────────── Panorama ─────────────────────────────

/** Sem cliente escolhido: a lista para abrir o panorama de um deles (cada canal já tem a comparação entre clientes). */
export function PanoramaEscolha({ clientes, periodo }: { clientes: Cliente[]; periodo: PeriodoAnuncios }) {
  return (
    <Modulo icone={LayoutDashboard} titulo="Panorama por cliente" descricao="Escolha um cliente para ver todos os canais juntos: Meta Ads, Google Ads, orgânico, Google Meu Negócio e link da bio">
      {clientes.length === 0 ? <Aviso>Nenhum cliente ativo.</Aviso> : (
        <ul>
          {clientes.map((c) => (
            <li key={c.id}>
              <Link href={hrefCliente('resumo', c, periodo)}>
                <NomeCliente nome={c.nome} />
                <span>{c.metaContaId && 'Meta'}{c.googleAdsId && ' · Google'}{c.metaPaginaId && ' · IG'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Modulo>
  )
}

type LinhaCanal = [rotulo: string, valor: ReactNode]

function CartaoCanal({ titulo, icone: Icone, cor, href, linhas, vazio }: { titulo: string; icone: typeof Camera; cor: string; href: string; linhas: LinhaCanal[]; vazio?: string }) {
  return (
    <section>
      <div>
        <h3><span style={{ background: `${cor}1f`, color: cor }}><Icone /></span>{titulo}</h3>
        <Link href={href}>Ver detalhes</Link>
      </div>
      {vazio ? <p>{vazio}</p> : (
        <dl>
          {linhas.map(([r, v]) => <div key={r}><dt>{r}</dt><dd>{v}</dd></div>)}
        </dl>
      )}
    </section>
  )
}

/** Panorama de um cliente: os mesmos números do relatório que vai para ele, todos os canais numa tela. */
export async function PanoramaCliente({ c, periodo }: { c: Cliente; periodo: PeriodoAnuncios }) {
  const { dados: d, avisos } = await calcularRelatorio(await criarClienteServidor(), c, periodo, { mostrarInvestimento: true })
  const meta = d.anuncios?.meta ?? null
  const google = d.anuncios?.google ?? null
  const ig = d.instagram
  const investido = (meta?.investido ?? 0) + (google?.investido ?? 0)
  const h = (aba: Aba) => hrefCliente(aba, c, periodo)
  const semMeta = !c.metaContaId ? 'Sem conta de anúncios do Meta no cadastro.' : !meta ? 'Sem dados da Meta neste período.' : undefined
  const semGoogle = !c.googleAdsId ? 'Sem conta do Google Ads no cadastro.' : !google ? 'Sem dados do Google Ads neste período (ou o Google não está conectado).' : undefined
  const semIg = !c.metaPaginaId ? 'Sem a Página do Facebook (Instagram) no cadastro.' : !ig ? 'O Instagram não respondeu neste período.' : undefined
  const semGmn = !c.googlePlaceId ? 'Perfil do Google ainda não ligado (aba GMN).' : !d.gmn ? 'Sem dados do Google neste período.' : undefined
  const geo = d.gmn?.geogrid
  return (
    <div>
      <Modulo icone={LayoutDashboard} titulo="Panorama" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)} · todos os canais</>}>
        <Numeros itens={[
          { rotulo: 'Investido (Meta + Google)', valor: reais(investido), extra: [meta?.investido ? `Meta ${reais(meta.investido)}` : '', google?.investido ? `Google ${reais(google.investido)}` : ''].filter(Boolean).join(' · ') || undefined, icone: BadgeDollarSign, cor: '#2a78d6' },
          { rotulo: 'Leads Meta (captação)', valor: meta ? n(meta.captacao?.leads ?? meta.leads) : '—', extra: meta?.captacao?.custoPorLead != null ? `CPL ${reais(meta.captacao.custoPorLead)}` : undefined, icone: Users, cor: '#1baf7a' },
          { rotulo: 'Conversões Google', valor: google ? n(google.leads) : '—', extra: google?.custoPorLead != null ? `${reais(google.custoPorLead)} por conversão` : undefined, icone: Target, cor: '#eb6834' },
          { rotulo: 'Seguidores ganhos', valor: ig?.seguidoresGanhos !== undefined ? n(ig.seguidoresGanhos) : '—', extra: ig?.seguidoresGanhos === undefined ? undefined : [ig.seguidoresPagos != null ? `${n(ig.seguidoresPagos)} anúncios` : '', ig.seguidoresOrganicos != null ? `${n(ig.seguidoresOrganicos)} orgânicos` : '', `${n(ig.seguidoresPerdidos ?? 0)} saíram`].filter(Boolean).join(' · '), icone: Camera, cor: '#6250d6' },
          { rotulo: 'Leads orgânicos', valor: d.bio?.leadsOrganicos != null ? n(d.bio.leadsOrganicos) : '—', extra: d.bio ? `${n(d.bio.cliques ?? d.bio.visitas ?? 0)} cliques no link da bio · ${n(d.bio.visualizacoes ?? 0)} visualizações` : 'sem cliques ou sem página da bio', icone: Users, cor: '#eb6834' },
          { rotulo: 'Nota no Google', valor: d.gmn?.nota != null ? `★ ${n(d.gmn.nota)}` : '—', extra: d.gmn ? `${n(d.gmn.avaliacoes)} avaliações` : undefined, icone: Star, cor: '#eda100' },
        ]} />
      </Modulo>

      <div>
        <CartaoCanal titulo="Meta Ads" icone={Megaphone} cor="#0866ff" href={h('meta')} vazio={semMeta} linhas={meta ? [
          ['Investido', meta.investido === null ? '—' : reais(meta.investido)],
          ['Leads (captação)', `${n(meta.captacao?.leads ?? meta.leads)}${meta.captacao?.custoPorLead != null ? ` · CPL ${reais(meta.captacao.custoPorLead)}` : ''}`],
          ...(meta.reconhecimento ? [
            ['Reconhecimento / tráfego', meta.reconhecimento.investido === null ? '—' : reais(meta.reconhecimento.investido)] as LinhaCanal,
            ['Visitas ao perfil', `${n(meta.reconhecimento.visitasPerfil)}${meta.reconhecimento.custoPorVisitaPerfil != null ? ` · ${reais(meta.reconhecimento.custoPorVisitaPerfil)} cada` : ''}`] as LinhaCanal,
          ] : []),
          ['Seguidores pelos anúncios', `${n(meta.seguidoresAnuncio ?? 0)}${meta.reconhecimento?.custoPorSeguidor != null ? ` · ${reais(meta.reconhecimento.custoPorSeguidor)} cada (perfil)` : ''}`],
        ] : []} />
        <CartaoCanal titulo="Google Ads" icone={Search} cor="#eb6834" href={h('google')} vazio={semGoogle} linhas={google ? [
          ['Investido', google.investido === null ? '—' : reais(google.investido)],
          ['Conversões', n(google.leads)],
          ['Custo por conversão', google.custoPorLead === null ? '—' : reais(google.custoPorLead)],
          ['Cliques · impressões', `${n(google.cliques)} · ${compacto(google.impressoes)}`],
        ] : []} />
        <CartaoCanal titulo="Orgânico (Instagram)" icone={Camera} cor="#d55181" href={h('organico')} vazio={semIg} linhas={ig ? [
          ['Seguidores', n(ig.seguidores)],
          ...(ig.seguidoresGanhos !== undefined ? [
            ['Seguidores ganhos', n(ig.seguidoresGanhos)] as LinhaCanal,
            ['↳ Pelos anúncios', ig.seguidoresPagos != null ? n(ig.seguidoresPagos) : '—'] as LinhaCanal,
            ['↳ Orgânicos', ig.seguidoresOrganicos != null ? n(ig.seguidoresOrganicos) : '—'] as LinhaCanal,
            ['Deixaram de seguir', n(ig.seguidoresPerdidos ?? 0)] as LinhaCanal,
          ] : []),
          ['Saldo do período', `${ig.novosSeguidores >= 0 ? '+' : ''}${n(ig.novosSeguidores)}`],
          ['Alcance dos posts', n(ig.alcancePosts ?? ig.alcance)],
          ['Posts · interações', `${n(ig.posts)} · ${n(ig.interacoes)}${ig.engajamentoPosts !== null ? ` (${pct(ig.engajamentoPosts)})` : ''}`],
          ['Cliques no link da bio', ig.cliquesLinkBio == null ? 'não medido' : n(ig.cliquesLinkBio)],
        ] : []} />
        <CartaoCanal titulo="Google Meu Negócio" icone={MapPin} cor="#1baf7a" href={h('gmn')} vazio={semGmn} linhas={d.gmn ? [
          ['Nota · avaliações', `${d.gmn.nota != null ? `★ ${n(d.gmn.nota)}` : '—'} · ${n(d.gmn.avaliacoes)}`],
          ['Saúde do perfil', `${d.gmn.saude}/100`],
          ...(geo ? [['Geogrid', `top 3 em ${pct(geo.metricas.top3)}${geo.primeiro !== undefined ? ` · 1º em ${pct(geo.primeiro)}` : ''}`] as LinhaCanal] : []),
          ...(d.meuNegocio ? [
            ['Visualizações do perfil', n(d.meuNegocio.visualizacoes)] as LinhaCanal,
            ['Ligações · rotas · site', `${n(d.meuNegocio.ligacoes)} · ${n(d.meuNegocio.rotas)} · ${n(d.meuNegocio.site)}`] as LinhaCanal,
            ...(d.meuNegocio.avaliacoes ? [['Avaliações novas', n(d.meuNegocio.avaliacoes.novas)] as LinhaCanal] : []),
          ] : []),
        ] : []} />
        <CartaoCanal titulo="Biolytics · link da bio" icone={Link2} cor="#6250d6" href={`/biolytics?aba=bio&cliente=${c.id}${consultaPeriodo(periodo) ? `&${consultaPeriodo(periodo)}` : ''}`} vazio={d.bio ? undefined : 'Sem cliques na página da bio neste período (ou a página ainda não foi criada).'} linhas={d.bio ? [
          ['Cliques no link da bio', n(d.bio.cliques ?? d.bio.visitas ?? 0)],
          ['Visualizações da página', d.bio.visualizacoes != null ? n(d.bio.visualizacoes) : '—'],
          ['Leads orgânicos', d.bio.leadsOrganicos != null ? n(d.bio.leadsOrganicos) : '—'],
          ['Toques nos botões', `${n(d.bio.toques)}${d.bio.visualizacoes ? ` · ${n(d.bio.toques / d.bio.visualizacoes)} por visualização` : ''}`],
          ...(d.bio.botoes[0] ? [['Botão mais tocado', `${d.bio.botoes[0].rotulo} (${n(d.bio.botoes[0].toques)})`] as LinhaCanal] : []),
        ] : []} />
        <CartaoCanal titulo="Campanhas do período" icone={Target} cor="#2a78d6" href={h('meta')} vazio={d.campanhas?.length ? undefined : 'Nenhuma campanha gastou neste período.'} linhas={(d.campanhas ?? []).slice(0, 6).map((x): LinhaCanal => [`${x.plataforma === 'meta' ? 'Meta' : 'Google'} · ${x.nome}`.slice(0, 48), `${x.gasto === null ? '' : `${reais(x.gasto)} · `}${n(x.resultado)} ${x.rotuloResultado}${x.custoPorResultado != null ? ` · ${reais(x.custoPorResultado)}` : ''}`])} />
      </div>

      {(d.destaques.length > 0 || avisos.length > 0) && (
        <div>
          {d.destaques.length > 0 && (
            <Modulo icone={Star} titulo="Destaques do período" descricao="O que foi bem">
              <ul>{d.destaques.map((t) => <li key={t}>{t}</li>)}</ul>
            </Modulo>
          )}
          {avisos.length > 0 && (
            <Modulo icone={Target} titulo="Pontos de atenção" descricao="Só para a equipe">
              <ul>{avisos.map((t) => <li key={t}>{t}</li>)}</ul>
            </Modulo>
          )}
        </div>
      )}
    </div>
  )
}
