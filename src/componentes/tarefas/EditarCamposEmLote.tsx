'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { salvarValorCampoEmLote } from '@/app/(app)/acoes-campos'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import type { Pessoa } from '@/dominio/tarefas'
import type { Json } from '@/infra/supabase/tipos'
import { botaoPrimario, botaoSecundario, campo } from '@/lib/ui'
import { avisar } from './avisar'
import { EditorValorCampo } from './CamposPersonalizados'

/** Campos que a pessoa preenche (fórmula, progresso automático e botão não têm valor para gravar). */
export const editavelEmLote = (c: DefinicaoCampo) => !['formula', 'progress_auto', 'button'].includes(c.tipo)

/** Mini editor: escolhe um campo, define o valor e aplica a todas as tarefas selecionadas. */
export function EditarCamposEmLote({ ids, campos, equipe }: { ids: string[]; campos: DefinicaoCampo[]; equipe: Pessoa[] }) {
  const router = useRouter()
  const editaveis = campos.filter(editavelEmLote)
  const [aberto, setAberto] = useState(false)
  const [campoId, setCampoId] = useState('')
  const [valor, setValor] = useState<Json | null>(null)
  const [definido, setDefinido] = useState(false)
  const [pendente, iniciar] = useTransition()
  const escolhido = editaveis.find((c) => c.id === campoId)

  const trocar = (id: string) => {
    setCampoId(id)
    setValor(null)
    setDefinido(false)
  }
  const aplicar = () =>
    iniciar(async () => {
      if (!avisar(await salvarValorCampoEmLote(ids, campoId, valor), true)) return
      setAberto(false)
      trocar('')
      router.refresh()
    })

  if (editaveis.length === 0) return null
  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className={`${botaoSecundario} h-8 gap-1.5 rounded-lg px-3 text-rotulo`}>
        <SlidersHorizontal className="h-3.5 w-3.5" /> Editar campos
      </button>
      <Dialog open={aberto} onOpenChange={(o) => { setAberto(o); if (!o) trocar('') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar {ids.length} tarefas de uma vez</DialogTitle>
            <DialogDescription>O valor escolhido é gravado em todas as tarefas selecionadas, inclusive subtarefas. “Vazio” limpa o campo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <select value={campoId} onChange={(e) => trocar(e.target.value)} aria-label="Campo" className={campo}>
              <option value="">Escolha o campo…</option>
              {editaveis.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {escolhido && (
              <div className="space-y-1.5">
                <EditorValorCampo key={escolhido.id} definicao={{ ...escolhido, valor: null }} equipe={equipe} aoMudar={(v) => { setValor(v); setDefinido(true) }} />
                {!definido && <p className="text-legenda text-texto-3">Defina o valor acima para poder aplicar.</p>}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAberto(false)} className={botaoSecundario}>Cancelar</button>
              <button type="button" disabled={pendente || !escolhido || !definido} onClick={aplicar} className={botaoPrimario}>{pendente ? 'Aplicando…' : `Aplicar em ${ids.length} tarefas`}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
