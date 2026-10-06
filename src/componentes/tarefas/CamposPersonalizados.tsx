'use client'

import { ExternalLink, Save } from 'lucide-react'
import { useState, useTransition } from 'react'
import { salvarValorCampo } from '@/app/(app)/acoes-campos'
import { IconeVisual } from '@/componentes/IconeVisual'
import { avisar } from '@/componentes/tarefas/avisar'
import { formatarValorCampo, type DefinicaoCampo } from '@/dominio/personalizacao'
import type { Pessoa } from '@/dominio/tarefas'
import type { Json } from '@/infra/supabase/tipos'
import { botaoSecundario, campo } from '@/lib/ui'

function paraTexto(valor: Json | null | undefined) {
  if (Array.isArray(valor)) return valor.map(String).join('\n')
  return valor == null ? '' : String(valor)
}

function CampoEditavel({ tarefaId, definicao, equipe }: { tarefaId: string; definicao: DefinicaoCampo; equipe: Pessoa[] }) {
  const [valor, setValor] = useState<Json | null>(definicao.valor ?? null)
  const [pendente, iniciar] = useTransition()
  const salvar = (novo: Json | null = valor) => iniciar(async () => void avisar(await salvarValorCampo(tarefaId, definicao.id, novo)))
  const classe = `${campo} h-8 py-1.5 text-[13px]`
  const opcoes = definicao.configuracao.options ?? []
  const somenteLeitura = definicao.tipo === 'formula' || definicao.tipo === 'progress_auto'

  if (somenteLeitura) {
    return <div className="flex h-8 items-center rounded-lg bg-fundo px-3 text-[13px] font-medium">{formatarValorCampo(definicao, valor)}</div>
  }
  if (definicao.tipo === 'button') {
    const href = definicao.configuracao.buttonUrl
    return href ? <a href={href} target="_blank" rel="noreferrer" className={botaoSecundario}>{definicao.configuracao.buttonLabel ?? 'Abrir'} <ExternalLink className="h-3.5 w-3.5" /></a> : <span className="text-xs text-texto-3">Configure uma URL para este botão.</span>
  }
  if (definicao.tipo === 'checkbox') {
    return <label className="inline-flex items-center gap-2 text-[13px]"><input type="checkbox" checked={valor === true} disabled={pendente} onChange={(e) => { setValor(e.target.checked); salvar(e.target.checked) }} />{valor === true ? 'Sim' : 'Não'}</label>
  }
  if (definicao.tipo === 'dropdown') {
    return <select className={classe} value={typeof valor === 'string' ? valor : ''} disabled={pendente} onChange={(e) => { setValor(e.target.value); salvar(e.target.value) }}><option value="">Sem seleção</option>{opcoes.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}</select>
  }
  if (definicao.tipo === 'labels' || definicao.tipo === 'people') {
    const itens = definicao.tipo === 'people' ? equipe.map((p) => ({ valor: p.id, nome: p.nome })) : opcoes.map((x) => ({ valor: x, nome: x }))
    const atuais = Array.isArray(valor) ? valor.map(String) : []
    return <select multiple className={`${campo} min-h-20 py-1.5 text-[13px]`} value={atuais} disabled={pendente} onChange={(e) => { const novo = Array.from(e.target.selectedOptions, (o) => o.value); setValor(novo); salvar(novo) }}>{itens.map((item) => <option key={item.valor} value={item.valor}>{item.nome}</option>)}</select>
  }
  if (['files', 'relationship', 'tasks'].includes(definicao.tipo)) {
    return <div className="flex gap-2"><textarea className={`${campo} min-h-16 py-2 text-[13px]`} value={paraTexto(valor)} placeholder={definicao.tipo === 'files' ? 'Uma URL de arquivo por linha' : 'Um identificador ou referência por linha'} onChange={(e) => setValor(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} /><button type="button" aria-label={`Salvar ${definicao.nome}`} disabled={pendente} className={`${botaoSecundario} self-end px-3`} onClick={() => salvar()}><Save className="h-3.5 w-3.5" /></button></div>
  }
  if (definicao.tipo === 'long_text') {
    return <textarea className={`${campo} min-h-20 py-2 text-[13px]`} value={paraTexto(valor)} placeholder={definicao.configuracao.placeholder} onChange={(e) => setValor(e.target.value)} onBlur={() => salvar()} />
  }
  if (['number', 'money', 'rating', 'progress_manual', 'vote'].includes(definicao.tipo)) {
    const max = definicao.tipo === 'rating' ? definicao.configuracao.max ?? 5 : definicao.tipo === 'progress_manual' ? 100 : undefined
    return <div className="flex items-center gap-2"><input type="number" min={definicao.tipo === 'progress_manual' || definicao.tipo === 'rating' || definicao.tipo === 'vote' ? 0 : undefined} max={max} step={definicao.tipo === 'money' ? 0.01 : 'any'} className={classe} value={typeof valor === 'number' ? valor : ''} placeholder={definicao.configuracao.placeholder} onChange={(e) => setValor(e.target.value === '' ? null : Number(e.target.value))} onBlur={() => salvar()} />{definicao.tipo === 'money' && typeof valor === 'number' && <span className="shrink-0 text-xs text-texto-3">{formatarValorCampo(definicao, valor)}</span>}</div>
  }

  const tipoInput = definicao.tipo === 'date' ? 'date' : definicao.tipo === 'email' ? 'email' : definicao.tipo === 'phone' ? 'tel' : definicao.tipo === 'site' ? 'url' : 'text'
  const placeholder = definicao.configuracao.placeholder ?? (definicao.tipo === 'instagram' ? '@usuario' : definicao.tipo === 'tiktok' ? '@usuario' : definicao.tipo === 'location' ? 'Endereço ou coordenadas' : undefined)
  return <input type={tipoInput} className={classe} value={paraTexto(valor)} placeholder={placeholder} onChange={(e) => setValor(e.target.value)} onBlur={() => salvar()} />
}

export function CamposPersonalizados({ tarefaId, campos, equipe }: { tarefaId: string; campos: DefinicaoCampo[]; equipe: Pessoa[] }) {
  if (campos.length === 0) return null
  return (
    <section className="space-y-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-texto-3">Campos personalizados</h2>
      <div className="divide-y divide-borda rounded-xl border border-borda bg-white">
        {campos.map((item) => (
          <div key={item.id} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[150px_1fr] sm:items-center">
            <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium"><span style={{ color: item.cor }}><IconeVisual icone={item.icone} className="h-4 w-4" /></span><span className="truncate">{item.nome}</span></div>
            <CampoEditavel tarefaId={tarefaId} definicao={item} equipe={equipe} />
          </div>
        ))}
      </div>
    </section>
  )
}
