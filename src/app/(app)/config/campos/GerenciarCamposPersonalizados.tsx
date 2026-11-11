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
    <div>
      <div>
        <div><Search /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar campos" /></div>
        <select aria-label="Filtrar por espaço" value={filtroEspaco} onChange={(e) => setFiltroEspaco(e.target.value)}>
          <option value="todos">Todos os espaços</option><option value={RAIZ}>Raiz</option>
          {espacos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select aria-label="Filtrar por tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          {CATALOGO_CAMPOS.map((i) => <option key={i.tipo} value={i.tipo}>{i.nome}</option>)}
        </select>
        <button type="button" onClick={() => setAlvo({ tipo: 'novo' })}><Plus /> Criar novo</button>
      </div>

      {tipos.map((tipo) => (
        <section key={tipo}>
          <h2>{nomeDoTipo(tipo)} <span>{visiveis.filter((c) => c.tipo === tipo).length}</span></h2>
          <ul>
            {visiveis.filter((c) => c.tipo === tipo).map((c) => (
              <li key={c.id}>
                <span style={{ color: c.cor }}><IconeVisual icone={c.icone} /></span>
                <div>
                  <p>{c.nome} <span>· {c.espaco}</span></p>
                  <div>
                    {c.listaIds.length === 0 && <span>Não está em nenhuma lista</span>}
                    {c.listaIds.map((id) => <span key={id}>{caminhos.get(id) ?? 'Lista removida'}</span>)}
                  </div>
                </div>
                <span style={{ background: c.cor }} title={c.cor} />
                <button type="button" aria-label={`Editar ${c.nome}`} title="Editar" onClick={() => setAlvo({ tipo: 'editar', campo: c })}><Pencil /></button>
                <button type="button" disabled={pendente} aria-label={`Arquivar ${c.nome}`} title="Arquivar" onClick={() => arquivar(c)}><Archive /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {visiveis.length === 0 && <EstadoVazio icone={SlidersHorizontal} titulo={campos.length === 0 ? 'Nenhum campo criado ainda' : 'Nenhum campo encontrado'} descricao={campos.length === 0 ? 'Crie o primeiro campo em "Criar novo".' : 'Ajuste a busca ou os filtros.'} />}

      <Dialog open={alvo !== null} onOpenChange={(aberto) => !aberto && setAlvo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{alvo?.tipo === 'editar' ? 'Editar campo' : 'Novo campo personalizado'}</DialogTitle><DialogDescription>Defina o tipo, a cor e as listas onde o campo aparece.</DialogDescription></DialogHeader>
          {alvo && <EditorCampo key={alvo.tipo === 'editar' ? alvo.campo.id : 'novo'} alvo={alvo} espacos={espacos} listas={listas} campos={campos} aoFechar={() => setAlvo(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
