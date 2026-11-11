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
    <section aria-label="Seguidores ganhos no período">
      <p>Seguidores ganhos no período</p>
      <p>{n(s.ganhos)}</p>
      <div>
        {partes.map((p) => {
          const Icone = p.icone
          return (
            <div key={p.rotulo}>
              <p><span style={{ background: `${p.cor}1f`, color: p.cor }}><Icone /></span>{p.rotulo}</p>
              <p>{p.valor === null ? '—' : n(p.valor)}</p>
              <p>{p.valor === null ? 'sem dado dos anúncios' : p.rotulo === 'Deixaram de seguir' ? p.ajuda : `${pct(p.valor, s.ganhos)} dos ganhos · ${p.ajuda}`}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
