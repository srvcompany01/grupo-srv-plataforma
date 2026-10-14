'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, CopyPlus, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type CSSProperties, type ReactNode, type SyntheticEvent } from 'react'
import { duplicarListaNavegacao, excluirItemNavegacao, renomearItemNavegacao } from '@/app/(app)/acoes-navegacao'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/componentes/ui/context-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { botaoPrimario, botaoSecundario, campo } from '@/lib/ui'

export type TipoArrastavel = 'space' | 'folder' | 'list'

const ROTULO = { space: 'espaço', folder: 'pasta', list: 'lista' } as const
const CAMINHO = { space: '/espacos/', folder: null, list: '/listas/' } as const

/** Eventos que nascem em campos de texto ou em diálogos (portais) não podem ativar o arrastar da linha. */
function nascidoEmCampo(evento: SyntheticEvent): boolean {
  const alvo = evento.target as HTMLElement | null
  if (!alvo || !(evento.currentTarget as HTMLElement).contains(alvo)) return true // veio de um portal (diálogo/menu)
  return !!alvo.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"]')
}

/**
 * Linha da navegação: arrastável (segurar e mover) e com menu de contexto (botão direito).
 * O menu e o diálogo de renomear ficam FORA da linha na árvore do React: o espaço digitado nunca chega ao arrastar.
 */
export function LinhaNavegacao({ tipo, id, nome, habilitado, podeEditar, podeExcluir, fixa = false, className, style, children }: {
  tipo: TipoArrastavel
  id: string
  nome: string
  habilitado: boolean
  /** Renomear e duplicar. */
  podeEditar: boolean
  /** Excluir. */
  podeExcluir: boolean
  /** Área que a plataforma criou (tem funções ligadas a ela): o aviso de exclusão é mais forte. */
  fixa?: boolean
  className: string
  style?: CSSProperties
  children: ReactNode
}) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const [renomeando, setRenomeando] = useState(false)
  const [novoNome, setNovoNome] = useState(nome)
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `${tipo}:${id}`, data: { tipo, id }, disabled: !habilitado })

  // Os ouvintes do dnd-kit só valem para eventos que nascem na própria linha.
  const ouvintes = Object.fromEntries(
    Object.entries(listeners ?? {}).map(([evento, funcao]) => [
      evento,
      (e: SyntheticEvent) => {
        if (nascidoEmCampo(e)) return
        ;(funcao as (e: SyntheticEvent) => void)(e)
      },
    ]),
  )

  const caminho = CAMINHO[tipo]
  const url = () => `${window.location.origin}${caminho}${id}`
  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(url())
      avisar({ ok: 'Link copiado.' }, true)
    } catch {
      avisar({ erro: 'Não foi possível copiar o link.' })
    }
  }
  const excluir = async () => {
    const base = tipo === 'list' ? 'As tarefas dela deixam de aparecer.' : tipo === 'folder' ? 'As listas dentro dela também serão excluídas.' : 'As pastas e listas dentro dele também serão excluídas.'
    const aviso = fixa ? `${base} Esta é uma área criada pela plataforma: o que depende dela (como o módulo de Conteúdo) deixa de funcionar.` : base
    if (!(await confirmar({ titulo: `Excluir ${ROTULO[tipo]} "${nome}"?`, descricao: aviso, confirmar: 'Excluir', perigo: true }))) return
    iniciar(async () => {
      if (avisar(await excluirItemNavegacao({ tipo, id }), true)) router.refresh()
    })
  }
  const duplicar = () =>
    iniciar(async () => {
      const r = await duplicarListaNavegacao(id)
      if (!avisar(r, true)) return
      router.refresh()
    })
  const salvarNome = () =>
    iniciar(async () => {
      if (!avisar(await renomearItemNavegacao({ tipo, id, nome: novoNome }), true)) return
      setRenomeando(false)
      router.refresh()
    })

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            {...ouvintes}
            // Links e imagens são arrastados pelo navegador por padrão e "roubam" o gesto do dnd-kit.
            onDragStart={(e) => e.preventDefault()}
            className={`${className} ${isDragging ? 'z-20 cursor-grabbing opacity-45 ring-1 ring-marca/40' : ''}`}
            style={{ ...style, transform: CSS.Transform.toString(transform), transition }}
          >
            {children}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {caminho && (
            <ContextMenuItem onSelect={() => window.open(url(), '_blank', 'noopener')}><ExternalLink /> Abrir em nova aba</ContextMenuItem>
          )}
          {caminho && <ContextMenuItem onSelect={copiarLink}><Copy /> Copiar link</ContextMenuItem>}
          {podeEditar && (
            <>
              {caminho && <ContextMenuSeparator />}
              <ContextMenuItem onSelect={() => { setNovoNome(nome); setRenomeando(true) }}><Pencil /> Renomear</ContextMenuItem>
              {tipo === 'list' && <ContextMenuItem disabled={pendente} onSelect={duplicar}><CopyPlus /> Duplicar</ContextMenuItem>}
            </>
          )}
          {podeExcluir && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive" disabled={pendente} onSelect={excluir}><Trash2 /> Excluir</ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <Dialog open={renomeando} onOpenChange={setRenomeando}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear {ROTULO[tipo]}</DialogTitle>
            <DialogDescription>O novo nome aparece para toda a equipe.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); salvarNome() }} className="space-y-4">
            <input autoFocus value={novoNome} onChange={(e) => setNovoNome(e.target.value)} maxLength={120} aria-label="Novo nome" className={campo} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRenomeando(false)} className={botaoSecundario}>Cancelar</button>
              <button disabled={pendente || !novoNome.trim()} className={botaoPrimario}>Salvar</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
