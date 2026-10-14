'use client'

import { useEffect, useState } from 'react'
import { dadosGestaoCamposAcao } from '@/app/(app)/config/campos/acoes'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import type { DadosGestaoCampos } from '@/servicos/campos-gestao'
import { EditorCampo } from './EditorCampo'

/** Editor completo do campo (nome, cor, ícone, opções e listas), aberto pelo cabeçalho da lista. */
export function ConfigurarCampo({ campoId, aoFechar }: { campoId: string; aoFechar: () => void }) {
  const [dados, setDados] = useState<DadosGestaoCampos | null>(null)
  const [falhou, setFalhou] = useState(false)
  useEffect(() => {
    dadosGestaoCamposAcao().then(setDados, () => setFalhou(true))
  }, [])
  const campo = dados?.campos.find((c) => c.id === campoId)
  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Configurar campo</DialogTitle><DialogDescription>Nome, cor, ícone e listas onde o campo aparece.</DialogDescription></DialogHeader>
        {dados && campo ? (
          <EditorCampo alvo={{ tipo: 'editar', campo }} espacos={dados.espacos} listas={dados.listas} campos={dados.campos} aoFechar={aoFechar} />
        ) : (
          <p className="py-8 text-center text-sm text-texto-3">{falhou || dados ? 'Não foi possível carregar o campo.' : 'Carregando…'}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
