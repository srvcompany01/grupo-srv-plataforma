'use client'

import { Archive, Lock, Plus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { arquivarCanalAcao, criarCanalAcao, criarTarefaNoChatAcao, definirMembrosAcao, enviarMensagemAcao, prepararEnvioChatAcao } from '@/app/(app)/chat/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { CaixaMensagem } from '@/componentes/mensagens/CaixaMensagem'
import { avisar } from '@/componentes/tarefas/avisar'
import type { PessoaMencao } from '@/componentes/tarefas/tela/SeletorMencao'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { nomeDeCanal } from '@/dominio/chat'

export type ListaChat = { id: string; nome: string; post: boolean }

/** Caixa de envio do canal (ou do tópico, com `paiId`). Enter envia; Shift+Enter quebra linha. Seletor Mensagem / Tarefa / Post: os dois últimos criam a tarefa na lista escolhida e avisam no canal. */
export function CaixaChat({ canalId, paiId, canalNome, pessoas, listas = [] }: { canalId: string; paiId?: string; canalNome: string; pessoas: PessoaMencao[]; listas?: ListaChat[] }) {
  const [modo, setModo] = useState<'mensagem' | 'tarefa' | 'post'>('mensagem')
  const [titulo, setTitulo] = useState('')
  const [listaId, setListaId] = useState('')
  const [pendente, iniciar] = useTransition()
  const opcoes = listas.filter((l) => (modo === 'post' ? l.post : true))
  const escolhida = opcoes.find((l) => l.id === listaId)?.id ?? opcoes[0]?.id ?? ''
  const modos = paiId ? ([['mensagem', 'Mensagem']] as const) : ([['mensagem', 'Mensagem'], ['tarefa', 'Tarefa'], ['post', 'Post']] as const)
  return (
    <div className="ch-caixa">
      {modos.length > 1 && (
        <div role="tablist" aria-label="Tipo de envio">
          {modos.map(([valor, rotuloModo]) => (
            <button key={valor} type="button" role="tab" aria-selected={modo === valor} onClick={() => setModo(valor)}>{rotuloModo}</button>
          ))}
        </div>
      )}
      {modo === 'mensagem' ? (
        <CaixaMensagem
          key={paiId ?? canalId}
          pessoas={pessoas}
          preparar={(a) => prepararEnvioChatAcao(canalId, a)}
          aoEnviar={async (texto, mencoes, anexos) => avisar(await enviarMensagemAcao(canalId, paiId ?? null, texto, mencoes, anexos))}
          placeholder={paiId ? 'Responder no tópico…' : `Escreva em #${canalNome}…`}
          rotulo={paiId ? 'Resposta' : 'Mensagem'}
          enterEnvia
          autoFoco
        />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            iniciar(async () => {
              if (!avisar(await criarTarefaNoChatAcao({ canalId, listaId: escolhida, titulo, post: modo === 'post' }), true)) return
              setTitulo('')
            })
          }}
        >
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={modo === 'post' ? 'Título do post' : 'Nome da tarefa'} maxLength={200} aria-label="Título" />
          <select value={escolhida} onChange={(e) => setListaId(e.target.value)} aria-label="Lista">
            {opcoes.length === 0 && <option value="">{modo === 'post' ? 'Nenhuma lista de posts' : 'Nenhuma lista'}</option>}
            {opcoes.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          <button disabled={pendente || !titulo.trim() || !escolhida}>{pendente ? 'Criando…' : modo === 'post' ? 'Criar post' : 'Criar tarefa'}</button>
        </form>
      )}
    </div>
  )
}

function EscolherPessoas({ equipe, marcadas, alternar }: { equipe: PessoaMencao[]; marcadas: string[]; alternar: (id: string) => void }) {
  return (
    <div>
      {equipe.map((p) => (
        <label key={p.id}>
          <input type="checkbox" checked={marcadas.includes(p.id)} onChange={() => alternar(p.id)} /> {p.nome}
        </label>
      ))}
    </div>
  )
}

export function NovoCanal({ equipe }: { equipe: PessoaMencao[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [privado, setPrivado] = useState(false)
  const [membros, setMembros] = useState<string[]>([])
  const [pendente, iniciar] = useTransition()
  const criar = () =>
    iniciar(async () => {
      const r = await criarCanalAcao({ nome, descricao, privado, membros })
      if (!avisar(r, true) || !r?.nome) return
      setAberto(false)
      setNome('')
      setDescricao('')
      setPrivado(false)
      setMembros([])
      router.push(`/chat/${r.nome}`)
    })
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger aria-label="Novo canal" title="Novo canal"><Plus /></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo canal</DialogTitle>
          <DialogDescription>Um canal por assunto ou área (vendas, tráfego, um cliente…).</DialogDescription>
        </DialogHeader>
        <div>
          <label>
            <span>Nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="area-de-vendas" maxLength={60} autoFocus />
            {nome && <span>Vai ficar #{nomeDeCanal(nome) || '…'}</span>}
          </label>
          <label>
            <span>Descrição (opcional)</span>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={300} placeholder="Do que se fala aqui" />
          </label>
          <label>
            <input type="checkbox" checked={privado} onChange={(e) => setPrivado(e.target.checked)} /> <Lock /> Privado (só quem você escolher)
          </label>
          {privado && <EscolherPessoas equipe={equipe} marcadas={membros} alternar={(id) => setMembros((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))} />}
        </div>
        <div>
          <button type="button" onClick={() => setAberto(false)}>Cancelar</button>
          <button type="button" disabled={pendente || !nomeDeCanal(nome)} onClick={criar}>Criar canal</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Membros do canal privado (quem criou ou o admin troca) e arquivar o canal. */
export function GerenciarCanal({ canalId, privado, membros, equipe, podeGerir }: { canalId: string; privado: boolean; membros: string[]; equipe: PessoaMencao[]; podeGerir: boolean }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [marcadas, setMarcadas] = useState(membros)
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const arquivar = async () => {
    if (!(await confirmar({ titulo: 'Arquivar este canal?', descricao: 'Ele some da lista de canais (as mensagens ficam guardadas).', confirmar: 'Arquivar', perigo: true }))) return
    iniciar(async () => {
      if (avisar(await arquivarCanalAcao(canalId), true)) router.push('/chat')
    })
  }
  return (
    <div>
      {privado && (
        <Dialog open={aberto} onOpenChange={(a) => { setAberto(a); if (a) setMarcadas(membros) }}>
          <DialogTrigger><Users /> {membros.length}</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Membros do canal</DialogTitle>
              <DialogDescription>{podeGerir ? 'Quem pode ler e escrever neste canal privado.' : 'Só quem criou o canal (ou o admin) muda os membros.'}</DialogDescription>
            </DialogHeader>
            <fieldset disabled={!podeGerir}>
              <EscolherPessoas equipe={equipe} marcadas={marcadas} alternar={(id) => setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))} />
            </fieldset>
            {podeGerir && (
              <div>
                <button type="button" onClick={() => setAberto(false)}>Cancelar</button>
                <button type="button" disabled={pendente} onClick={() => iniciar(async () => { if (avisar(await definirMembrosAcao(canalId, marcadas), true)) setAberto(false) })}>Salvar</button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      {podeGerir && <button type="button" onClick={arquivar} disabled={pendente} title="Arquivar canal" aria-label="Arquivar canal"><Archive /></button>}
    </div>
  )
}
