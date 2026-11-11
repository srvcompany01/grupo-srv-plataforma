'use client'

import { Search } from 'lucide-react'
import { useState, useTransition } from 'react'
import { atualizarCampoGestaoAcao, criarCampoGestaoAcao } from '@/app/(app)/config/campos/acoes'
import { IconeVisual } from '@/componentes/IconeVisual'
import { normalizarHex, type Local } from '@/dominio/campos-gestao'
import { CATALOGO_CAMPOS, configuracaoPadrao, type ConfigCampo, type ItemCatalogoCampo } from '@/dominio/personalizacao'
import type { CampoGestao, ListaGestao } from '@/servicos/campos-gestao'
import { avisar } from './avisar'
import { Catalogo, ConfiguracaoCampo } from './GerenciarCampos'
import { AparenciaCampo } from './AparenciaCampo'

export const RAIZ = 'raiz'

export type Alvo = { tipo: 'novo' } | { tipo: 'editar'; campo: CampoGestao }

export function EditorCampo({ alvo, espacos, listas, campos, aoFechar }: { alvo: Alvo; espacos: Local[]; listas: ListaGestao[]; campos: CampoGestao[]; aoFechar: () => void }) {
  const editando = alvo.tipo === 'editar' ? alvo.campo : null
  const [item, setItem] = useState<ItemCatalogoCampo | null>(editando ? (CATALOGO_CAMPOS.find((i) => i.tipo === editando.tipo) ?? null) : null)
  const [busca, setBusca] = useState('')
  const [nome, setNome] = useState(editando?.nome ?? '')
  const [cor, setCor] = useState(editando?.cor ?? '#70262d')
  const [icone, setIcone] = useState(editando?.icone ?? '')
  const [config, setConfig] = useState<ConfigCampo>(editando?.configuracao ?? {})
  const [espaco, setEspaco] = useState<string>(editando ? (editando.espacoId ?? RAIZ) : (espacos[0]?.id ?? RAIZ))
  const [listaIds, setListaIds] = useState<string[]>(editando?.listaIds ?? [])
  const [pendente, iniciar] = useTransition()
  const espacoId = espaco === RAIZ ? null : espaco
  const listasDoEspaco = listas.filter((l) => l.espacoId === espacoId)

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
      <div>
        <div><Search /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar tipos de campo" /></div>
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
    <form onSubmit={(e) => { e.preventDefault(); salvar() }}>
      {!editando && <button type="button" onClick={() => setItem(null)}>← Voltar aos tipos</button>}
      <div>
        <span style={{ color: cor }}>{(icone || item.icone) === 'nenhum' ? <span>{nome.trim().charAt(0).toUpperCase() || 'A'}</span> : <IconeVisual icone={icone || item.icone} />}</span>
        <div><p>{item.nome}</p><p>{editando ? 'O tipo não pode ser alterado depois de criado.' : item.descricao}</p></div>
      </div>
      <label><span>Nome do campo</span><input autoFocus required maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} /></label>
      <ConfiguracaoCampo item={item} config={config} onChange={setConfig} campos={campos.filter((c) => c.espacoId === espacoId && c.id !== editando?.id)} />
      <AparenciaCampo cor={cor} aoMudarCor={setCor} icone={icone} aoMudarIcone={setIcone} iconePadrao={item.icone} />
      <label>
        <span>Espaço</span>
        <select disabled={!!editando} value={espaco} onChange={(e) => { setEspaco(e.target.value); setListaIds([]) }}>
          <option value={RAIZ}>Raiz (sem espaço)</option>
          {espacos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </label>
      <fieldset>
        <legend>Listas onde o campo aparece ({listaIds.length})</legend>
        <div>
          {listasDoEspaco.map((l) => (
            <label key={l.id}><input type="checkbox" checked={listaIds.includes(l.id)} onChange={() => alternarLista(l.id)} />{l.caminho}</label>
          ))}
          {listasDoEspaco.length === 0 && <p>Este espaço ainda não tem listas.</p>}
        </div>
      </fieldset>
      <div><button type="button" onClick={aoFechar}>Cancelar</button><button disabled={pendente || !nome.trim() || normalizarHex(cor) === null}>{pendente ? 'Salvando…' : editando ? 'Salvar' : 'Criar campo'}</button></div>
    </form>
  )
}

