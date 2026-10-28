'use client'

import { Bookmark, BookmarkCheck, Undo2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { restaurarVisaoAcao, salvarVisaoAcao } from '@/app/(app)/listas/acoes-visao'
import { botaoFantasma, botaoPrimario } from '@/lib/ui'
import { avisar } from './avisar'

/**
 * Aparece quando a pessoa mexe na visualização (tipo, agrupamento ou filtros). "Salvar" faz a lista abrir assim sempre;
 * sem salvar, a próxima vez volta como estava (a salva, ou o original).
 */
export function SalvarVisao({ listaId, caminho, params, alterada, temSalva }: { listaId: string; caminho: string; params: string; alterada: boolean; temSalva: boolean }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()

  const salvar = () =>
    iniciar(async () => {
      if (avisar(await salvarVisaoAcao(listaId, params), true)) router.refresh()
    })
  const restaurar = () =>
    iniciar(async () => {
      if (!avisar(await restaurarVisaoAcao(listaId), true)) return
      router.replace(caminho, { scroll: false })
      router.refresh()
    })

  if (alterada) {
    return (
      <div className="flex items-center gap-1.5" role="group" aria-label="Visualização alterada">
        <button type="button" onClick={salvar} disabled={pendente} className={`${botaoPrimario} h-7 gap-1.5 rounded-md px-2.5 text-rotulo`}>
          <Bookmark className="h-3.5 w-3.5" /> Salvar visualização
        </button>
        {/* URL limpa: volta para a salva (ou o original). */}
        <button type="button" onClick={() => router.replace(caminho, { scroll: false })} disabled={pendente} className={`${botaoFantasma} h-7 gap-1.5 rounded-md px-2 text-rotulo`} title="Descartar as mudanças desta tela">
          <Undo2 className="h-3.5 w-3.5" /> Descartar
        </button>
      </div>
    )
  }
  if (temSalva) {
    return (
      <div className="flex items-center gap-1.5 text-rotulo text-texto-2">
        <span className="inline-flex items-center gap-1.5"><BookmarkCheck className="h-3.5 w-3.5 text-sucesso" /> Visualização salva</span>
        <button type="button" onClick={restaurar} disabled={pendente} className={`${botaoFantasma} h-7 rounded-md px-2 text-rotulo`} title="Apaga a visualização salva e volta ao original">
          Voltar ao original
        </button>
      </div>
    )
  }
  return null
}
