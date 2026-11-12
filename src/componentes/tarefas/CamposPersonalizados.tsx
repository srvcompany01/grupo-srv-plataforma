'use client'

import { Ic } from '@/componentes/app/Ic'
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
import type { Resultado } from '@/servicos/acao'

function paraTexto(valor: Json | null | undefined) {
  if (Array.isArray(valor)) return valor.map(String).join('\n')
  return valor == null ? '' : String(valor)
}

/** Ícone de cada valor da Máquina de Conteúdo (protótipo da Leva 1); os demais valores usam um ponto na cor da opção. */
const ICONE_OPCAO: Record<string, [string, string]> = {
  'Desejo': ['favorite', '#e11d48'], 'Autoridade': ['school', '#7c3aed'], 'Identificação': ['diversity_3', '#e0620d'], 'Transformação': ['autorenew', '#1d6fe0'],
  'Prova Social': ['groups', '#0d9488'], 'Curiosidade': ['visibility', '#b45309'], 'Crescer Seguidores': ['trending_up', '#16a34a'], 'Gerar Autoridade': ['workspace_premium', '#7c3aed'],
  'Gerar Venda': ['payments', '#e08a00'], 'Engajamento': ['favorite', '#db2777'], 'Alcance': ['donut_large', '#1d6fe0'], 'Conversão': ['shopping_bag', '#16a34a'],
  'Institucional': ['apartment', '#71717a'], 'Fria': ['ac_unit', '#1d6fe0'], 'Quente': ['local_fire_department', '#e0620d'], 'Reels': ['movie', '#d80d12'],
  'Carrossel': ['view_carousel', '#7c3aed'], 'Estático': ['image', '#0d9488'], 'Stories': ['amp_stories', '#db2777'],
}
const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const ICONE_POR_CHAVE = new Map(Object.entries(ICONE_OPCAO).map(([k, v]) => [semAcento(k), v]))

function Pilula({ nome, cor }: { nome: string; cor: string }) {
  const ic = ICONE_POR_CHAVE.get(semAcento(nome))
  return (
    <span className="pilula-opcao">
      {ic ? <Ic n={ic[0]} s={15} fill style={{ color: ic[1] }} /> : <span className="pilula-opcao-ponto" style={{ background: cor }} />}
      <span>{nome}</span>
    </span>
  )
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
      <PopoverTrigger disabled={pendente}>
        <span>{atuais.length ? atuais.map((o) => <Pilula key={o} nome={o} cor={corDaOpcao(definicao.configuracao, o)} />) : <span>{compacto ? '—' : 'Sem seleção'}</span>}</span>
        <ChevronDown />
      </PopoverTrigger>
      <PopoverContent align="start">
        <TituloMenu>{definicao.nome}</TituloMenu>
        {opcoes.length === 0 && <p>Nenhuma opção configurada.</p>}
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
  const somenteLeitura = definicao.tipo === 'formula' || definicao.tipo === 'progress_auto'

  if (somenteLeitura) {
    return <div>{formatarValorCampo(definicao, valor)}</div>
  }
  if (definicao.tipo === 'button') {
    const href = definicao.configuracao.buttonUrl
    return href ? <a href={href} target="_blank" rel="noreferrer">{definicao.configuracao.buttonLabel ?? 'Abrir'} <ExternalLink /></a> : <span>Configure uma URL para este botão.</span>
  }
  if (definicao.tipo === 'checkbox') {
    return <label><input type="checkbox" checked={valor === true} disabled={pendente} onChange={(e) => { setValor(e.target.checked); salvar(e.target.checked) }} />{valor === true ? 'Sim' : 'Não'}</label>
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
          <PopoverTrigger>
            <span>{atuais.length ? itens.filter((item) => atuais.includes(item.valor)).map((item) => item.nome).join(', ') : '—'}</span>
            <ChevronDown />
          </PopoverTrigger>
          <PopoverContent align="start">
            <TituloMenu>{definicao.nome}</TituloMenu>
            <OpcaoMenu suave rotulo="Vazio" marcado={atuais.length === 0} desabilitado={pendente} aoClicar={() => { setValor([]); salvar([]) }} />
            {itens.length === 0 && <p>Nenhuma pessoa disponível.</p>}
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
    return <select multiple value={atuais} disabled={pendente} onChange={(e) => { const novo = Array.from(e.target.selectedOptions, (o) => o.value); setValor(novo); salvar(novo) }}>{itens.map((item) => <option key={item.valor} value={item.valor}>{item.nome}</option>)}</select>
  }
  if (['files', 'relationship', 'tasks'].includes(definicao.tipo)) {
    if (compacto) return <input value={Array.isArray(valor) ? valor.map(String).join(', ') : ''} placeholder="Adicionar referências…" onChange={(e) => setValor(e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} onBlur={() => salvar()} />
    return <div><textarea value={paraTexto(valor)} placeholder={definicao.tipo === 'files' ? 'Uma URL de arquivo por linha' : 'Um identificador ou referência por linha'} onChange={(e) => setValor(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} /><button type="button" aria-label={`Salvar ${definicao.nome}`} disabled={pendente} onClick={() => salvar()}><Save /></button></div>
  }
  if (definicao.tipo === 'long_text') {
    if (compacto) return <input value={paraTexto(valor)} placeholder={definicao.configuracao.placeholder} onChange={(e) => setValor(e.target.value)} onBlur={() => salvar()} />
    return <textarea value={paraTexto(valor)} placeholder={definicao.configuracao.placeholder} onChange={(e) => setValor(e.target.value)} onBlur={() => salvar()} />
  }
  if (['number', 'money', 'rating', 'progress_manual', 'vote'].includes(definicao.tipo)) {
    const max = definicao.tipo === 'rating' ? definicao.configuracao.max ?? 5 : definicao.tipo === 'progress_manual' ? 100 : undefined
    return <div><input type="number" min={definicao.tipo === 'progress_manual' || definicao.tipo === 'rating' || definicao.tipo === 'vote' ? 0 : undefined} max={max} step={definicao.tipo === 'money' ? 0.01 : 'any'} value={typeof valor === 'number' ? valor : ''} placeholder={definicao.configuracao.placeholder} onChange={(e) => setValor(e.target.value === '' ? null : Number(e.target.value))} onBlur={() => salvar()} />{definicao.tipo === 'money' && typeof valor === 'number' && <span>{formatarValorCampo(definicao, valor)}</span>}</div>
  }

  const tipoInput = definicao.tipo === 'date' ? 'date' : definicao.tipo === 'email' ? 'email' : definicao.tipo === 'phone' ? 'tel' : definicao.tipo === 'site' ? 'url' : 'text'
  const placeholder = definicao.configuracao.placeholder ?? (definicao.tipo === 'instagram' ? '@usuario' : definicao.tipo === 'tiktok' ? '@usuario' : definicao.tipo === 'location' ? 'Endereço ou coordenadas' : undefined)
  return <input type={tipoInput} value={paraTexto(valor)} placeholder={placeholder} onChange={(e) => setValor(e.target.value)} onBlur={() => salvar()} />
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
    <div>
      {campos.map((item) => (
        <div key={item.id}>
          <div><span style={{ color: item.cor }}><IconeVisual icone={item.icone} /></span><span>{item.nome}</span></div>
          <CampoEditavel aoSalvar={(valor) => salvarValorCampo(tarefaId, item.id, valor)} definicao={item} equipe={equipe} />
        </div>
      ))}
    </div>
  )
}
