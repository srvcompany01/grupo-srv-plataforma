'use client'

import { Ban } from 'lucide-react'
import { IconeVisual } from '@/componentes/IconeVisual'
import { ICONE_NENHUM, ICONES_PERSONALIZACAO } from '@/dominio/personalizacao'
import { SeletorCor } from './SeletorCor'

/** Cor (paleta ou #HEX livre) e ícone do campo, com a opção de ficar sem ícone (só o nome, na cor escolhida). */
export function AparenciaCampo({ cor, aoMudarCor, icone, aoMudarIcone, iconePadrao }: { cor: string; aoMudarCor: (cor: string) => void; icone: string; aoMudarIcone: (icone: string) => void; iconePadrao: string }) {
  const atual = icone || iconePadrao
  const icones = [...new Set([iconePadrao, ...ICONES_PERSONALIZACAO])]
  const botao = (ativo: boolean) => `flex h-8 w-8 items-center justify-center rounded-lg border ${ativo ? 'border-texto bg-hover' : 'border-borda hover:bg-hover'}`
  return (
    <>
      <div><span>Cor</span><SeletorCor cor={cor} onChange={aoMudarCor} /></div>
      <div>
        <span>Ícone</span>
        <div>
          <button type="button" aria-label="Sem ícone" title="Sem ícone (só o nome)" onClick={() => aoMudarIcone(ICONE_NENHUM)}><Ban /></button>
          {icones.map((nomeIcone) => (
            <button key={nomeIcone} type="button" aria-label={`Ícone ${nomeIcone}`} onClick={() => aoMudarIcone(nomeIcone)} style={{ color: cor }}><IconeVisual icone={nomeIcone} /></button>
          ))}
        </div>
      </div>
    </>
  )
}
