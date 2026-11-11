'use client'

import { Plus, X } from 'lucide-react'
import { corDaOpcao, type ConfigCampo } from '@/dominio/personalizacao'
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
    <div>
      {opcoes.map((opcao, indice) => {
        const cor = corDaOpcao(config, opcao)
        return (
          <div key={indice}>
            <Popover>
              <PopoverTrigger type="button" aria-label={`Cor da opção ${opcao || indice + 1}`} style={{ background: cor }} />
              <PopoverContent align="start"><SeletorCor cor={cor} onChange={(nova) => corar(opcao, nova)} /></PopoverContent>
            </Popover>
            <input value={opcao} onChange={(e) => trocar(indice, e.target.value)} maxLength={60} placeholder={`Opção ${indice + 1}`} aria-label={`Nome da opção ${indice + 1}`} />
            <button type="button" aria-label={`Remover opção ${opcao || indice + 1}`} onClick={() => remover(indice)}><X /></button>
          </div>
        )
      })}
      <button type="button" onClick={adicionar}><Plus /> Adicionar opção</button>
    </div>
  )
}
