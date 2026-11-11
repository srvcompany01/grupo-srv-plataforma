import { Lightbulb, Target } from 'lucide-react'
import type { Analise, Tom } from '@/dominio/insights'
import { ORDEM_TOM } from '../tom'
import { CartaoSocial } from './Cartao'

const IMPACTO: Record<Tom, string> = { ruim: 'Crítico', atencao: 'Atenção', bom: 'Positivo', neutro: 'Info' }

/** "Sinais": o que os números mostram (insights) e o que fazer (recomendações), numa tabela com o impacto em selo. */
export function SinaisTabela({ analise }: { analise: Analise }) {
  const linhas = [
    ...analise.destaques.map((i) => ({ ...i, tipo: 'Insight' as const })),
    ...analise.recomendacoes.map((i) => ({ ...i, tipo: 'Recomendação' as const })),
  ].sort((a, b) => ORDEM_TOM[a.tom] - ORDEM_TOM[b.tom])
  return (
    <CartaoSocial titulo={<>Sinais <span>· {linhas.length} ativos</span></>} sub="O que os números mostram e o que fazer no orgânico">
      <div>
        <table>
          <thead><tr><th>Sinal</th><th>Tipo</th><th>Impacto</th></tr></thead>
          <tbody>
            {linhas.map((l) => {
              const Icone = l.tipo === 'Insight' ? Lightbulb : Target
              return (
                <tr key={`${l.tipo}-${l.texto}`}>
                  <td style={{ width: '100%' }}>{l.texto}</td>
                  <td><span style={{ color: 'var(--ins-suave)' }}><Icone strokeWidth={1.7} />{l.tipo}</span></td>
                  <td><span data-tom={l.tom === 'bom' ? undefined : l.tom}>{IMPACTO[l.tom]}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </CartaoSocial>
  )
}
