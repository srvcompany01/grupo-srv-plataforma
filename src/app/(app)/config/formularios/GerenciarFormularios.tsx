'use client'

import { Archive, ClipboardList, Copy, CopyPlus, ExternalLink, Pencil, Plus, Search } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Interruptor } from '@/componentes/ui/interruptor'
import type { DadosFormularios, Formulario } from '@/servicos/formularios'
import { alternarFormularioAcao, arquivarFormularioAcao, duplicarFormularioAcao } from './acoes'
import s from './formularios.module.css'
import { EstudioFormulario } from './EstudioFormulario'

export function GerenciarFormularios({ formularios, listas, clientes, equipe }: DadosFormularios) {
  const [editando, setEditando] = useState<Formulario | 'novo' | null>(null)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('todos')
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const caminhos = new Map(listas.map((l) => [l.id, l.caminho]))
  const pessoas = new Map(equipe.map((p) => [p.id, p.nome]))
  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  const visiveis = formularios.filter((f) =>
    (status === 'todos' || (status === 'ativos' ? f.ativo : !f.ativo)) &&
    [f.nome, f.descricao, caminhos.get(f.listaId), f.landing].some((v) => v?.toLocaleLowerCase('pt-BR').includes(termo)),
  )
  const podeCriar = listas.length > 0 && equipe.length > 0
  const ativos = formularios.filter((f) => f.ativo).length

  const copiar = async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/f/${token}`)
      avisar({ ok: 'Link copiado.' }, true)
    } catch {
      avisar({ erro: 'Não foi possível copiar. Abra o formulário e copie o endereço do navegador.' })
    }
  }
  const arquivar = async (f: Formulario) => {
    if (!(await confirmar({ titulo: `Arquivar "${f.nome}"?`, descricao: 'O link deixa de funcionar. As tarefas já criadas continuam nas listas.', confirmar: 'Arquivar', perigo: true }))) return
    iniciar(async () => void avisar(await arquivarFormularioAcao(f.id), true))
  }

  return (
    <section className={s.pagina} aria-labelledby="titulo-formularios">
      <header className={s.cabecalho}>
        <div>
          <h2 id="titulo-formularios">Formulários</h2>
          <p>Receba pedidos e briefings por um link público. Cada envio vira uma tarefa na lista escolhida.</p>
        </div>
        <Button disabled={!podeCriar || pendente} onClick={() => setEditando('novo')}><Plus aria-hidden /> Novo formulário</Button>
      </header>
      {!podeCriar && <p className={s.aviso} role="status">{!listas.length ? 'Crie uma lista antes de montar um formulário.' : 'Cadastre uma pessoa ativa na equipe para receber as tarefas.'}</p>}
      <div className={s.barra}>
        <div className={s.busca}><Search aria-hidden /><Input type="search" aria-label="Buscar formulários" placeholder="Buscar por nome, lista ou landing page…" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <select className={s.selecao} aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="todos">Todos os status</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option>
        </select>
        <span className={s.contagem} aria-live="polite">{visiveis.length} de {formularios.length} · {ativos} {ativos === 1 ? 'ativo' : 'ativos'}</span>
      </div>
      {!visiveis.length ? (
        <div className={s.vazio}>
          <span className={s.icone}><ClipboardList aria-hidden /></span>
          <h3>{formularios.length ? 'Nenhum formulário encontrado' : 'Seu próximo pedido começa aqui'}</h3>
          <p>{formularios.length ? 'Tente outro termo ou altere o filtro de status.' : 'Escolha a lista, defina os campos e compartilhe o link com seu cliente. Ele preenche sem precisar de login.'}</p>
          {formularios.length ? <Button variant="secondary" onClick={() => { setBusca(''); setStatus('todos') }}>Limpar filtros</Button> : <Button disabled={!podeCriar} onClick={() => setEditando('novo')}><Plus aria-hidden /> Criar primeiro formulário</Button>}
        </div>
      ) : (
        <ul className={s.lista}>
          {visiveis.map((f) => (
            <li key={f.id} className={s.cartao}>
              <span className={s.icone}><ClipboardList aria-hidden /></span>
              <div className={s.resumo}>
                <div className={s.titulo}><h3>{f.nome}</h3><span className={s.selo} data-ativo={f.ativo}>{!f.publicadoEm ? 'Rascunho' : f.ativo ? 'Publicado' : 'Inativo'}</span>{f.temRascunho && f.publicadoEm && <span className={s.selo}>Alterações não publicadas</span>}</div>
                {f.descricao && <p className={s.descricao}>{f.descricao}</p>}
                <p className={s.metadados}>{caminhos.get(f.listaId) ?? 'Lista indisponível'} · {f.campos.length} {f.campos.length === 1 ? 'campo' : 'campos'} · {f.totalRespostas} respostas</p>
                <p className={s.metadados}>Responsável: {pessoas.get(f.responsavelId) ?? 'Pessoa indisponível'}{f.landing ? ` · Landing: /${f.landing}` : ''}</p>
              </div>
              <div className={s.acoes}>
                <div className={s.ativacao}><Interruptor marcado={f.ativo} desabilitado={pendente || !f.publicadoEm} rotulo={`Ativar ${f.nome}`} aoMudar={(ativo) => iniciar(async () => void avisar(await alternarFormularioAcao(f.id, ativo), true))} /></div>
                {f.ativo && <Button variant="ghost" size="icon" asChild><a href={`/f/${f.token}`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${f.nome}`} title="Abrir formulário"><ExternalLink aria-hidden /></a></Button>}
                <Button variant="secondary" onClick={() => copiar(f.token)} aria-label={`Copiar link de ${f.nome}`}><Copy aria-hidden /> Copiar link</Button>
                <Button variant="ghost" size="icon" disabled={pendente} onClick={() => iniciar(async () => void avisar(await duplicarFormularioAcao(f.id), true))} aria-label={`Duplicar ${f.nome}`} title="Duplicar"><CopyPlus aria-hidden /></Button>
                <Button variant="ghost" size="icon" disabled={pendente} onClick={() => setEditando(f)} aria-label={`Editar ${f.nome}`} title="Editar"><Pencil aria-hidden /></Button>
                <Button variant="ghost" size="icon" disabled={pendente} onClick={() => arquivar(f)} aria-label={`Arquivar ${f.nome}`} title="Arquivar"><Archive aria-hidden /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editando && <EstudioFormulario key={editando === 'novo' ? 'novo' : editando.id} formulario={editando === 'novo' ? null : editando} dados={{ listas, clientes, equipe }} aoFechar={() => setEditando(null)} />}
    </section>
  )
}
