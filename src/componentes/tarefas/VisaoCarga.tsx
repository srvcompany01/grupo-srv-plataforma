import { calcularCarga, DIAS_DA_CARGA } from '@/dominio/carga'
import { somarDias } from '@/dominio/filtros'
import type { TarefaResumo } from '@/dominio/tarefas'

const dia = (iso: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')

/** Carga de trabalho: quantas tarefas abertas cada pessoa tem por dia nos próximos 14 dias (mais atrasadas, depois e sem data). */
export function VisaoCarga({ tarefas, hoje }: { tarefas: TarefaResumo[]; hoje: string }) {
  const linhas = calcularCarga(tarefas, hoje)
  if (!linhas.length) return <p className="py-10 text-center text-corpo text-texto-3">Nenhuma tarefa aberta nesta visualização.</p>
  const dias = Array.from({ length: DIAS_DA_CARGA }, (_, i) => somarDias(hoje, i))
  const maior = Math.max(1, ...linhas.flatMap((l) => l.dias))
  const celula = 'px-2 py-2 text-center text-rotulo tabular-nums'
  return (
    <div className="overflow-x-auto rounded-lg border border-borda bg-white">
      <table className="w-full min-w-[960px] border-collapse">
        <thead>
          <tr className="border-b border-borda bg-fundo/70 text-legenda font-medium text-texto-3">
            <th className="px-3 py-2 text-left">Pessoa</th>
            <th className={`${celula} text-perigo`}>Atrasadas</th>
            {dias.map((d) => <th key={d} className={`${celula} capitalize ${d === hoje ? 'text-texto' : ''}`}>{dia(d)}</th>)}
            <th className={celula}>Depois</th>
            <th className={celula}>Sem data</th>
            <th className={celula}>Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.pessoa?.id ?? 'sem'} className="border-b border-borda last:border-0">
              <td className="px-3 py-2 text-rotulo font-medium text-texto">{l.pessoa?.nome ?? 'Sem responsável'}</td>
              <td className={`${celula} ${l.atrasadas ? 'font-semibold text-perigo' : 'text-texto-3'}`}>{l.atrasadas || '–'}</td>
              {l.dias.map((n, i) => (
                <td key={i} className={celula} style={n ? { background: `color-mix(in srgb, var(--tema-acento) ${15 + (n / maior) * 55}%, transparent)` } : undefined}>{n || ''}</td>
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
