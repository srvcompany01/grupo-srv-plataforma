import { ArrowDownRight, ArrowUpRight, Banknote, CircleAlert, Megaphone, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { NomeCliente } from '@/componentes/NomeCliente'
import { indicadores, mesAnterior, rotuloMesLongo } from '@/dominio/performance'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import type { Cliente } from '@/servicos/clientes-plataforma'
import { situacaoGoogle } from '@/servicos/google-agencia'
import { historicoDoCliente, investido, leadsPagos, type MesPerformance } from '@/servicos/performance'

const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: v >= 1000 ? 0 : 2 })
const soma = (ms: MesPerformance[]) => ({
  investido: ms.reduce((s, m) => s + investido(m), 0),
  leadsPagos: ms.reduce((s, m) => s + leadsPagos(m), 0),
  leadsOrganicos: ms.reduce((s, m) => s + m.leadsOrganicos, 0),
  faturamento: ms.some((m) => m.faturamento !== null) ? ms.reduce((s, m) => s + (m.faturamento ?? 0), 0) : null,
  vendas: ms.some((m) => m.vendas !== null) ? ms.reduce((s, m) => s + (m.vendas ?? 0), 0) : null,
})
const variacao = (atual: number, antes: number) => (antes > 0 ? Math.round(((atual - antes) / antes) * 100) : null)

function Delta({ v }: { v: number | null }) {
  if (v === null) return <span className="hm-delta">Sem base de comparação</span>
  const Seta = v >= 0 ? ArrowUpRight : ArrowDownRight
  return <span className="hm-delta"><Seta />{Math.abs(v)}% vs. mês anterior</span>
}

/** Resultado do mês de todos os clientes ativos (mesmos números do Panorama de Performance) e o que ficou sem lançar. */
export async function ResumoMes({ clientes, mes, hoje }: { clientes: Cliente[]; mes: string; hoje: string }) {
  const antes = mesAnterior(mes)
  const carregar = async () => {
    const sb = await criarClienteServidor()
    const google = await situacaoGoogle()
    return Promise.all(clientes.map(async (c) => ({ c, h: await historicoDoCliente(sb, c, [antes, mes], hoje, google.conectado) })))
  }
  const linhas = await carregar().catch(() => null)
  if (linhas === null) return <section className="hm-cartao hm-resumo"><div className="hm-cab"><div><h2>Resultado do mês</h2><p>O resumo de performance está indisponível no momento.</p></div><Link href={`/performance?mes=${mes}`}>Abrir performance <ArrowUpRight size={14} /></Link></div></section>
  const atual = soma(linhas.map((l) => l.h.meses[1]))
  const anterior = soma(linhas.map((l) => l.h.meses[0]))
  const ind = indicadores({ ...atual, leadsPagos: atual.leadsPagos })
  const leads = atual.leadsPagos + atual.leadsOrganicos
  const leadsAntes = anterior.leadsPagos + anterior.leadsOrganicos
  const semLancar = linhas.filter((l) => investido(l.h.meses[1]) > 0 && l.h.meses[1].faturamento === null).map((l) => l.c)
  const tiles = [
    { rotulo: 'Investimento em mídia', valor: reais(atual.investido), delta: <Delta v={variacao(atual.investido, anterior.investido)} />, icone: Megaphone },
    { rotulo: 'Leads gerados', valor: leads.toLocaleString('pt-BR'), delta: <Delta v={variacao(leads, leadsAntes)} />, icone: Users },
    { rotulo: 'Faturamento informado', valor: atual.faturamento === null ? '—' : reais(atual.faturamento), delta: <Delta v={atual.faturamento === null || anterior.faturamento === null ? null : variacao(atual.faturamento, anterior.faturamento)} />, icone: Banknote },
    { rotulo: 'ROAS', valor: ind.roas === null ? '—' : `${ind.roas.toFixed(1).replace('.', ',')}x`, delta: <span className="hm-delta">Faturamento ÷ investimento</span>, icone: TrendingUp },
  ]
  return (
    <section className="hm-cartao hm-resumo">
      <div className="hm-cab">
        <div><h2>Resultado de {rotuloMesLongo(mes)}</h2><p>Clientes ativos · mês em andamento, comparado ao mês anterior completo.</p></div>
        <Link href={`/performance?mes=${mes}`}>Ver performance <ArrowUpRight size={14} /></Link>
      </div>
      <div className="hm-resumo-tiles">
        {tiles.map((t) => {
          const Icone = t.icone
          return (
            <div className="hm-resumo-tile" key={t.rotulo}>
              <p><Icone />{t.rotulo}</p>
              <strong>{t.valor}</strong>
              <div>{t.delta}</div>
            </div>
          )
        })}
      </div>
      {semLancar.length > 0 && (
        <p className="hm-resumo-nota">
          <CircleAlert size={14} /><span>Faturamento ainda não informado: {' '}
          {semLancar.map((c, i) => <span key={c.id}>{i > 0 && ', '}<NomeCliente nome={c.nome} href={`/performance?cliente=${c.id}&mes=${mes}`} /></span>)}. Os totais consideram os valores já lançados.</span>
        </p>
      )}
    </section>
  )
}

export function ResumoMesCarregando() {
  return <section className="hm-cartao hm-resumo" role="status" aria-label="Carregando o resultado do mês"><div className="hm-cab"><div><h2>Resultado do mês</h2><p>Carregando os indicadores dos clientes ativos…</p></div></div><div className="hm-resumo-tiles" aria-hidden="true">{Array.from({ length: 4 }, (_, i) => <div className="hm-resumo-tile" key={i}><span className="hm-esqueleto" /><span className="hm-esqueleto hm-esqueleto-valor" /></div>)}</div></section>
}
