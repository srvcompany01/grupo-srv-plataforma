'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Archive, Pencil, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { IconeVisual } from '@/componentes/IconeVisual'
import { avisar } from '@/componentes/tarefas/avisar'
import { EditorCampo, RAIZ, type Alvo } from '@/componentes/tarefas/EditorCampo'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { CATALOGO_CAMPOS } from '@/dominio/personalizacao'
import { botaoPrimario, campo as estiloCampo } from '@/lib/ui'
import type { CampoGestao, DadosGestaoCampos } from '@/servicos/campos-gestao'
import { arquivarCampoGestaoAcao } from './acoes'

const nomeDoTipo = (tipo: string) => CATALOGO_CAMPOS.find((i) => i.tipo === tipo)?.nome ?? tipo

export function GerenciarCamposPersonalizados({ campos, espacos, listas }: DadosGestaoCampos) {
  const [busca, setBusca] = useState('')
  const [filtroEspaco, setFiltroEspaco] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [alvo, setAlvo] = useState<Alvo | null>(null)
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const caminhos = useMemo(() => new Map(listas.map((l) => [l.id, l.caminho])), [listas])
  const termo = busca.toLocaleLowerCase('pt-BR')
  const visiveis = campos.filter((c) =>
    c.nome.toLocaleLowerCase('pt-BR').includes(termo) &&
    (filtroTipo === 'todos' || c.tipo === filtroTipo) &&
    (filtroEspaco === 'todos' || (filtroEspaco === RAIZ ? c.espacoId === null : c.espacoId === filtroEspaco)),
  )
  const tipos = [...new Set(visiveis.map((c) => c.tipo))]
  const arquivar = async (c: CampoGestao) => {
    if (!(await confirmar({ titulo: `Arquivar "${c.nome}"?`, descricao: 'Ele some das listas, mas os valores já preenchidos nas tarefas são preservados.', confirmar: 'Arquivar', perigo: true }))) return
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
        <section key={tipo} className="overflow-hidden rounded-lg border border-borda bg-white">
          <h2 className="border-b border-borda bg-fundo px-3 py-2 text-rotulo font-semibold">{nomeDoTipo(tipo)} <span className="font-normal text-texto-3">{visiveis.filter((c) => c.tipo === tipo).length}</span></h2>
          <ul>
            {visiveis.filter((c) => c.tipo === tipo).map((c) => (
              <li key={c.id} className="flex flex-wrap items-start gap-3 border-t border-borda px-3 py-2.5 first:border-t-0">
                <span className="mt-0.5" style={{ color: c.cor }}><IconeVisual icone={c.icone} className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-corpo font-medium">{c.nome} <span className="font-normal text-texto-3">· {c.espaco}</span></p>
                  <div className="flex flex-wrap gap-1">
                    {c.listaIds.length === 0 && <span className="text-legenda text-texto-3">Não está em nenhuma lista</span>}
                    {c.listaIds.map((id) => <span key={id} className="rounded-full bg-hover px-2 py-0.5 text-legenda text-texto-2">{caminhos.get(id) ?? 'Lista removida'}</span>)}
                  </div>
                </div>
                <span className="h-4 w-4 rounded-full ring-1 ring-borda" style={{ background: c.cor }} title={c.cor} />
                <button type="button" aria-label={`Editar ${c.nome}`} title="Editar" onClick={() => setAlvo({ tipo: 'editar', campo: c })} className="rounded-lg p-2 text-texto-3 transition hover:bg-hover hover:text-texto"><Pencil className="h-4 w-4" /></button>
                <button type="button" disabled={pendente} aria-label={`Arquivar ${c.nome}`} title="Arquivar" onClick={() => arquivar(c)} className="rounded-lg p-2 text-texto-3 transition hover:bg-perigo-fundo hover:text-perigo"><Archive className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {visiveis.length === 0 && <EstadoVazio icone={SlidersHorizontal} titulo={campos.length === 0 ? 'Nenhum campo criado ainda' : 'Nenhum campo encontrado'} descricao={campos.length === 0 ? 'Crie o primeiro campo em "Criar novo".' : 'Ajuste a busca ou os filtros.'} />}

      <Dialog open={alvo !== null} onOpenChange={(aberto) => !aberto && setAlvo(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{alvo?.tipo === 'editar' ? 'Editar campo' : 'Novo campo personalizado'}</DialogTitle><DialogDescription>Defina o tipo, a cor e as listas onde o campo aparece.</DialogDescription></DialogHeader>
          {alvo && <EditorCampo key={alvo.tipo === 'editar' ? alvo.campo.id : 'novo'} alvo={alvo} espacos={espacos} listas={listas} campos={campos} aoFechar={() => setAlvo(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
