/**
 * Desenho de funil para métricas que passam de etapa em etapa (alcance → clique → mensagem…): cada faixa afunila até a
 * próxima, com o número da etapa, a conversão da etapa anterior e, no fim, a conversão principal (primeira → última).
 * Só HTML/CSS: funciona em componente de servidor.
 */

import type { ResumoInstagram } from '@/dominio/insights'

export type EtapaFunil = { rotulo: string; valor: number; extra?: string }

const CORES = ['#5b8def', '#4aa3df', '#2bb5a4', '#56c271', '#8cc63f', '#e9b949', '#f5a35c']
const numero = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
export const taxa = (de: number, para: number) => {
  if (de <= 0) return '—'
  const p = (para / de) * 100
  return `${p.toLocaleString('pt-BR', p > 0 && p < 1 ? { maximumSignificantDigits: 2 } : { maximumFractionDigits: 1 })}%`
}

// Escala logarítmica: de 20 000 impressões a 40 leads a última faixa continua legível.
const largura = (v: number, topo: number) => (topo <= 1 ? 100 : 26 + 74 * (Math.log1p(Math.max(0, v)) / Math.log1p(topo)))

export function FunilConversao({ etapas, principal }: { etapas: EtapaFunil[]; /** Nome da conversão principal (padrão: a última etapa). */ principal?: string }) {
  const validas = etapas.filter((e) => Number.isFinite(e.valor))
  if (validas.length < 2) return null
  const topo = Math.max(...validas.map((e) => e.valor))
  const ws = validas.map((e) => largura(e.valor, topo))
  const primeira = validas[0]
  const ultima = validas[validas.length - 1]
  return (
    <div>
      <ol>
        {validas.map((e, i) => {
          const w0 = ws[i]
          const w1 = i < ws.length - 1 ? ws[i + 1] : w0 * 0.82
          const cor = CORES[Math.round((i / Math.max(1, validas.length - 1)) * (CORES.length - 1))]
          const anterior = validas[i - 1]
          return (
            <li key={e.rotulo}>
              <div>
                <b>{e.rotulo}</b>
                {e.extra && <small>{e.extra}</small>}
              </div>
              <div style={{ ['--c' as string]: cor, clipPath: `polygon(${(100 - w0) / 2}% 0, ${(100 + w0) / 2}% 0, ${(100 + w1) / 2}% 100%, ${(100 - w1) / 2}% 100%)` }}>
                <span>{numero(e.valor)}</span>
              </div>
              <div>
                {anterior ? (
                  <>
                    <b>{taxa(anterior.valor, e.valor)}</b>
                    <small>da etapa anterior</small>
                  </>
                ) : (
                  <small>início do funil</small>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <p>
        <span>Conversão principal</span>
        <b>{taxa(primeira.valor, ultima.valor)}</b>
        <small>de {primeira.rotulo.toLowerCase()} até {(principal ?? ultima.rotulo).toLowerCase()} · {primeira.valor > 0 && ultima.valor > 0 ? `1 a cada ${numero(Math.round(primeira.valor / ultima.valor))}` : 'sem conversões no período'}</small>
      </p>
    </div>
  )
}

/** Funil do orgânico do Instagram: visualizações → alcance → engajadas → toques no link do perfil (→ cliques medidos pelo Biolytics). */
export function FunilOrganico({ ig, cliquesLinkBio }: { ig: ResumoInstagram; cliquesLinkBio: number | null }) {
  return (
    <FunilConversao principal={cliquesLinkBio !== null ? 'clique no link da bio' : 'toque no link do perfil'} etapas={[
      { rotulo: 'Visualizações', valor: ig.visualizacoes, extra: 'vezes que o conteúdo apareceu' },
      { rotulo: 'Alcance', valor: ig.alcance, extra: 'contas que viram' },
      { rotulo: 'Contas engajadas', valor: ig.contasEngajadas, extra: 'curtiram, comentaram, salvaram ou compartilharam' },
      { rotulo: 'Toques no link do perfil', valor: ig.cliquesPerfil, extra: 'links do perfil (Instagram)' },
      ...(cliquesLinkBio !== null ? [{ rotulo: 'Cliques no link da bio', valor: cliquesLinkBio, extra: 'medidos pelo Biolytics' }] : []),
    ]} />
  )
}
