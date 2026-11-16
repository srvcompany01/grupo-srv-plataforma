'use client'

import { ChevronDown, ExternalLink, Save } from 'lucide-react'
import { useState, useTransition, type ReactNode } from 'react'
import { salvarValorCampo } from '@/app/(app)/acoes-campos'
import { IconeVisual } from '@/componentes/IconeVisual'
import { avisar } from '@/componentes/tarefas/avisar'
import { Avatar } from '@/componentes/Avatar'
import { OpcaoMenu, TituloMenu } from '@/componentes/ui/opcao-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { corDaOpcao, formatarValorCampo, type DefinicaoCampo } from '@/dominio/personalizacao'
import type { Pessoa } from '@/dominio/tarefas'
import type { Json } from '@/infra/supabase/tipos'
import { botaoSecundario, campo } from '@/lib/ui'
import type { Resultado } from '@/servicos/acao'

function paraTexto(valor: Json | null | undefined) {
  if (Array.isArray(valor)) return valor.map(String).join('\n')
  return valor == null ? '' : String(valor)
}

function Pilula({ nome, cor }: { nome: string; cor: string }) {
  return <span className="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-legenda font-medium text-texto" style={{ background: `${cor}22` }}><span className="h-2 w-2 shrink-0 rounded-md" style={{ background: cor }} /><span className="truncate">{nome}</span></span>
}

/** Escolha de opções coloridas: uma (lista suspensa) ou várias (rótulos). */
function SeletorOpcoes({ definicao, valor, multiplo, compacto, pendente, onChange }: { definicao: DefinicaoCampo; valor: Json | null; multiplo: boolean; compacto: boolean; pendente: boolean; onChange: (novo: Json | null) => void }) {
  const [aberto, setAberto] = useState(false)
  const opcoes = definicao.configuracao.options ?? []
  const atuais = multiplo ? (Array.isArray(valor) ? valor.map(String) : []) : typeof valor === 'string' && valor ? [valor] : []
  const alternar = (opcao: string) => {
    if (!multiplo) {
      onChange(atuais[0] === opcao ? null : opcao)
      setAberto(false) // escolha única: escolheu, fecha
      return
    }
    onChange(atuais.includes(opcao) ? atuais.filter((x) => x !== opcao) : [...atuais, opcao])
  }
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger disabled={pendente} className={`relative flex min-h-8 w-full items-center gap-1 overflow-hidden rounded-lg text-left text-rotulo hover:bg-white hover:ring-1 hover:ring-borda ${compacto ? 'px-5' : 'border border-borda bg-white px-2'}`}>
        <span className={`flex min-w-0 flex-1 flex-wrap gap-1 py-1 ${compacto ? 'justify-center' : ''}`}>{atuais.length ? atuais.map((o) => <Pilula key={o} nome={o} cor={corDaOpcao(definicao.configuracao, o)} />) : <span className="text-texto-3">{compacto ? '—' : 'Sem seleção'}</span>}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 text-texto-3 ${compacto ? 'absolute right-1.5' : ''}`} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-0 p-1.5">
        <TituloMenu>{definicao.nome}</TituloMenu>
        {opcoes.length === 0 && <p className="px-2.5 py-1 text-[13px] text-texto-3">Nenhuma opção configurada.</p>}
        <OpcaoMenu suave rotulo="Vazio" marcado={atuais.length === 0} desabilitado={pendente} aoClicar={() => { onChange(null); setAberto(false) }} />
        {opcoes.map((opcao) => (
          <OpcaoMenu key={opcao} cor={corDaOpcao(definicao.configuracao, opcao)} rotulo={opcao} marcado={atuais.includes(opcao)} desabilitado={pendente} aoClicar={() => alternar(opcao)} />
        ))}
      </PopoverContent>
    </Popover>
  )
}

/** Popover das pessoas: controlado, para o botão "Vazio" poder fechá-lo. */
function PopoverPessoas({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  return <Popover open={aberto} onOpenChange={setAberto}>{children}</Popover>
}

function CampoEditavel({ aoSalvar, definicao, equipe, compacto = false }: { aoSalvar: (valor: Json | null) => Promise<Resultado>; definicao: DefinicaoCampo; equipe: Pessoa[]; compacto?: boolean }) {
  const [valor, setValor] = useState<Json | null>(definicao.valor ?? null)
  const [pendente, iniciar] = useTransition()
  const salvar = (novo: Json | null = valor) => iniciar(async () => void avisar(await aoSalvar(novo)))
  const classe = compacto
    ? 'h-8 w-full rounded-lg border border-transparent bg-transparent px-[7px] text-center text-rotulo outline-none transition hover:border-borda hover:bg-white focus:border-marca/40 focus:bg-white focus:ring-2 focus:ring-marca/10'
    : `${campo} h-8 py-1.5 text-corpo`
  const somenteLeitura = definicao.tipo === 'formula' || definicao.tipo === 'progress_auto'

  if (somenteLeitura) {
    return <div className={`flex h-8 items-center rounded-lg font-medium ${compacto ? 'justify-center px-2 text-rotulo' : 'bg-fundo px-3 text-corpo'}`}>{formatarValorCampo(definicao, valor)}</div>
  }
  if (definicao.tipo === 'button') {
    const href = definicao.configuracao.buttonUrl
    return href ? <a href={href} target="_blank" rel="noreferrer" className={`${botaoSecundario} ${compacto ? 'mx-auto flex w-fit' : ''}`}>{definicao.configuracao.buttonLabel ?? 'Abrir'} <ExternalLink className="h-3.5 w-3.5" /></a> : <span className={`text-xs text-texto-3 ${compacto ? 'block px-2 text-center' : ''}`}>Configure uma URL para este botão.</span>
  }
  if (definicao.tipo === 'checkbox') {
    return <label className={`inline-flex items-center gap-2 text-corpo ${compacto ? 'h-8 w-full justify-center px-2' : ''}`}><input type="checkbox" checked={valor === true} disabled={pendente} onChange={(e) => { setValor(e.target.checked); salvar(e.target.checked) }} />{valor === true ? 'Sim' : 'Não'}</label>
  }
  if (definicao.tipo === 'dropdown' || definicao.tipo === 'labels') {
    return <SeletorOpcoes definicao={definicao} valor={valor} multiplo={definicao.tipo === 'labels'} compacto={compacto} pendente={pendente} onChange={(novo) => { setValor(novo); salvar(novo) }} />
  }
  if (definicao.tipo === 'people') {
    const itens = equipe.map((p) => ({ valor: p.id, nome: p.nome }))
    const atuais = Array.isArray(valor) ? valor.map(String) : []
    if (compacto) {
      return (
        <PopoverPessoas>
          <PopoverTrigger className="relative flex h-8 w-full items-center gap-1 overflow-hidden rounded-lg px-5 text-center text-rotulo hover:bg-white hover:ring-1 hover:ring-borda">
            <span className="min-w-0 flex-1 truncate text-center">{atuais.length ? itens.filter((item) => atuais.includes(item.valor)).map((item) => item.nome).join(', ') : '—'}</span>
            <ChevronDown className="absolute right-1.5 h-3 w-3 shrink-0 text-texto-3" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 gap-0 p-1.5">
            <TituloMenu>{definicao.nome}</TituloMenu>
            <OpcaoMenu suave rotulo="Vazio" marcado={atuais.length === 0} desabilitado={pendente} aoClicar={() => { setValor([]); salvar([]) }} />
            {itens.length === 0 && <p className="px-2.5 py-1 text-[13px] text-texto-3">Nenhuma pessoa disponível.</p>}
            {itens.map((item) => {
              const marcada = atuais.includes(item.valor)
              return (
                <OpcaoMenu key={item.valor} icone={<Avatar nome={item.nome || '?'} tamanho="h-5 w-5 text-legenda" />} rotulo={item.nome} marcado={marcada} desabilitado={pendente} aoClicar={() => {
                  const novo = marcada ? atuais.filter((id) => id !== item.valor) : [...atuais, item.valor]
                  setValor(novo)
                  salvar(novo)
                }} />
              )
            })}
          </PopoverContent>
        </PopoverPessoas>
      )
    }
    return <select multiple className={`${campo} min-h-20 py-1.5 text-corpo`} value={atuais} disabled={pendente} onChange={(e) => { const novo = Array.from(e.target.selectedOptions, (o) => o.value); setValor(novo); salvar(novo) }}>{itens.map((item) => <option key={item.valor} value={item.valor}>{item.nome}</option>)}</select>
  }
  if (['files', 'relationship', 'tasks'].includes(definicao.tipo)) {
    if (compacto) return <input className={classe} value={Array.isArray(valor) ? valor.map(String).join(', ') : ''} placeholder="Adicionar referências…" onChange={(e) => setValor(e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} onBlur={() => salvar()} />
    return <div className="flex gap-2"><textarea className={`${campo} min-h-16 py-2 text-corpo`} value={paraTexto(valor)} placeholder={definicao.tipo === 'files' ? 'Uma URL de arquivo por linha' : 'Um identificador ou referência por linha'} onChange={(e) => setValor(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} /><button type="button" aria-label={`Salvar ${definicao.nome}`} disabled={pendente} className={`${botaoSecundario} self-end px-3`} onClick={() => salvar()}><Save className="h-3.5 w-3.5" /></button></div>
  }
  if (definicao.tipo === 'long_text') {
    if (compacto) return <input className={classe} value={paraTexto(valor)} placeholder={definicao.configuracao.placeholder} onChange={(e) => setValor(e.target.value)} onBlur={() => salvar()} />
    return <textarea className={`${campo} min-h-20 py-2 text-corpo`} value={paraTexto(valor)} placeholder={definicao.configuracao.placeholder} onChange={(e) => setValor(e.target.value)} onBlur={() => salvar()} />
  }
  if (['number', 'money', 'rating', 'progress_manual', 'vote'].includes(definicao.tipo)) {
    const max = definicao.tipo === 'rating' ? definicao.configuracao.max ?? 5 : definicao.tipo === 'progress_manual' ? 100 : undefined
    return <div className="flex items-center gap-2"><input type="number" min={definicao.tipo === 'progress_manual' || definicao.tipo === 'rating' || definicao.tipo === 'vote' ? 0 : undefined} max={max} step={definicao.tipo === 'money' ? 0.01 : 'any'} className={classe} value={typeof valor === 'number' ? valor : ''} placeholder={definicao.configuracao.placeholder} onChange={(e) => setValor(e.target.value === '' ? null : Number(e.target.value))} onBlur={() => salvar()} />{definicao.tipo === 'money' && typeof valor === 'number' && <span className="shrink-0 text-xs text-texto-3">{formatarValorCampo(definicao, valor)}</span>}</div>
  }

  const tipoInput = definicao.tipo === 'date' ? 'date' : definicao.tipo === 'email' ? 'email' : definicao.tipo === 'phone' ? 'tel' : definicao.tipo === 'site' ? 'url' : 'text'
  const placeholder = definicao.configuracao.placeholder ?? (definicao.tipo === 'instagram' ? '@usuario' : definicao.tipo === 'tiktok' ? '@usuario' : definicao.tipo === 'location' ? 'Endereço ou coordenadas' : undefined)
  return <input type={tipoInput} className={classe} value={paraTexto(valor)} placeholder={placeholder} onChange={(e) => setValor(e.target.value)} onBlur={() => salvar()} />
}

/** Editor compacto usado nas colunas da visão de lista. */
export function CelulaCampoPersonalizado({ tarefaId, definicao, equipe }: { tarefaId: string; definicao: DefinicaoCampo; equipe: Pessoa[] }) {
  return <CampoEditavel aoSalvar={(valor) => salvarValorCampo(tarefaId, definicao.id, valor)} definicao={definicao} equipe={equipe} compacto />
}

/** Mesmo editor, mas só devolve o valor (não grava): usado na edição em lote. */
export function EditorValorCampo({ definicao, equipe, aoMudar }: { definicao: DefinicaoCampo; equipe: Pessoa[]; aoMudar: (valor: Json | null) => void }) {
  return <CampoEditavel aoSalvar={async (valor) => { aoMudar(valor); return null }} definicao={definicao} equipe={equipe} />
}

/** Recebe a lista já filtrada (a SecaoCampos decide quais mostrar). */
export function CamposPersonalizados({ tarefaId, campos, equipe }: { tarefaId: string; campos: DefinicaoCampo[]; equipe: Pessoa[] }) {
  if (campos.length === 0) return null
  return (
    <div className="divide-y divide-borda rounded-lg border border-borda bg-white">
      {campos.map((item) => (
        <div key={item.id} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[150px_1fr] sm:items-center">
          <div className="flex min-w-0 items-center gap-2 text-corpo font-medium"><span style={{ color: item.cor }}><IconeVisual icone={item.icone} className="h-4 w-4" /></span><span className="truncate">{item.nome}</span></div>
          <CampoEditavel aoSalvar={(valor) => salvarValorCampo(tarefaId, item.id, valor)} definicao={item} equipe={equipe} />
        </div>
      ))}
    </div>
  )
}
