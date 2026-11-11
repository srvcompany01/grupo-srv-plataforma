'use client'

import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import type { CampoFormulario } from '@/dominio/formularios'
import { LANDINGS_COM_FORMULARIO } from '@/dominio/landings'
import type { DadosFormularios, Formulario } from '@/servicos/formularios'
import { alternarFormularioAcao, arquivarFormularioAcao, salvarFormularioAcao } from './acoes'

const link = (token: string) => `${window.location.origin}/f/${token}`

export function GerenciarFormularios({ formularios, listas, clientes, equipe }: DadosFormularios) {
  const [editando, setEditando] = useState<Formulario | 'novo' | null>(null)
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const caminho = (id: string) => listas.find((l) => l.id === id)?.caminho ?? 'Lista removida'

  const copiar = async (token: string) => {
    await navigator.clipboard.writeText(link(token))
    avisar({ ok: 'Link copiado.' }, true)
  }
  const arquivar = async (f: Formulario) => {
    if (!(await confirmar({ titulo: `Arquivar "${f.nome}"?`, descricao: 'O link deixa de funcionar. As tarefas já criadas continuam nas listas.', confirmar: 'Arquivar', perigo: true }))) return
    iniciar(async () => void avisar(await arquivarFormularioAcao(f.id), true))
  }

  return (
    <div>
      <div>
        <p>Cada formulário tem um link público que cria uma tarefa na lista escolhida.</p>
        <button onClick={() => setEditando('novo')}><Plus /> Novo formulário</button>
      </div>
      {formularios.length === 0 ? (
        <EstadoVazio titulo="Nenhum formulário ainda" descricao="Crie um briefing para o cliente preencher sem precisar de login." />
      ) : (
        <ul>
          {formularios.map((f) => (
            <li key={f.id}>
              <div>
                <p>{f.nome}</p>
                <p>{caminho(f.listaId)} · {f.campos.length} campos{f.landing && ` · recebe os leads de /${f.landing}`}</p>
              </div>
              <label>
                <input type="checkbox" checked={f.ativo} disabled={pendente} onChange={(e) => iniciar(async () => void avisar(await alternarFormularioAcao(f.id, e.target.checked), true))} />
                Ativo
              </label>
              <button onClick={() => copiar(f.token)}><Copy /> Copiar link</button>
              <button aria-label="Editar" onClick={() => setEditando(f)}><Pencil /></button>
              <button aria-label="Arquivar" onClick={() => arquivar(f)}><Trash2 /></button>
            </li>
          ))}
        </ul>
      )}
      {editando && (
        <EditorFormulario
          key={editando === 'novo' ? 'novo' : editando.id}
          formulario={editando === 'novo' ? null : editando}
          dados={{ listas, clientes, equipe }}
          aoFechar={() => setEditando(null)}
        />
      )}
    </div>
  )
}

function EditorFormulario({ formulario, dados, aoFechar }: { formulario: Formulario | null; dados: Pick<DadosFormularios, 'listas' | 'clientes' | 'equipe'>; aoFechar: () => void }) {
  const [nome, setNome] = useState(formulario?.nome ?? '')
  const [descricao, setDescricao] = useState(formulario?.descricao ?? '')
  const [listaId, setListaId] = useState(formulario?.listaId ?? '')
  const [clienteId, setClienteId] = useState(formulario?.clienteId ?? '')
  const [responsavelId, setResponsavelId] = useState(formulario?.responsavelId ?? '')
  const [landing, setLanding] = useState(formulario?.landing ?? '')
  const [escolhidos, setEscolhidos] = useState<Record<string, { required: boolean; label: string }>>(
    Object.fromEntries((formulario?.campos ?? [{ key: 'title', label: 'Título', required: true }]).map((c) => [c.key, { required: c.required, label: c.label }])),
  )
  const [pendente, iniciar] = useTransition()
  const oferecidos = dados.listas.find((l) => l.id === listaId)?.oferecidos ?? []

  const trocarLista = (id: string) => {
    setListaId(id)
    // Campos personalizados são da lista: descarta os que não existem na nova.
    const validos = new Set((dados.listas.find((l) => l.id === id)?.oferecidos ?? []).map((c) => c.key))
    setEscolhidos((atual) => Object.fromEntries(Object.entries(atual).filter(([k]) => validos.has(k) || k === 'title' || k === 'description')))
  }
  const alternar = (c: CampoFormulario, marcado: boolean) =>
    setEscolhidos((atual) => {
      const resto = Object.fromEntries(Object.entries(atual).filter(([k]) => k !== c.key))
      return marcado ? { ...resto, [c.key]: { required: c.required, label: c.label } } : resto
    })
  const salvar = () =>
    iniciar(async () => {
      const campos = oferecidos.filter((c) => escolhidos[c.key]).map((c) => ({ key: c.key, label: escolhidos[c.key].label, required: escolhidos[c.key].required }))
      const r = await salvarFormularioAcao(formulario?.id ?? null, { listaId, clienteId: clienteId || null, responsavelId, nome, descricao, landing: landing || null, campos })
      if (avisar(r, true)) aoFechar()
    })

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{formulario ? 'Editar formulário' : 'Novo formulário'}</DialogTitle></DialogHeader>
        <div>
          <input placeholder="Nome (ex.: Briefing de novo cliente)" value={nome} onChange={(e) => setNome(e.target.value)} />
          <textarea rows={2} placeholder="Texto de apoio para quem vai preencher (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <select value={listaId} onChange={(e) => trocarLista(e.target.value)}>
            <option value="">Lista que recebe as tarefas…</option>
            {dados.listas.map((l) => <option key={l.id} value={l.id}>{l.caminho}</option>)}
          </select>
          <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
            <option value="">Responsável pelas tarefas…</option>
            {dados.equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Cliente: o padrão da lista</option>
            {dados.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <label>
            <span>Landing page ligada (opcional)</span>
            <select value={landing} onChange={(e) => setLanding(e.target.value)}>
              <option value="">Nenhuma: só o link público do formulário</option>
              {LANDINGS_COM_FORMULARIO.map((l) => <option key={l.slug} value={l.slug}>{l.nome} (/{l.slug})</option>)}
            </select>
            <span>Os envios dessa página criam a tarefa nesta lista, preenchendo os campos que tiverem o mesmo nome dos dados do lead (Telefone, Empresa, Pontuação…). Cada landing tem um só formulário.</span>
          </label>
          {listaId && (
            <fieldset>
              <legend>Campos do formulário</legend>
              {oferecidos.map((c) => {
                const marcado = !!escolhidos[c.key]
                const fixo = c.key === 'title'
                return (
                  <div key={c.key}>
                    <label>
                      <input type="checkbox" checked={marcado} disabled={fixo} onChange={(e) => alternar(c, e.target.checked)} /> {c.label}
                    </label>
                    {marcado && (
                      <label>
                        <input type="checkbox" checked={fixo || escolhidos[c.key].required} disabled={fixo} onChange={(e) => setEscolhidos((a) => ({ ...a, [c.key]: { ...a[c.key], required: e.target.checked } }))} /> Obrigatório
                      </label>
                    )}
                  </div>
                )
              })}
            </fieldset>
          )}
          <div>
            <button onClick={aoFechar}>Cancelar</button>
            <button disabled={pendente || !listaId || !responsavelId} onClick={salvar}>{pendente ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
