'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { botaoPerigo, botaoPrimario, botaoSecundario } from '@/lib/ui'

export type OpcoesConfirmacao = {
  titulo: string
  descricao?: string
  /** Texto do botão de confirmar. Padrão: "Confirmar". */
  confirmar?: string
  /** Ação destrutiva (excluir, arquivar): botão em vermelho. */
  perigo?: boolean
}

type Confirmar = (opcoes: OpcoesConfirmacao | string) => Promise<boolean>

// Sem provider (testes, páginas isoladas) cai no diálogo do navegador para nunca bloquear a ação.
const Contexto = createContext<Confirmar>(async (o) => window.confirm(typeof o === 'string' ? o : o.titulo))

/** `if (!(await confirmar({ titulo: 'Excluir?', perigo: true }))) return` */
export const useConfirmar = () => useContext(Contexto)

export function ConfirmarProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<{ opcoes: OpcoesConfirmacao; resolver: (ok: boolean) => void } | null>(null)

  const confirmar = useCallback<Confirmar>(
    (opcoes) => new Promise<boolean>((resolver) => setPedido({ opcoes: typeof opcoes === 'string' ? { titulo: opcoes } : opcoes, resolver })),
    [],
  )
  const responder = (ok: boolean) => {
    pedido?.resolver(ok)
    setPedido(null)
  }

  return (
    <Contexto.Provider value={confirmar}>
      {children}
      <Dialog open={pedido !== null} onOpenChange={(aberto) => !aberto && responder(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pedido?.opcoes.titulo}</DialogTitle>
            {pedido?.opcoes.descricao && <DialogDescription>{pedido.opcoes.descricao}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <button type="button" className={botaoSecundario} onClick={() => responder(false)}>Cancelar</button>
            <button type="button" autoFocus className={pedido?.opcoes.perigo ? botaoPerigo : botaoPrimario} onClick={() => responder(true)}>{pedido?.opcoes.confirmar ?? 'Confirmar'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Contexto.Provider>
  )
}
