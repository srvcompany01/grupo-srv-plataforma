'use client'

import { ArrowLeft, Maximize, Minus, Plus, Redo2, Undo2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type ReactNode } from 'react'
import { renomearTelaAcao } from '@/app/(app)/telas/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import type { TipoTela } from '@/servicos/telas'
import type { SituacaoSalvamento } from './hooks'

const TEXTO_SITUACAO: Record<SituacaoSalvamento, string> = { salvo: 'Salvo', pendente: 'Alterações por salvar…', salvando: 'Salvando…', erro: 'Erro ao salvar — tentando de novo ao editar' }
const botao = 'rounded-md p-1.5 text-texto-2 hover:bg-hover hover:text-texto disabled:opacity-40 disabled:hover:bg-transparent'

/** Topo do editor: voltar, nome editável, estado do salvamento, desfazer/refazer e zoom. */
export function BarraTela({ tipo, id, titulo, situacao, zoom, podeDesfazer, podeRefazer, aoDesfazer, aoRefazer, aoAproximar, aoEnquadrar, extra }: {
  tipo: TipoTela
  id: string
  titulo: string
  situacao: SituacaoSalvamento
  zoom: number
  podeDesfazer: boolean
  podeRefazer: boolean
  aoDesfazer: () => void
  aoRefazer: () => void
  aoAproximar: (fator: number) => void
  aoEnquadrar: () => void
  extra?: ReactNode
}) {
  const router = useRouter()
  const [nome, setNome] = useState(titulo)
  const [, iniciar] = useTransition()
  const voltar = tipo === 'quadro' ? '/quadros' : '/funis'
  const salvarNome = () => {
    const novo = nome.trim()
    if (!novo || novo === titulo) return setNome(titulo)
    iniciar(async () => {
      if (avisar(await renomearTelaAcao(tipo, id, novo))) router.refresh()
      else setNome(titulo)
    })
  }
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-borda bg-white px-3 py-1.5">
      <Link href={voltar} aria-label="Voltar para a lista" className={botao}><ArrowLeft className="h-4 w-4" /></Link>
      <input value={nome} onChange={(e) => setNome(e.target.value)} onBlur={salvarNome} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} maxLength={120} aria-label="Nome" className="h-8 min-w-0 max-w-72 flex-1 rounded-md border border-transparent bg-transparent px-2 text-corpo font-semibold text-texto outline-none hover:border-borda focus:border-marca" />
      <span role="status" className={`text-legenda ${situacao === 'erro' ? 'text-perigo' : 'text-texto-3'}`}>{TEXTO_SITUACAO[situacao]}</span>
      <div className="ml-auto flex items-center gap-0.5">
        {extra}
        <button type="button" className={botao} onClick={aoDesfazer} disabled={!podeDesfazer} aria-label="Desfazer" title="Desfazer (Ctrl+Z)"><Undo2 className="h-4 w-4" /></button>
        <button type="button" className={botao} onClick={aoRefazer} disabled={!podeRefazer} aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)"><Redo2 className="h-4 w-4" /></button>
        <span className="mx-1 h-4 w-px bg-borda" />
        <button type="button" className={botao} onClick={() => aoAproximar(1 / 1.25)} aria-label="Diminuir zoom" title="Diminuir zoom"><Minus className="h-4 w-4" /></button>
        <span className="w-11 text-center text-legenda tabular-nums text-texto-2">{Math.round(zoom * 100)}%</span>
        <button type="button" className={botao} onClick={() => aoAproximar(1.25)} aria-label="Aumentar zoom" title="Aumentar zoom"><Plus className="h-4 w-4" /></button>
        <button type="button" className={botao} onClick={aoEnquadrar} aria-label="Enquadrar tudo" title="Enquadrar tudo"><Maximize className="h-4 w-4" /></button>
      </div>
    </header>
  )
}
