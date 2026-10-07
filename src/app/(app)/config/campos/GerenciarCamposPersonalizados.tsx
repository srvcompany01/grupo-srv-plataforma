'use client'

import { Archive, Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { IconeVisual } from '@/componentes/IconeVisual'
import { avisar } from '@/componentes/tarefas/avisar'
import { Catalogo, ConfiguracaoCampo } from '@/componentes/tarefas/GerenciarCampos'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { normalizarHex, type Local } from '@/dominio/campos-gestao'
import { CATALOGO_CAMPOS, configuracaoPadrao, CORES_PERSONALIZACAO, ICONES_PERSONALIZACAO, type ConfigCampo, type ItemCatalogoCampo } from '@/dominio/personalizacao'
import { botaoPrimario, botaoSecundario, campo as estiloCampo, rotulo } from '@/lib/ui'
import type { CampoGestao, DadosGestaoCampos, ListaGestao } from '@/servicos/campos-gestao'
import { arquivarCampoGestaoAcao, atualizarCampoGestaoAcao, criarCampoGestaoAcao } from './acoes'

const nomeDoTipo = (tipo: string) => CATALOGO_CAMPOS.find((i) => i.tipo === tipo)?.nome ?? tipo
const RAIZ = 'raiz'

function SeletorCor({ cor, onChange }: { cor: string; onChange: (cor: string) => void }) {
  const [texto, setTexto] = useState(cor)
  const valido = normalizarHex(texto) !== null
  const aplicar = (valor: string) => {
    setTexto(valor)
    const hex = normalizarHex(valor)
    if (hex) onChange(hex)
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {CORES_PERSONALIZACAO.map((c) => (
          <button key={c} type="button" aria-label={`Cor ${c}`} onClick={() => aplicar(c)} className={`h-6 w-6 rounded-full border-2 ${normalizarHex(texto) === c ? 'border-texto' : 'border-white ring-1 ring-borda'}`} style={{ background: c }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" aria-label="Escolher cor" value={normalizarHex(texto) ?? cor} onChange={(e) => aplicar(e.target.value)} className="h-9 w-10 cursor-pointer rounded-md border border-borda bg-white p-1" />
        <input value={texto} onChange={(e) => aplicar(e.target.value)} maxLength={7} placeholder="#D11A22" aria-label="Cor em HEX" aria-invalid={!valido} className={`${estiloCampo} w-32 font-mono ${valido ? '' : 'border-rose-300'}`} />
        {!valido && <span className="text-xs text-rose-600">Use #RRGGBB</span>}
      </div>
    </div>
  )
}

type Alvo = { tipo: 'novo' } | { tipo: 'editar'; campo: CampoGestao }

function Editor({ alvo, espacos, listas, campos, aoFechar }: { alvo: Alvo; espacos: Local[]; listas: ListaGestao[]; campos: CampoGestao[]; aoFechar: () => void }) {
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

export function GerenciarCamposPersonalizados({ campos, espacos, listas }: DadosGestaoCampos) {
  const [busca, setBusca] = useState('')
  const [filtroEspaco, setFiltroEspaco] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [alvo, setAlvo] = useState<Alvo | null>(null)
  const [pendente, iniciar] = useTransition()
  const caminhos = useMemo(() => new Map(listas.map((l) => [l.id, l.caminho])), [listas])
  const termo = busca.toLocaleLowerCase('pt-BR')
  const visiveis = campos.filter((c) =>
    c.nome.toLocaleLowerCase('pt-BR').includes(termo) &&
    (filtroTipo === 'todos' || c.tipo === filtroTipo) &&
    (filtroEspaco === 'todos' || (filtroEspaco === RAIZ ? c.espacoId === null : c.espacoId === filtroEspaco)),
  )
  const tipos = [...new Set(visiveis.map((c) => c.tipo))]
  const arquivar = (c: CampoGestao) => {
    if (!confirm(`Arquivar "${c.nome}"? Ele some das listas, mas os valores já preenchidos nas tarefas são preservados.`)) return
    iniciar(async () => void avisar(await arquivarCampoGestaoAcao(c.id), true))
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-3" /><input className={`${estiloCampo} pl-9`} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar campos" /></div>
        <select aria-label="Filtrar por espaço" value={filtroEspaco} onChange={(e) => setFiltroEspaco(e.target.value)} className={`${estiloCampo} w-auto`}>
          <option value="todos">Todos os espaços</option><option value={RAIZ}>Raiz</option>
          {espacos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select aria-label="Filtrar por tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={`${estiloCampo} w-auto`}>
          <option value="todos">Todos os tipos</option>
          {CATALOGO_CAMPOS.map((i) => <option key={i.tipo} value={i.tipo}>{i.nome}</option>)}
        </select>
        <button type="button" className={botaoPrimario} onClick={() => setAlvo({ tipo: 'novo' })}><Plus className="h-4 w-4" /> Criar novo</button>
      </div>

      {tipos.map((tipo) => (
        <section key={tipo} className="overflow-hidden rounded-xl border border-borda bg-white">
          <h2 className="border-b border-borda bg-fundo px-3 py-2 text-[12px] font-semibold">{nomeDoTipo(tipo)} <span className="font-normal text-texto-3">{visiveis.filter((c) => c.tipo === tipo).length}</span></h2>
          <ul>
            {visiveis.filter((c) => c.tipo === tipo).map((c) => (
              <li key={c.id} className="flex flex-wrap items-start gap-3 border-t border-borda px-3 py-2.5 first:border-t-0">
                <span className="mt-0.5" style={{ color: c.cor }}><IconeVisual icone={c.icone} className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[13px] font-medium">{c.nome} <span className="font-normal text-texto-3">· {c.espaco}</span></p>
                  <div className="flex flex-wrap gap-1">
                    {c.listaIds.length === 0 && <span className="text-[11px] text-texto-3">Não está em nenhuma lista</span>}
                    {c.listaIds.map((id) => <span key={id} className="rounded-full bg-hover px-2 py-0.5 text-[11px] text-texto-2">{caminhos.get(id) ?? 'Lista removida'}</span>)}
                  </div>
                </div>
                <span className="h-4 w-4 rounded-full ring-1 ring-borda" style={{ background: c.cor }} title={c.cor} />
                <button type="button" aria-label={`Editar ${c.nome}`} title="Editar" onClick={() => setAlvo({ tipo: 'editar', campo: c })} className="rounded-lg p-2 text-texto-3 transition hover:bg-hover hover:text-texto"><Pencil className="h-4 w-4" /></button>
                <button type="button" disabled={pendente} aria-label={`Arquivar ${c.nome}`} title="Arquivar" onClick={() => arquivar(c)} className="rounded-lg p-2 text-texto-3 transition hover:bg-rose-50 hover:text-rose-600"><Archive className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {visiveis.length === 0 && <p className="rounded-xl border border-dashed border-borda px-4 py-10 text-center text-[13px] text-texto-3">{campos.length === 0 ? 'Nenhum campo criado ainda.' : 'Nenhum campo encontrado com esses filtros.'}</p>}

      <Dialog open={alvo !== null} onOpenChange={(aberto) => !aberto && setAlvo(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{alvo?.tipo === 'editar' ? 'Editar campo' : 'Novo campo personalizado'}</DialogTitle><DialogDescription>Defina o tipo, a cor e as listas onde o campo aparece.</DialogDescription></DialogHeader>
          {alvo && <Editor key={alvo.tipo === 'editar' ? alvo.campo.id : 'novo'} alvo={alvo} espacos={espacos} listas={listas} campos={campos} aoFechar={() => setAlvo(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
