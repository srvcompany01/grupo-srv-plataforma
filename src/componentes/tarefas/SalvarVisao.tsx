'use client'

import { Ic } from '@/componentes/app/Ic'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { restaurarVisaoAcao, salvarParamsDaVisaoAcao, salvarVisaoAcao } from '@/app/(app)/listas/acoes-visao'
import { avisar } from './avisar'

/**
 * Aparece quando a pessoa mexe na visualização (tipo, agrupamento ou filtros). "Salvar" faz a lista abrir assim sempre;
 * sem salvar, a próxima vez volta como estava (a salva, ou o original).
 */
export function SalvarVisao({ listaId, caminho, params, alterada, temSalva, vistaId }: { listaId: string; caminho: string; params: string; alterada: boolean; temSalva: boolean; /** Com abas: grava na própria aba em vez da visualização única da lista. */ vistaId?: string }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()

  const salvar = () =>
    iniciar(async () => {
      if (avisar(await (vistaId ? salvarParamsDaVisaoAcao(vistaId, params) : salvarVisaoAcao(listaId, params)), true)) router.refresh()
    })
  const restaurar = () =>
    iniciar(async () => {
      if (!avisar(await (vistaId ? salvarParamsDaVisaoAcao(vistaId, '') : restaurarVisaoAcao(listaId)), true)) return
      router.replace(caminho, { scroll: false })
      router.refresh()
    })

  if (alterada) {
    return (
      <div role="group" aria-label="Visualização alterada">
        <button type="button" onClick={salvar} disabled={pendente} title="Salvar visualização">
          <Ic n="save" s={16} /> Salvar visualização
        </button>
        {/* URL limpa: volta para a salva (ou o original). */}
        <button type="button" onClick={() => router.replace(caminho, { scroll: false })} disabled={pendente} title="Descartar as mudanças desta tela">
          <Ic n="undo" s={16} /> Descartar
        </button>
      </div>
    )
  }
  if (temSalva) {
    return (
      <div>
        <span title="Visualização salva" style={{ color: 'var(--ok)' }}><Ic n="save" s={16} fill /></span>
        <button type="button" onClick={restaurar} disabled={pendente} title="Apaga a visualização salva e volta ao original">
          Voltar ao original
        </button>
      </div>
    )
  }
  return (
    <button type="button" title="Salvar visualização" aria-label="Salvar visualização" onClick={() => toast('Mude o agrupamento, os filtros ou as colunas para poder salvar a visualização.')}>
      <Ic n="save" s={16} />
    </button>
  )
}
