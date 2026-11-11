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
    <header>
      <Link href={voltar} aria-label="Voltar para a lista"><ArrowLeft /></Link>
      <input value={nome} onChange={(e) => setNome(e.target.value)} onBlur={salvarNome} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} maxLength={120} aria-label="Nome" />
      <span role="status">{TEXTO_SITUACAO[situacao]}</span>
      <div>
        {extra}
        <button type="button" onClick={aoDesfazer} disabled={!podeDesfazer} aria-label="Desfazer" title="Desfazer (Ctrl+Z)"><Undo2 /></button>
        <button type="button" onClick={aoRefazer} disabled={!podeRefazer} aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)"><Redo2 /></button>
        <span />
        <button type="button" onClick={() => aoAproximar(1 / 1.25)} aria-label="Diminuir zoom" title="Diminuir zoom"><Minus /></button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => aoAproximar(1.25)} aria-label="Aumentar zoom" title="Aumentar zoom"><Plus /></button>
        <button type="button" onClick={aoEnquadrar} aria-label="Enquadrar tudo" title="Enquadrar tudo"><Maximize /></button>
      </div>
    </header>
  )
}
