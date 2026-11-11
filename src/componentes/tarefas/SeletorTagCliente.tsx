'use client'

import { ChipCliente } from '@/componentes/NomeCliente'
import { Check, ChevronLeft, Settings2, Tag } from 'lucide-react'
import { useState, useTransition } from 'react'
import { atualizarTagCliente, definirTagClienteDaTarefa } from '@/app/(app)/acoes-tags-clientes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { CORES_PERSONALIZACAO } from '@/dominio/personalizacao'
import { avisar } from './avisar'

export type TagCliente = { id: string; nome: string; cor: string }

const COR_HEX = /^#[0-9a-f]{6}$/i

function Chip({ tag }: { tag: TagCliente; compacto?: boolean }) {
  // Redesign 2026: cliente = bolinha (iniciais sobre a cor da tag) + pílula com o nome em negrito azul.
  return <ChipCliente nome={tag.nome} cor={COR_HEX.test(tag.cor) ? tag.cor : undefined} />
}

/** Tag de cliente da tarefa (opcional). Alterar em qualquer linha atualiza a mãe e todas as subtarefas. */
export function SeletorTagCliente({ tarefaId, atual: atualOuNulo, opcoes = [], podeGerir = false, compacto = false }: {
  tarefaId: string
  atual: TagCliente | null
  opcoes?: TagCliente[]
  podeGerir?: boolean
  /** Aparência enxuta das linhas da Lista. */
  compacto?: boolean
}) {
  const atual: TagCliente = atualOuNulo ?? { id: '', nome: 'Sem cliente', cor: '#87909e' }
  const [aberto, setAberto] = useState(false)
  const [configurando, setConfigurando] = useState(false)
  const [nome, setNome] = useState(atual.nome)
  const [cor, setCor] = useState(atual.cor)
  const [pendente, iniciar] = useTransition()
  const editavel = podeGerir && opcoes.length > 0

  if (!editavel) return atualOuNulo ? <Chip tag={atual} compacto={compacto} /> : <span>—</span>

  const abrirConfiguracao = () => {
    setNome(atual.nome)
    setCor(atual.cor)
    setConfigurando(true)
  }

  const selecionar = (clienteId: string | null) => {
    if ((clienteId ?? '') === atual.id) return
    iniciar(async () => {
      if (avisar(await definirTagClienteDaTarefa(tarefaId, clienteId), true)) setAberto(false)
    })
  }

  const salvar = () => {
    iniciar(async () => {
      if (!avisar(await atualizarTagCliente(atual.id, nome, cor), true)) return
      setConfigurando(false)
      setAberto(false)
    })
  }

  return (
    <Popover open={aberto} onOpenChange={(valor) => { setAberto(valor); if (!valor) setConfigurando(false) }}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Tag do cliente: ${atual.nome}`} title="Alterar tag de cliente">
          {atualOuNulo ? <Chip tag={atual} compacto={compacto} /> : <span><Tag /> Cliente</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={7}>
        {configurando ? (
          <div>
            <div>
              <button type="button" onClick={() => setConfigurando(false)} aria-label="Voltar para as tags"><ChevronLeft /></button>
              <div><p>Configurar tag</p><p>A alteração vale em toda a plataforma</p></div>
              <Chip tag={{ ...atual, nome: nome || atual.nome, cor: COR_HEX.test(cor) ? cor : atual.cor }} />
            </div>
            <div>
              <label>
                Nome da tag
                <input value={nome} onChange={(evento) => setNome(evento.target.value)} maxLength={80} />
              </label>
              <fieldset>
                <legend>Cor</legend>
                <div>
                  {CORES_PERSONALIZACAO.map((item) => (
                    <button key={item} type="button" onClick={() => setCor(item)} aria-label={`Usar cor ${item}`} style={{ backgroundColor: item, borderColor: cor.toLowerCase() === item ? '#202020' : 'transparent' }}>
                      {cor.toLowerCase() === item && <Check />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <input type="color" value={COR_HEX.test(cor) ? cor : atual.cor} onChange={(evento) => setCor(evento.target.value)} aria-label="Selecionar cor personalizada" />
                <input value={cor} onChange={(evento) => setCor(evento.target.value.startsWith('#') ? evento.target.value : `#${evento.target.value}`)} maxLength={7} aria-label="Cor hexadecimal" placeholder="#3b82f6" />
              </div>
              <button type="button" onClick={salvar} disabled={pendente || !nome.trim() || !COR_HEX.test(cor)}>{pendente ? 'Salvando…' : 'Salvar configuração'}</button>
            </div>
          </div>
        ) : (
          <div>
            <div>
              <div><p>Tag do cliente</p><p>Atualiza a tarefa-mãe e todas as subtarefas</p></div>
              {atualOuNulo && <button type="button" onClick={abrirConfiguracao} aria-label="Configurar nome e cor da tag" title="Configurar tag"><Settings2 /></button>}
            </div>
            <div>
              <button type="button" disabled={pendente || !atualOuNulo} onClick={() => selecionar(null)}>
                <span />
                <span>Sem cliente</span>
                {!atualOuNulo && <Check />}
              </button>
              {opcoes.map((tag) => (
                <button key={tag.id} type="button" disabled={pendente} onClick={() => selecionar(tag.id)}>
                  <span style={{ backgroundColor: tag.cor, boxShadow: `0 0 0 1px ${tag.cor}55` }} />
                  <span>{tag.nome}</span>
                  {tag.id === atual.id && <Check style={{ color: tag.cor }} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
