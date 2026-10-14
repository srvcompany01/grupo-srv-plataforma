'use client'

import { useState, useTransition } from 'react'
import { salvarValorCampoEmLote } from '@/app/(app)/acoes-campos'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import type { DefinicaoCampo } from '@/dominio/personalizacao'
import type { Pessoa } from '@/dominio/tarefas'
import type { Json } from '@/infra/supabase/tipos'
import { botaoFantasma, botaoPrimario } from '@/lib/ui'
import { avisar } from './avisar'
import { EditorValorCampo } from './CamposPersonalizados'

/** Muda de uma vez o valor de UM campo nas tarefas da faixa selecionada (uma coluna só). */
export function AlterarColunaEmLote({ ids, campo, equipe, aoFechar }: { ids: string[]; campo: DefinicaoCampo; equipe: Pessoa[]; aoFechar: () => void }) {
  const [valor, setValor] = useState<Json | null>(null)
  const [pendente, iniciar] = useTransition()
  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar “{campo.nome}”</DialogTitle>
          <DialogDescription>O valor abaixo vai para {ids.length} {ids.length === 1 ? 'tarefa' : 'tarefas'}. Deixe vazio para limpar o campo.</DialogDescription>
        </DialogHeader>
        <EditorValorCampo definicao={{ ...campo, valor: null }} equipe={equipe} aoMudar={setValor} />
        <div className="flex justify-end gap-2">
          <button type="button" className={botaoFantasma} onClick={aoFechar}>Cancelar</button>
          <button
            type="button"
            className={botaoPrimario}
            disabled={pendente}
            onClick={() => iniciar(async () => { if (avisar(await salvarValorCampoEmLote(ids, campo.id, valor), true)) aoFechar() })}
          >
            Aplicar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
