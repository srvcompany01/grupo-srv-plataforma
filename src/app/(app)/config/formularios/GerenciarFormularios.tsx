'use client'

import { Archive, ArrowDown, ArrowUp, ClipboardList, Copy, ExternalLink, Pencil, Plus, Search } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { Button } from '@/componentes/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { Input } from '@/componentes/ui/input'
import { Interruptor } from '@/componentes/ui/interruptor'
import { Textarea } from '@/componentes/ui/textarea'
import type { CampoFormulario } from '@/dominio/formularios'
import { LANDINGS_COM_FORMULARIO } from '@/dominio/landings'
import type { DadosFormularios, Formulario } from '@/servicos/formularios'
import { alternarFormularioAcao, arquivarFormularioAcao, salvarFormularioAcao } from './acoes'
import s from './formularios.module.css'

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
                <div className={s.titulo}><h3>{f.nome}</h3><span className={s.selo} data-ativo={f.ativo}>{f.ativo ? 'Ativo' : 'Inativo'}</span></div>
                {f.descricao && <p className={s.descricao}>{f.descricao}</p>}
                <p className={s.metadados}>{caminhos.get(f.listaId) ?? 'Lista indisponível'} · {f.campos.length} {f.campos.length === 1 ? 'campo' : 'campos'}</p>
                <p className={s.metadados}>Responsável: {pessoas.get(f.responsavelId) ?? 'Pessoa indisponível'}{f.landing ? ` · Landing: /${f.landing}` : ''}</p>
              </div>
              <div className={s.acoes}>
                <div className={s.ativacao}><Interruptor marcado={f.ativo} desabilitado={pendente} rotulo={`Ativar ${f.nome}`} aoMudar={(ativo) => iniciar(async () => void avisar(await alternarFormularioAcao(f.id, ativo), true))} /></div>
                {f.ativo && <Button variant="ghost" size="icon" asChild><a href={`/f/${f.token}`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${f.nome}`} title="Abrir formulário"><ExternalLink aria-hidden /></a></Button>}
                <Button variant="secondary" onClick={() => copiar(f.token)} aria-label={`Copiar link de ${f.nome}`}><Copy aria-hidden /> Copiar link</Button>
                <Button variant="ghost" size="icon" disabled={pendente} onClick={() => setEditando(f)} aria-label={`Editar ${f.nome}`} title="Editar"><Pencil aria-hidden /></Button>
                <Button variant="ghost" size="icon" disabled={pendente} onClick={() => arquivar(f)} aria-label={`Arquivar ${f.nome}`} title="Arquivar"><Archive aria-hidden /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editando && <EditorFormulario key={editando === 'novo' ? 'novo' : editando.id} formulario={editando === 'novo' ? null : editando} dados={{ listas, clientes, equipe }} aoFechar={() => setEditando(null)} />}
    </section>
  )
}

function EditorFormulario({ formulario, dados, aoFechar }: { formulario: Formulario | null; dados: Pick<DadosFormularios, 'listas' | 'clientes' | 'equipe'>; aoFechar: () => void }) {
  const [nome, setNome] = useState(formulario?.nome ?? '')
  const [descricao, setDescricao] = useState(formulario?.descricao ?? '')
  const [listaId, setListaId] = useState(formulario?.listaId ?? '')
  const [clienteId, setClienteId] = useState(formulario?.clienteId ?? '')
  const [responsavelId, setResponsavelId] = useState(formulario?.responsavelId ?? '')
  const [landing, setLanding] = useState(formulario?.landing ?? '')
  const [escolhidos, setEscolhidos] = useState<CampoFormulario[]>(() => formulario?.campos ?? [{ key: 'title', label: 'Título', required: true }])
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const oferecidos = dados.listas.find((l) => l.id === listaId)?.oferecidos ?? []
  const chavesOferecidas = new Set(oferecidos.map((c) => c.key))
  const indisponiveis = escolhidos.filter((c) => !chavesOferecidas.has(c.key))
  const campos = escolhidos.filter((c) => chavesOferecidas.has(c.key))
  const extras = oferecidos.filter((c) => !escolhidos.some((e) => e.key === c.key))

  const trocarLista = (id: string) => {
    setListaId(id)
    setErro(null)
    const validos = new Set((dados.listas.find((l) => l.id === id)?.oferecidos ?? []).map((c) => c.key))
    setEscolhidos((atual) => atual.filter((c) => validos.has(c.key) || c.key === 'title' || c.key === 'description'))
  }
  const editarCampo = (key: string, valores: Partial<Pick<CampoFormulario, 'label' | 'required'>>) =>
    setEscolhidos((atual) => atual.map((c) => c.key === key ? { ...c, ...valores } : c))
  const mover = (key: string, direcao: number) => setEscolhidos((atual) => {
    const proximo = [...atual]
    const i = proximo.findIndex((c) => c.key === key)
    const visiveis = atual.filter((c) => chavesOferecidas.has(c.key))
    const vizinho = visiveis[visiveis.findIndex((c) => c.key === key) + direcao]
    if (i < 0 || !vizinho) return atual
    const j = proximo.findIndex((c) => c.key === vizinho.key)
    ;[proximo[i], proximo[j]] = [proximo[j], proximo[i]]
    return proximo
  })
  const salvar = () => iniciar(async () => {
    setErro(null)
    const r = await salvarFormularioAcao(formulario?.id ?? null, { listaId, clienteId: clienteId || null, responsavelId, nome, descricao, landing: landing || null, campos })
    if (r?.erro) setErro(r.erro)
    else { avisar(r, true); aoFechar() }
  })

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && !pendente && aoFechar()}>
      <DialogContent className={s.editor}>
        <DialogHeader>
          <DialogTitle>{formulario ? 'Editar formulário' : 'Novo formulário'}</DialogTitle>
          <DialogDescription>Configure o destino das respostas e o que seu cliente vai preencher.</DialogDescription>
        </DialogHeader>
        <form id="editor-formulario" onSubmit={(e) => { e.preventDefault(); salvar() }} className={s.form}>
          <fieldset className={s.bloco} disabled={pendente}>
            <legend>Informações do formulário</legend>
            <label className={s.campo}>Nome do formulário<Input required maxLength={120} value={nome} placeholder="Ex.: Briefing de novo cliente" onChange={(e) => setNome(e.target.value)} /></label>
            <label className={s.campo}>Texto de apresentação <span className={s.opcional}>Opcional</span><Textarea rows={3} value={descricao} placeholder="Explique o que você precisa e como vai usar as respostas." onChange={(e) => setDescricao(e.target.value)} /></label>
          </fieldset>
          <fieldset className={s.bloco} disabled={pendente}>
            <legend>Destino dos envios</legend>
            <div className={s.grade}>
              <label className={s.campo}>Lista de destino<select className={s.selecao} required value={listaId} onChange={(e) => trocarLista(e.target.value)}><option value="">Selecione uma lista</option>{dados.listas.map((l) => <option key={l.id} value={l.id}>{l.caminho}</option>)}</select></label>
              <label className={s.campo}>Responsável<select className={s.selecao} required value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}><option value="">Selecione uma pessoa</option>{dados.equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            </div>
            <label className={s.campo}>Cliente<select className={s.selecao} value={clienteId} onChange={(e) => setClienteId(e.target.value)}><option value="">Usar o cliente padrão da lista</option>{dados.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
            <p className={s.ajuda}>Ao trocar a lista, os campos que não pertencem ao novo destino são retirados do formulário.</p>
          </fieldset>
          <fieldset className={s.bloco} disabled={pendente}>
            <legend>Campos do formulário {listaId && <span className={s.opcional}>{campos.length}/40</span>}</legend>
            <p className={s.ajuda}>Personalize o nome que aparece para seu cliente e organize a ordem das perguntas. O título é sempre obrigatório.</p>
            {!listaId ? <p className={s.aviso}>Selecione uma lista para escolher os campos.</p> : <>
              {indisponiveis.length > 0 && <p className={s.aviso}>Campos indisponíveis serão retirados ao salvar: {indisponiveis.map((c) => c.label).join(', ')}.</p>}
              <ol className={s.campos}>
                {campos.map((c, i) => <li key={c.key} className={s.linhaCampo}>
                  <div className={s.nomeCampo}><label className={s.campo}>{oferecidos.find((o) => o.key === c.key)?.label}<Input required value={c.label} maxLength={120} aria-label={`Nome exibido de ${oferecidos.find((o) => o.key === c.key)?.label}`} onChange={(e) => editarCampo(c.key, { label: e.target.value })} /></label></div>
                  <div className={s.opcoesCampo}>
                    <label className={s.obrigatorio}><input type="checkbox" checked={c.key === 'title' || c.required} disabled={c.key === 'title'} onChange={(e) => editarCampo(c.key, { required: e.target.checked })} /> Obrigatório</label>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => mover(c.key, -1)} aria-label={`Mover ${c.label} para cima`}><ArrowUp aria-hidden /></Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={i === campos.length - 1} onClick={() => mover(c.key, 1)} aria-label={`Mover ${c.label} para baixo`}><ArrowDown aria-hidden /></Button>
                    <Button type="button" variant="ghost" size="sm" disabled={c.key === 'title'} onClick={() => setEscolhidos((atual) => atual.filter((e) => e.key !== c.key))} aria-label={`Retirar ${c.label}`}>Retirar</Button>
                  </div>
                </li>)}
              </ol>
              {extras.length > 0 && <div className={s.disponiveis}><p>Adicionar campos da lista</p><div>{extras.map((c) => <Button key={c.key} type="button" variant="secondary" size="sm" disabled={campos.length >= 40} onClick={() => setEscolhidos((atual) => [...atual, c])}><Plus aria-hidden /> {c.label}</Button>)}</div></div>}
            </>}
          </fieldset>
          <fieldset className={s.bloco} disabled={pendente}>
            <legend>Landing page <span className={s.opcional}>Opcional</span></legend>
            <label className={s.campo}>Página ligada<select className={s.selecao} value={landing} onChange={(e) => setLanding(e.target.value)}><option value="">Nenhuma — usar apenas o link público</option>{LANDINGS_COM_FORMULARIO.map((l) => <option key={l.slug} value={l.slug}>{l.nome} (/{l.slug})</option>)}</select></label>
            <p className={s.ajuda}>Os envios da landing também criam tarefas nesta lista. Cada landing pode estar ligada a um único formulário.</p>
          </fieldset>
        </form>
        {erro && <p className={s.erro} role="alert">{erro}</p>}
        <DialogFooter className={s.rodape}>
          <Button type="button" variant="secondary" disabled={pendente} onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="editor-formulario" disabled={pendente || !listaId || !responsavelId || !nome.trim() || !campos.length}>{pendente ? 'Salvando…' : formulario ? 'Salvar alterações' : 'Criar formulário'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
