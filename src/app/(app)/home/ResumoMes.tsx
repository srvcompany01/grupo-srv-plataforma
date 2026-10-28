import { ArrowDownRight, ArrowUpRight, Banknote, Megaphone, TrendingUp, Users } from 'lucide-react'
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

function Delta({ v, inverso }: { v: number | null; inverso?: boolean }) {
  if (v === null) return <span className="text-legenda text-black/40">sem mês anterior</span>
  const bom = inverso ? v <= 0 : v >= 0
  const Seta = v >= 0 ? ArrowUpRight : ArrowDownRight
  return <span className={`inline-flex items-center gap-0.5 text-legenda font-medium ${bom ? 'text-black' : 'text-[#e5484d]'}`}><Seta className="h-3 w-3" />{Math.abs(v)}% vs. mês anterior</span>
}

/** Resultado do mês de todos os clientes ativos (mesmos números do Panorama de Performance) e o que ficou sem lançar. */
export async function ResumoMes({ clientes, mes, hoje }: { clientes: Cliente[]; mes: string; hoje: string }) {
  const sb = await criarClienteServidor()
  const google = await situacaoGoogle()
  const antes = mesAnterior(mes)
  const linhas = await Promise.all(clientes.map(async (c) => ({ c, h: await historicoDoCliente(sb, c, [antes, mes], hoje, google.conectado) })))
  const atual = soma(linhas.map((l) => l.h.meses[1]))
  const anterior = soma(linhas.map((l) => l.h.meses[0]))
  const ind = indicadores({ ...atual, leadsPagos: atual.leadsPagos })
  const leads = atual.leadsPagos + atual.leadsOrganicos
  const leadsAntes = anterior.leadsPagos + anterior.leadsOrganicos
  const semLancar = linhas.filter((l) => investido(l.h.meses[1]) > 0 && l.h.meses[1].faturamento === null).map((l) => l.c)
  const tiles = [
    { rotulo: 'Investido', valor: reais(atual.investido), delta: <Delta v={variacao(atual.investido, anterior.investido)} inverso />, icone: Megaphone, destaque: true },
    { rotulo: 'Leads', valor: String(leads), delta: <Delta v={variacao(leads, leadsAntes)} />, icone: Users },
    { rotulo: 'Faturamento', valor: atual.faturamento === null ? '—' : reais(atual.faturamento), delta: <Delta v={atual.faturamento === null || anterior.faturamento === null ? null : variacao(atual.faturamento, anterior.faturamento)} />, icone: Banknote },
    { rotulo: 'ROAS', valor: ind.roas === null ? '—' : `${ind.roas.toFixed(1).replace('.', ',')}x`, delta: <span className="text-legenda text-black/40">faturamento ÷ investido</span>, icone: TrendingUp },
  ]
  return (
    <section className="h-full rounded-[20px] border border-borda bg-white p-5 shadow-cartao">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="home-titulo">Resultado de {rotuloMesLongo(mes)}</h2>
        <Link href={`/performance?mes=${mes}`} className="rounded-full border border-black/15 px-3.5 py-1 text-rotulo text-black/70 transition hover:bg-black/5">Performance</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((t) => {
          const Icone = t.icone
          return (
            <div key={t.rotulo} className={`rounded-[14px] p-4 ${t.destaque ? 'bg-[var(--h-acento)] text-white [&_*]:!text-inherit' : 'bg-[var(--h-superficie)] text-black'}`}>
              <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${t.destaque ? 'bg-white text-[var(--h-acento)]' : 'bg-[var(--h-palido)] text-[var(--h-acento)]'}`}><Icone className="h-4 w-4" /></span>
              <p className="text-rotulo opacity-60">{t.rotulo}</p>
              <p className="text-[1.75rem] font-medium leading-tight tabular-nums">{t.valor}</p>
              <div className="mt-1">{t.delta}</div>
            </div>
          )
        })}
      </div>
      {semLancar.length > 0 && (
        <p className="mt-3 rounded-[14px] bg-[var(--h-superficie)] px-4 py-2.5 text-rotulo text-black/70">
          <span className="font-medium text-[#e5484d]">Faturamento sem lançar:</span>{' '}
          {semLancar.map((c, i) => <span key={c.id}>{i > 0 && ', '}<NomeCliente nome={c.nome} href={`/performance?cliente=${c.id}&mes=${mes}`} /></span>)}
        </p>
      )}
    </section>
  )
}

export function ResumoMesCarregando() {
  return <div className="h-full min-h-56 animate-pulse rounded-[20px] bg-[var(--h-superficie)]" aria-label="Carregando o resultado do mês" />
}
