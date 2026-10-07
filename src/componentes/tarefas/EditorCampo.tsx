'use client'

import { Search } from 'lucide-react'
import { useState, useTransition } from 'react'
import { atualizarCampoGestaoAcao, criarCampoGestaoAcao } from '@/app/(app)/config/campos/acoes'
import { IconeVisual } from '@/componentes/IconeVisual'
import { normalizarHex, type Local } from '@/dominio/campos-gestao'
import { CATALOGO_CAMPOS, configuracaoPadrao, ICONES_PERSONALIZACAO, type ConfigCampo, type ItemCatalogoCampo } from '@/dominio/personalizacao'
import { botaoPrimario, botaoSecundario, campo as estiloCampo, rotulo } from '@/lib/ui'
import type { CampoGestao, ListaGestao } from '@/servicos/campos-gestao'
import { avisar } from './avisar'
import { Catalogo, ConfiguracaoCampo } from './GerenciarCampos'
import { SeletorCor } from './SeletorCor'

export const RAIZ = 'raiz'

export type Alvo = { tipo: 'novo' } | { tipo: 'editar'; campo: CampoGestao }

export function EditorCampo({ alvo, espacos, listas, campos, aoFechar }: { alvo: Alvo; espacos: Local[]; listas: ListaGestao[]; campos: CampoGestao[]; aoFechar: () => void }) {
  const editando = alvo.tipo === 'editar' ? alvo.campo : null
  const [item, setItem] = useState<ItemCatalogoCampo | null>(editando ? (CATALOGO_CAMPOS.find((i) => i.tipo === editando.tipo) ?? null) : null)
  const [busca, setBusca] = useState('')
  const [nome, setNome] = useState(editando?.nome ?? '')
  const [cor, setCor] = useState(editando?.cor ?? '#d11a22')
  const [icone, setIcone] = useState(editando?.icone ?? '')
  const [config, setConfig] = useState<ConfigCampo>(editando?.configuracao ?? {})
  const [espaco, setEspaco] = useState<string>(editando ? (editando.espacoId ?? RAIZ) : (espacos[0]?.id ?? RAIZ))
  const [listaIds, setListaIds] = useState<string[]>(editando?.listaIds ?? [])
  const [pendente, iniciar] = useTransition()
  const espacoId = espaco === RAIZ ? null : espaco
  const listasDoEspaco = listas.filter((l) => l.espacoId === espacoId)
  const icones = item ? [...new Set([item.icone, ...ICONES_PERSONALIZACAO])] : []

  const escolher = (novo: ItemCatalogoCampo) => {
    setItem(novo)
    setNome(novo.nome)
    setCor(novo.cor)
    setIcone(novo.icone)
    setConfig(configuracaoPadrao(novo.tipo))
  }
  const alternarLista = (id: string) => setListaIds((atuais) => (atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id]))

  if (!item) {
    return (
      <div className="space-y-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-3" /><input className={`${estiloCampo} pl-9`} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar tipos de campo" /></div>
        <Catalogo busca={busca} onSelect={escolher} />
      </div>
    )
  }
  const salvar = () =>
    iniciar(async () => {
      const entrada = { nome, cor, icone: icone || item.icone, configuracao: config, listaIds }
      const r = editando ? await atualizarCampoGestaoAcao(editando.id, entrada) : await criarCampoGestaoAcao(espacoId, item.tipo, entrada)
      if (avisar(r, true)) aoFechar()
    })
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); salvar() }}>
      {!editando && <button type="button" className="text-xs font-semibold text-marca hover:underline" onClick={() => setItem(null)}>← Voltar aos tipos</button>}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-fundo" style={{ color: cor }}><IconeVisual icone={icone || item.icone} className="h-6 w-6" /></span>
        <div><p className="font-semibold">{item.nome}</p><p className="text-xs text-texto-3">{editando ? 'O tipo não pode ser alterado depois de criado.' : item.descricao}</p></div>
      </div>
      <label className="block space-y-1"><span className={rotulo}>Nome do campo</span><input autoFocus required maxLength={80} className={estiloCampo} value={nome} onChange={(e) => setNome(e.target.value)} /></label>
      <ConfiguracaoCampo item={item} config={config} onChange={setConfig} campos={campos.filter((c) => c.espacoId === espacoId && c.id !== editando?.id)} />
      <div className="space-y-1"><span className={rotulo}>Cor</span><SeletorCor cor={cor} onChange={setCor} /></div>
      <div className="space-y-1">
        <span className={rotulo}>Ícone</span>
        <div className="flex flex-wrap gap-1">
          {icones.map((nomeIcone) => (
            <button key={nomeIcone} type="button" aria-label={`Ícone ${nomeIcone}`} onClick={() => setIcone(nomeIcone)} className={`flex h-8 w-8 items-center justify-center rounded-lg border ${(icone || item.icone) === nomeIcone ? 'border-texto bg-hover' : 'border-borda hover:bg-hover'}`} style={{ color: cor }}><IconeVisual icone={nomeIcone} className="h-4 w-4" /></button>
          ))}
        </div>
      </div>
      <label className="block space-y-1">
        <span className={rotulo}>Espaço</span>
        <select disabled={!!editando} value={espaco} onChange={(e) => { setEspaco(e.target.value); setListaIds([]) }} className={estiloCampo}>
          <option value={RAIZ}>Raiz (sem espaço)</option>
          {espacos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </label>
      <fieldset className="space-y-1">
        <legend className={rotulo}>Listas onde o campo aparece ({listaIds.length})</legend>
        <div className="max-h-44 space-y-1 overflow-y-auto">
          {listasDoEspaco.map((l) => (
            <label key={l.id} className="flex items-center gap-2 rounded-lg border border-borda px-3 py-2 text-sm"><input type="checkbox" checked={listaIds.includes(l.id)} onChange={() => alternarLista(l.id)} className="accent-marca" />{l.caminho}</label>
          ))}
          {listasDoEspaco.length === 0 && <p className="rounded-lg bg-fundo p-3 text-xs text-texto-3">Este espaço ainda não tem listas.</p>}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2"><button type="button" className={botaoSecundario} onClick={aoFechar}>Cancelar</button><button disabled={pendente || !nome.trim() || normalizarHex(cor) === null} className={botaoPrimario}>{pendente ? 'Salvando…' : editando ? 'Salvar' : 'Criar campo'}</button></div>
    </form>
  )
}

