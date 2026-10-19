'use client'

import { Check, RotateCcw, Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { excluirLancamentoAcao, marcarPagoAcao } from '@/app/(app)/financeiro/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { formatarReais, type Lancamento } from '@/dominio/financeiro'
import { LancamentoDialog } from './LancamentoDialog'

export function AcoesLancamento({ lancamento, clientes, hoje }: { lancamento: Lancamento; clientes: { id: string; nome: string }[]; hoje: string }) {
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const alternar = () => iniciar(async () => void avisar(await marcarPagoAcao(lancamento.id, !lancamento.pago), true))
  const excluir = async () => {
    const nome = lancamento.descricao || lancamento.categoria
    if (!(await confirmar({ titulo: `Excluir "${nome}"?`, descricao: `O lançamento de ${formatarReais(lancamento.centavos)} some do financeiro.`, confirmar: 'Excluir', perigo: true }))) return
    iniciar(async () => void avisar(await excluirLancamentoAcao(lancamento.id), true))
  }
  const entrada = lancamento.tipo === 'entrada'
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" disabled={pendente} onClick={alternar} title={lancamento.pago ? 'Marcar como pendente' : entrada ? 'Marcar como recebido' : 'Marcar como pago'} aria-label={lancamento.pago ? 'Marcar como pendente' : 'Marcar como pago'} className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto disabled:opacity-50">
        {lancamento.pago ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
      </button>
      <LancamentoDialog lancamento={lancamento} clientes={clientes} hoje={hoje} />
      <button type="button" disabled={pendente} onClick={excluir} title="Excluir" aria-label="Excluir lançamento" className="rounded p-1 text-texto-3 hover:bg-hover hover:text-perigo disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  )
}
