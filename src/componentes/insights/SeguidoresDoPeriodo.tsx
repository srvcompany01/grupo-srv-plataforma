import { UserMinus, UserPlus, Users } from 'lucide-react'
import type { SeguidoresSeparados } from '@/dominio/insights'

const n = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
const pct = (parte: number, todo: number) => (todo ? `${(Math.round((parte / todo) * 1000) / 10).toLocaleString('pt-BR')}%` : '—')

/**
 * Seguidores do período, do jeito que a equipe e o cliente leem: primeiro o total GANHO, e embaixo de onde vieram
 * (anúncios × orgânico) e quantos deixaram de seguir. `pagos` é o que a Meta atribui aos anúncios.
 */
export function SeguidoresDoPeriodo({ s }: { s: SeguidoresSeparados }) {
  const partes = [
    { rotulo: 'Pelos anúncios', valor: s.pagos, cor: '#6250d6', icone: Users, ajuda: 'atribuídos pela Meta a qualquer campanha' },
    { rotulo: 'Orgânicos', valor: s.organicos, cor: '#1baf7a', icone: UserPlus, ajuda: 'ganhos − anúncios' },
    { rotulo: 'Deixaram de seguir', valor: s.perdidos, cor: '#d64545', icone: UserMinus, ajuda: `saldo do período: ${s.saldo >= 0 ? '+' : ''}${n(s.saldo)}` },
  ]
  return (
    <section className="rounded-2xl border border-borda bg-white p-4" aria-label="Seguidores ganhos no período">
      <p className="text-legenda font-medium text-texto-3">Seguidores ganhos no período</p>
      <p className="mt-0.5 text-[34px] font-bold leading-none tabular-nums text-texto">{n(s.ganhos)}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {partes.map((p) => {
          const Icone = p.icone
          return (
            <div key={p.rotulo} className="rounded-xl border border-borda/70 bg-fundo/40 px-3 py-2">
              <p className="flex items-center gap-1.5 text-legenda text-texto-2"><span className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: `${p.cor}1f`, color: p.cor }}><Icone className="h-3 w-3" /></span>{p.rotulo}</p>
              <p className="mt-0.5 text-destaque font-bold tabular-nums text-texto">{p.valor === null ? '—' : n(p.valor)}</p>
              <p className="text-micro text-texto-3">{p.valor === null ? 'sem dado dos anúncios' : p.rotulo === 'Deixaram de seguir' ? p.ajuda : `${pct(p.valor, s.ganhos)} dos ganhos · ${p.ajuda}`}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
