import { lerPeriodoPainel } from '@/dominio/painel-projetos'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { painelDoEscopo } from '@/servicos/painel-projetos'
import { PainelProjetos } from './PainelProjetos'

type Sp = Record<string, string | string[] | undefined>
const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** Aba Painel (do espaço de projetos ou de um projeto). `caminho` + `sp` montam os links mantendo a visão atual. */
export async function PainelDoEscopo({ escopo, caminho, sp, euId }: { escopo: { espacoId: string } | { listaId: string; cor: string }; caminho: string; sp: Sp; euId: string }) {
  const sb = await criarClienteServidor()
  const periodo = lerPeriodoPainel(texto(sp.periodo))
  const quem = texto(sp.quem) === 'equipe' ? 'equipe' : 'eu'
  const painel = await painelDoEscopo(sb, escopo, { dias: periodo, usuarioId: quem === 'eu' ? euId : null, agora: new Date() })
  const href = (p: { periodo?: number; quem?: 'eu' | 'equipe' }) => {
    const q = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : [])))
    const per = p.periodo ?? periodo
    const qm = p.quem ?? quem
    if (per === 30) q.delete('periodo')
    else q.set('periodo', String(per))
    if (qm === 'eu') q.delete('quem')
    else q.set('quem', qm)
    return `${caminho}?${q}`
  }
  return (
    <PainelProjetos
      painel={painel}
      rotulo={'espacoId' in escopo ? 'Projeto' : 'Tarefa'}
      periodo={periodo}
      quem={quem}
      href={href}
      vazio={'espacoId' in escopo ? 'Nenhum projeto ainda. Crie uma lista para cada cliente ou projeto neste espaço.' : 'Nenhuma tarefa neste projeto ainda.'}
    />
  )
}
