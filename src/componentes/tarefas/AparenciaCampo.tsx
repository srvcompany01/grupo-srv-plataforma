'use client'

import { Ban } from 'lucide-react'
import { IconeVisual } from '@/componentes/IconeVisual'
import { ICONE_NENHUM, ICONES_PERSONALIZACAO } from '@/dominio/personalizacao'
import { rotulo } from '@/lib/ui'
import { SeletorCor } from './SeletorCor'

/** Cor (paleta ou #HEX livre) e ícone do campo, com a opção de ficar sem ícone (só o nome, na cor escolhida). */
export function AparenciaCampo({ cor, aoMudarCor, icone, aoMudarIcone, iconePadrao }: { cor: string; aoMudarCor: (cor: string) => void; icone: string; aoMudarIcone: (icone: string) => void; iconePadrao: string }) {
  const atual = icone || iconePadrao
  const icones = [...new Set([iconePadrao, ...ICONES_PERSONALIZACAO])]
  const botao = (ativo: boolean) => `flex h-8 w-8 items-center justify-center rounded-lg border ${ativo ? 'border-texto bg-hover' : 'border-borda hover:bg-hover'}`
  return (
    <>
      <div className="space-y-1"><span className={rotulo}>Cor</span><SeletorCor cor={cor} onChange={aoMudarCor} /></div>
      <div className="space-y-1">
        <span className={rotulo}>Ícone</span>
        <div className="flex flex-wrap gap-1">
          <button type="button" aria-label="Sem ícone" title="Sem ícone (só o nome)" onClick={() => aoMudarIcone(ICONE_NENHUM)} className={`${botao(atual === ICONE_NENHUM)} text-texto-3`}><Ban className="h-4 w-4" /></button>
          {icones.map((nomeIcone) => (
            <button key={nomeIcone} type="button" aria-label={`Ícone ${nomeIcone}`} onClick={() => aoMudarIcone(nomeIcone)} className={botao(atual === nomeIcone)} style={{ color: cor }}><IconeVisual icone={nomeIcone} className="h-4 w-4" /></button>
          ))}
        </div>
      </div>
    </>
  )
}
