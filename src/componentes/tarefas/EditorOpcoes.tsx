'use client'

import { Plus, X } from 'lucide-react'
import { corDaOpcao, type ConfigCampo } from '@/dominio/personalizacao'
import { campo } from '@/lib/ui'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { SeletorCor } from './SeletorCor'

/** Uma linha por opção: bolinha de cor (abre o seletor), nome e remover. */
export function EditorOpcoes({ config, onChange }: { config: ConfigCampo; onChange: (config: ConfigCampo) => void }) {
  const opcoes = config.options ?? []
  const trocar = (indice: number, texto: string) => {
    const antigo = opcoes[indice]
    const cores = { ...config.optionColors }
    if (antigo in cores) {
      cores[texto] = cores[antigo]
      delete cores[antigo]
    }
    onChange({ ...config, options: opcoes.map((o, i) => (i === indice ? texto : o)), optionColors: cores })
  }
  const corar = (opcao: string, cor: string) => onChange({ ...config, optionColors: { ...config.optionColors, [opcao]: cor } })
  const remover = (indice: number) => {
    const cores = { ...config.optionColors }
    delete cores[opcoes[indice]]
    onChange({ ...config, options: opcoes.filter((_, i) => i !== indice), optionColors: cores })
  }
  const adicionar = () => onChange({ ...config, options: [...opcoes, ''] })

  return (
    <div className="space-y-2">
      {opcoes.map((opcao, indice) => {
        const cor = corDaOpcao(config, opcao)
        return (
          <div key={indice} className="controle flex items-center gap-2 rounded-[9px] border border-borda bg-white px-2 focus-within:border-marca focus-within:ring-3 focus-within:ring-marca/15">
            <Popover>
              <PopoverTrigger type="button" aria-label={`Cor da opção ${opcao || indice + 1}`} className="h-5 w-5 shrink-0 rounded-full ring-1 ring-borda transition hover:scale-110" style={{ background: cor }} />
              <PopoverContent align="start" className="w-64 p-3"><SeletorCor cor={cor} onChange={(nova) => corar(opcao, nova)} /></PopoverContent>
            </Popover>
            <input value={opcao} onChange={(e) => trocar(indice, e.target.value)} maxLength={60} placeholder={`Opção ${indice + 1}`} aria-label={`Nome da opção ${indice + 1}`} className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-texto-3" />
            <button type="button" aria-label={`Remover opção ${opcao || indice + 1}`} onClick={() => remover(indice)} className="rounded-lg p-1.5 text-texto-3 transition hover:bg-perigo-fundo hover:text-perigo"><X className="h-4 w-4" /></button>
          </div>
        )
      })}
      <button type="button" onClick={adicionar} className={`${campo} flex items-center gap-2 text-left text-texto-3`}><Plus className="h-4 w-4" /> Adicionar opção</button>
    </div>
  )
}
