import { TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { taxa } from '@/componentes/FunilConversao'
import { dataDeHoje } from '@/dominio/filtros'
import { ORDEM_TOM } from '@/componentes/insights/tom'
import { analisarPago } from '@/dominio/insights'
import { consultaPeriodo, lerPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, type Cliente } from '@/servicos/clientes-plataforma'
import { situacaoGoogle } from '@/servicos/google-agencia'
import { dadosDoCliente } from '@/servicos/relatorio-cliente'

export const maxDuration = 60

const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const inteiro = (n: number) => Math.round(n).toLocaleString('pt-BR')
const PERIODOS = [['hoje', 'Hoje'], ['ontem', 'Ontem'], ['semana', 'Esta semana'], ['7', '7 dias'], ['30', '30 dias']] as const

/** Anúncios no design novo: só o essencial do cliente no período (totais, funil, campanhas e a recomendação principal). */
export default async function AnunciosNovo({ searchParams }: PageProps<'/novo/anuncios'>) {
  await exigirEquipe()
  const sp = await searchParams
  const hoje = dataDeHoje(new Date())
  const periodo = lerPeriodo(sp, hoje)
  const [clientes, google] = await Promise.all([listarClientes(await criarClienteServidor()), situacaoGoogle()])
  const comAnuncios = clientes.filter((c) => !c.interno && c.status !== 'encerrado' && (c.metaContaId || c.googleAdsId))
  const escolhido = comAnuncios.find((c) => c.id === sp.cliente) ?? null
  const q = consultaPeriodo(periodo)
  const link = (clienteId: string | null, dias?: string) => {
    const partes = [clienteId ? `cliente=${clienteId}` : '', dias === undefined ? q : dias === '7' ? '' : `dias=${dias}`].filter(Boolean)
    return `/novo/anuncios${partes.length ? `?${partes.join('&')}` : ''}`
  }
  const atalho = periodo.atalho === null ? null : String(periodo.atalho)

  return (
    <>
      <header className="nv-topo">
        <div>
          <h1 className="nv-titulo">Anúncios</h1>
          <p className="nv-sub">{rotuloPeriodo(periodo)}</p>
        </div>
        <span className="nv-esp" />
        <nav className="nv-pilulas" aria-label="Período">
          {PERIODOS.map(([id, nome]) => <Link key={id} href={link(escolhido?.id ?? null, id)} className="nv-pilula" aria-current={atalho === id ? 'true' : undefined}>{nome}</Link>)}
        </nav>
      </header>

      {/* ponytail: clientes em pílulas; passando de ~12 clientes, trocar por um seletor com busca. */}
      <nav className="nv-pilulas clientes" aria-label="Cliente" style={{ alignSelf: 'flex-start' }}>
        {comAnuncios.map((c) => <Link key={c.id} href={link(c.id)} className="nv-pilula" aria-current={escolhido?.id === c.id ? 'true' : undefined}>{c.nome}</Link>)}
      </nav>

      {escolhido ? (
        <Suspense key={`${escolhido.id}-${q}`} fallback={<div className="nv-grade"><div className="nv-osso" /><div className="nv-osso" /><div className="nv-osso" /><div className="nv-osso" /></div>}>
          <DoCliente cliente={escolhido} periodo={periodo} googleConectado={google.conectado} />
        </Suspense>
      ) : (
        <section className="nv-cartao"><p className="nv-vazio">{comAnuncios.length ? 'Escolha um cliente acima para ver os anúncios.' : 'Nenhum cliente com conta de anúncios cadastrada.'}</p></section>
      )}
    </>
  )
}

async function DoCliente({ cliente, periodo, googleConectado }: { cliente: Cliente; periodo: PeriodoAnuncios; googleConectado: boolean }) {
  const d = await dadosDoCliente(cliente, periodo, googleConectado, { organico: false })
  const anuncios = d.anuncios ?? []
  const investido = (d.pago.meta?.gasto ?? 0) + (d.pago.google?.custo ?? 0)
  const leadsMeta = anuncios.reduce((s, a) => s + a.resultados, 0)
  const leads = leadsMeta + Math.round(d.pago.google?.conversoes ?? 0)
  const gastoCaptacao = anuncios.filter((a) => a.papel === 'lead').reduce((s, a) => s + a.gasto, 0) + (d.pago.google?.custo ?? 0)
  const impressoes = anuncios.reduce((s, a) => s + a.impressoes, 0)
  const etapas = [
    { nome: 'Impressões', valor: impressoes, largura: 100, fundo: '#18181b', cor: '#ffffff' },
    { nome: 'Alcance', valor: anuncios.reduce((s, a) => s + a.alcance, 0), largura: 84, fundo: '#52525b', cor: '#ffffff' },
    { nome: 'Cliques no link', valor: anuncios.reduce((s, a) => s + a.cliquesLink, 0), largura: 58, fundo: '#d4d4d8', cor: '#18181b' },
    { nome: 'Leads', valor: leadsMeta, largura: 38, fundo: '#d80d12', cor: '#ffffff' },
  ]

  const mapa = new Map<string, { nome: string; canal: 'Meta' | 'Google'; gasto: number; leads: number }>()
  for (const a of anuncios) {
    const c = mapa.get(`m:${a.campanha}`) ?? { nome: a.campanha, canal: 'Meta' as const, gasto: 0, leads: 0 }
    mapa.set(`m:${a.campanha}`, { ...c, gasto: c.gasto + a.gasto, leads: c.leads + a.resultados })
  }
  for (const c of d.campanhas?.campanhas ?? []) mapa.set(`g:${c.id}`, { nome: c.nome, canal: 'Google', gasto: c.custo, leads: Math.round(c.conversoes) })
  const campanhas = [...mapa.entries()].map(([id, c]) => ({ id, ...c })).filter((c) => c.gasto > 0).sort((a, b) => b.gasto - a.gasto)
  const dica = [...analisarPago(d.pago).recomendacoes].sort((a, b) => ORDEM_TOM[a.tom] - ORDEM_TOM[b.tom])[0]

  return (
    <>
      {d.erros.length > 0 && <p className="nv-aviso" role="status">{d.erros.join(' · ')}</p>}

      <section className="nv-grade" aria-label="Totais">
        <div className="nv-cartao nv-kpi escuro"><span className="nv-rotulo">Leads e mensagens</span><span className="nv-numero">{inteiro(leads)}</span><span className="nv-rotulo">Meta e Google no período</span></div>
        <div className="nv-cartao nv-kpi"><span className="nv-rotulo">Investido</span><span className="nv-numero">{reais(investido)}</span><span className="nv-rotulo">{reais(gastoCaptacao)} em captação</span></div>
        <div className="nv-cartao nv-kpi"><span className="nv-rotulo">Custo por lead</span><span className="nv-numero">{leads ? reais(gastoCaptacao / leads) : '—'}</span><span className="nv-rotulo">investimento de captação ÷ leads</span></div>
        <div className="nv-cartao nv-kpi"><span className="nv-rotulo">Conversão principal</span><span className="nv-numero">{taxa(impressoes, leadsMeta)}</span><span className="nv-rotulo">{impressoes > 0 && leadsMeta > 0 ? `1 lead a cada ${inteiro(impressoes / leadsMeta)} impressões` : 'de impressões até lead (Meta)'}</span></div>
      </section>

      <div className="nv-grade larga">
        <section className="nv-cartao">
          <h2>Funil dos anúncios</h2>
          {anuncios.length ? (
            <>
              {etapas.map((e, i) => (
                <div key={e.nome} className="nv-funil">
                  <b>{e.nome}</b>
                  <span><i style={{ width: `${e.largura}%`, background: e.fundo, color: e.cor }}>{inteiro(e.valor)}</i></span>
                  <em>{i ? taxa(etapas[i - 1].valor, e.valor) : ''}</em>
                </div>
              ))}
              <p className="nv-rotulo">À direita, quanto passou da etapa anterior. Só anúncios da Meta.</p>
            </>
          ) : <p className="nv-vazio">Nenhum anúncio da Meta com resultado no período.</p>}
        </section>

        <section className="nv-cartao" style={{ gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <h2>Campanhas</h2>
            <span className="nv-chip">{campanhas.length} com gasto</span>
          </div>
          {campanhas.length ? campanhas.slice(0, 8).map((c) => (
            <div key={c.id} className="nv-linha">
              <div><strong title={c.nome}>{c.nome}</strong><span className="nv-rotulo">{c.canal} · {reais(c.gasto)} · {c.leads} lead{c.leads === 1 ? '' : 's'}</span></div>
              <b>{c.leads ? reais(c.gasto / c.leads) : '—'}</b>
            </div>
          )) : <p className="nv-vazio">Nenhuma campanha com gasto no período.</p>}
          {campanhas.length > 8 && <p className="nv-rotulo" style={{ paddingTop: 12 }}>Mais {campanhas.length - 8} campanhas na tela completa.</p>}
        </section>
      </div>

      <section className="nv-cartao nv-dica">
        <i aria-hidden="true"><TriangleAlert size={20} /></i>
        <div>
          <h2>O que fazer agora</h2>
          <p>{dica ? dica.texto : 'Sem recomendações: a conta está dentro do esperado no período.'}</p>
        </div>
        <Link href={`/anuncios?cliente=${cliente.id}#controle`} className="nv-botao">Ligar, pausar e orçamento</Link>
      </section>
    </>
  )
}
