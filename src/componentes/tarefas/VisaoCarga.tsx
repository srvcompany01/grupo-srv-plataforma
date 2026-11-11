import { calcularCarga, DIAS_DA_CARGA } from '@/dominio/carga'
import { somarDias } from '@/dominio/filtros'
import type { TarefaResumo } from '@/dominio/tarefas'

const dia = (iso: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')

/** Carga de trabalho: quantas tarefas abertas cada pessoa tem por dia nos próximos 14 dias (mais atrasadas, depois e sem data). */
export function VisaoCarga({ tarefas, hoje }: { tarefas: TarefaResumo[]; hoje: string }) {
  const linhas = calcularCarga(tarefas, hoje)
  if (!linhas.length) return <p>Nenhuma tarefa aberta nesta visualização.</p>
  const dias = Array.from({ length: DIAS_DA_CARGA }, (_, i) => somarDias(hoje, i))
  // Sem estimativa de horas ainda: a faixa de cor segue o número de tarefas no dia (até 3 tranquilo, 4–5 atenção, 6+ sobrecarga).
  const faixa = (n: number) => (n > 5 ? 'bg-[var(--red-soft)] text-[var(--red)]' : n > 3 ? 'bg-[var(--warn-soft)] text-[var(--warn)]' : 'bg-[var(--ok-soft)] text-[var(--ok)]')
  const fimDeSemana = (d: string) => [0, 6].includes(new Date(`${d}T00:00:00Z`).getUTCDay())
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Pessoa</th>
            <th>Atrasadas</th>
            {dias.map((d) => <th key={d}>{dia(d)}</th>)}
            <th>Depois</th>
            <th>Sem data</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.pessoa?.id ?? 'sem'}>
              <td>{l.pessoa?.nome ?? 'Sem responsável'}</td>
              <td>{l.atrasadas || '–'}</td>
              {l.dias.map((n, i) => (
                <td key={i}>{n ? <span>{n}</span> : ''}</td>
              ))}
              <td>{l.depois || '–'}</td>
              <td>{l.semData || '–'}</td>
              <td>{l.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
