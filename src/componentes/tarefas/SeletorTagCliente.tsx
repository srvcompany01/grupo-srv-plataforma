'use client'

import { Check, ChevronLeft, Settings2, Tag } from 'lucide-react'
import { useState, useTransition } from 'react'
import { atualizarTagCliente, definirTagClienteDaTarefa } from '@/app/(app)/acoes-tags-clientes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { CORES_PERSONALIZACAO } from '@/dominio/personalizacao'
import { avisar } from './avisar'

export type TagCliente = { id: string; nome: string; cor: string }

const COR_HEX = /^#[0-9a-f]{6}$/i

function Chip({ tag }: { tag: TagCliente }) {
  return (
    <span
      className="inline-flex max-w-40 items-center gap-1 rounded-md border px-1.5 py-0.5 text-legenda font-semibold"
      style={{ color: tag.cor, borderColor: `${tag.cor}55`, backgroundColor: `${tag.cor}14` }}
    >
      <Tag className="h-3 w-3 shrink-0" />
      <span className="truncate">{tag.nome}</span>
    </span>
  )
}

/** Tag de cliente da tarefa (opcional). Alterar em qualquer linha atualiza a mãe e todas as subtarefas. */
export function SeletorTagCliente({ tarefaId, atual: atualOuNulo, opcoes = [], podeGerir = false }: {
  tarefaId: string
  atual: TagCliente | null
  opcoes?: TagCliente[]
  podeGerir?: boolean
}) {
  const atual: TagCliente = atualOuNulo ?? { id: '', nome: 'Sem cliente', cor: '#87909e' }
  const [aberto, setAberto] = useState(false)
  const [configurando, setConfigurando] = useState(false)
  const [nome, setNome] = useState(atual.nome)
  const [cor, setCor] = useState(atual.cor)
  const [pendente, iniciar] = useTransition()
  const editavel = podeGerir && opcoes.length > 0

  if (!editavel) return atualOuNulo ? <Chip tag={atual} /> : <span className="text-texto-3">—</span>

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
        <button type="button" aria-label={`Tag do cliente: ${atual.nome}`} title="Alterar tag de cliente" className="shrink-0 rounded-md outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-marca">
          {atualOuNulo ? <Chip tag={atual} /> : <span className="controle inline-flex items-center gap-1 rounded-md border border-dashed border-borda px-1.5 py-0.5 text-legenda text-texto-3 hover:border-borda-forte hover:text-texto"><Tag className="h-3 w-3" /> Cliente</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={7} className="w-80 gap-0 overflow-hidden rounded-xl border border-borda bg-white p-0 shadow-xl">
        {configurando ? (
          <div>
            <div className="flex items-center gap-2 border-b border-borda px-3 py-2.5">
              <button type="button" onClick={() => setConfigurando(false)} aria-label="Voltar para as tags" className="rounded-md p-1 text-texto-3 hover:bg-hover hover:text-texto"><ChevronLeft className="h-4 w-4" /></button>
              <div className="min-w-0 flex-1"><p className="text-corpo font-semibold text-texto">Configurar tag</p><p className="truncate text-legenda text-texto-3">A alteração vale em toda a plataforma</p></div>
              <Chip tag={{ ...atual, nome: nome || atual.nome, cor: COR_HEX.test(cor) ? cor : atual.cor }} />
            </div>
            <div className="space-y-4 p-3">
              <label className="block space-y-1.5 text-legenda font-semibold text-texto-2">
                Nome da tag
                <input value={nome} onChange={(evento) => setNome(evento.target.value)} maxLength={80} className="h-9 w-full rounded-lg border border-borda px-3 text-corpo font-normal text-texto outline-none focus:border-marca focus:ring-2 focus:ring-marca/15" />
              </label>
              <fieldset className="space-y-2">
                <legend className="text-legenda font-semibold text-texto-2">Cor</legend>
                <div className="grid grid-cols-7 gap-2">
                  {CORES_PERSONALIZACAO.map((item) => (
                    <button key={item} type="button" onClick={() => setCor(item)} aria-label={`Usar cor ${item}`} className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition hover:scale-110" style={{ backgroundColor: item, borderColor: cor.toLowerCase() === item ? '#202020' : 'transparent' }}>
                      {cor.toLowerCase() === item && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-[40px_1fr] gap-2">
                <input type="color" value={COR_HEX.test(cor) ? cor : atual.cor} onChange={(evento) => setCor(evento.target.value)} aria-label="Selecionar cor personalizada" className="h-9 w-10 cursor-pointer rounded-lg border border-borda bg-white p-1" />
                <input value={cor} onChange={(evento) => setCor(evento.target.value.startsWith('#') ? evento.target.value : `#${evento.target.value}`)} maxLength={7} aria-label="Cor hexadecimal" placeholder="#3b82f6" className={`h-9 rounded-lg border px-3 font-mono text-corpo uppercase outline-none focus:ring-2 ${COR_HEX.test(cor) ? 'border-borda focus:border-marca focus:ring-marca/15' : 'border-perigo-borda focus:ring-perigo-fundo'}`} />
              </div>
              <button type="button" onClick={salvar} disabled={pendente || !nome.trim() || !COR_HEX.test(cor)} className="h-9 w-full rounded-lg bg-marca px-3 text-rotulo font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45">{pendente ? 'Salvando…' : 'Salvar configuração'}</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 border-b border-borda px-3 py-2.5">
              <div className="min-w-0 flex-1"><p className="text-corpo font-semibold text-texto">Tag do cliente</p><p className="text-legenda text-texto-3">Atualiza a tarefa-mãe e todas as subtarefas</p></div>
              {atualOuNulo && <button type="button" onClick={abrirConfiguracao} aria-label="Configurar nome e cor da tag" title="Configurar tag" className="rounded-lg border border-borda p-1.5 text-texto-3 hover:bg-hover hover:text-texto"><Settings2 className="h-4 w-4" /></button>}
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto p-2">
              <button type="button" disabled={pendente || !atualOuNulo} onClick={() => selecionar(null)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-hover disabled:opacity-50">
                <span className="h-3 w-3 shrink-0 rounded-full border border-dashed border-borda-forte" />
                <span className="min-w-0 flex-1 truncate text-corpo text-texto-2">Sem cliente</span>
                {!atualOuNulo && <Check className="h-4 w-4 shrink-0 text-texto-3" />}
              </button>
              {opcoes.map((tag) => (
                <button key={tag.id} type="button" disabled={pendente} onClick={() => selecionar(tag.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-hover disabled:opacity-50">
                  <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: tag.cor, boxShadow: `0 0 0 1px ${tag.cor}55` }} />
                  <span className="min-w-0 flex-1 truncate text-corpo text-texto">{tag.nome}</span>
                  {tag.id === atual.id && <Check className="h-4 w-4 shrink-0" style={{ color: tag.cor }} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
