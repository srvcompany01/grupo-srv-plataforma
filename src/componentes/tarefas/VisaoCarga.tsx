import { calcularCarga, DIAS_DA_CARGA } from '@/dominio/carga'
import { somarDias } from '@/dominio/filtros'
import type { TarefaResumo } from '@/dominio/tarefas'

const dia = (iso: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')

/** Carga de trabalho: quantas tarefas abertas cada pessoa tem por dia nos próximos 14 dias (mais atrasadas, depois e sem data). */
export function VisaoCarga({ tarefas, hoje }: { tarefas: TarefaResumo[]; hoje: string }) {
  const linhas = calcularCarga(tarefas, hoje)
  if (!linhas.length) return <p className="py-10 text-center text-corpo text-texto-3">Nenhuma tarefa aberta nesta visualização.</p>
  const dias = Array.from({ length: DIAS_DA_CARGA }, (_, i) => somarDias(hoje, i))
  // Sem estimativa de horas ainda: a faixa de cor segue o número de tarefas no dia (até 3 tranquilo, 4–5 atenção, 6+ sobrecarga).
  const faixa = (n: number) => (n > 5 ? 'bg-[var(--red-soft)] text-[var(--red)]' : n > 3 ? 'bg-[var(--warn-soft)] text-[var(--warn)]' : 'bg-[var(--ok-soft)] text-[var(--ok)]')
  const fimDeSemana = (d: string) => [0, 6].includes(new Date(`${d}T00:00:00Z`).getUTCDay())
  const celula = 'px-2 py-2 text-center text-rotulo tabular-nums'
  return (
    <div className="overflow-x-auto rounded-lg border border-borda bg-white">
      <table className="w-full min-w-[960px] border-collapse">
        <thead>
          <tr className="border-b border-borda bg-[var(--bg-subtle)] text-[11px] font-medium text-texto-3">
            <th className="px-3 py-2 text-left">Pessoa</th>
            <th className={`${celula} text-perigo`}>Atrasadas</th>
            {dias.map((d) => <th key={d} className={`${celula} capitalize ${d === hoje ? 'font-semibold text-[var(--red)]' : ''}`}>{dia(d)}</th>)}
            <th className={celula}>Depois</th>
            <th className={celula}>Sem data</th>
            <th className={celula}>Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.pessoa?.id ?? 'sem'} className="h-11 border-b border-borda-fraca last:border-0">
              <td className="px-3 py-2 text-corpo font-medium text-texto">{l.pessoa?.nome ?? 'Sem responsável'}</td>
              <td className={`${celula} ${l.atrasadas ? 'font-semibold text-perigo' : 'text-texto-3'}`}>{l.atrasadas || '–'}</td>
              {l.dias.map((n, i) => (
                <td key={i} className={`${celula} ${fimDeSemana(dias[i]) && !n ? 'bg-[var(--bg-subtle)]' : ''}`}>{n ? <span className={`inline-block min-w-7 rounded px-1.5 py-0.5 font-semibold ${faixa(n)}`}>{n}</span> : ''}</td>
              ))}
              <td className={`${celula} text-texto-2`}>{l.depois || '–'}</td>
              <td className={`${celula} text-texto-2`}>{l.semData || '–'}</td>
              <td className={`${celula} font-semibold`}>{l.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
