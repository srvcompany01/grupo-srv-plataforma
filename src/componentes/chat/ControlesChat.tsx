'use client'

import { Archive, Lock, Plus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { arquivarCanalAcao, criarCanalAcao, definirMembrosAcao, enviarMensagemAcao, prepararEnvioChatAcao } from '@/app/(app)/chat/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { CaixaMensagem } from '@/componentes/mensagens/CaixaMensagem'
import { avisar } from '@/componentes/tarefas/avisar'
import type { PessoaMencao } from '@/componentes/tarefas/tela/SeletorMencao'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { nomeDeCanal } from '@/dominio/chat'
import { botaoFantasma, botaoPrimario, campo, rotulo } from '@/lib/ui'

/** Caixa de envio do canal (ou do tópico, com `paiId`). Enter envia; Shift+Enter quebra linha. */
export function CaixaChat({ canalId, paiId, canalNome, pessoas }: { canalId: string; paiId?: string; canalNome: string; pessoas: PessoaMencao[] }) {
  return (
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
  )
}

function EscolherPessoas({ equipe, marcadas, alternar }: { equipe: PessoaMencao[]; marcadas: string[]; alternar: (id: string) => void }) {
  return (
    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-borda p-2">
      {equipe.map((p) => (
        <label key={p.id} className="flex items-center gap-2 text-rotulo">
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
      <DialogTrigger aria-label="Novo canal" title="Novo canal" className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto"><Plus className="h-4 w-4" /></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo canal</DialogTitle>
          <DialogDescription>Um canal por assunto ou área (vendas, tráfego, um cliente…).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className={rotulo}>Nome</span>
            <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="area-de-vendas" maxLength={60} autoFocus />
            {nome && <span className="text-legenda text-texto-3">Vai ficar #{nomeDeCanal(nome) || '…'}</span>}
          </label>
          <label className="block space-y-1">
            <span className={rotulo}>Descrição (opcional)</span>
            <input className={campo} value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={300} placeholder="Do que se fala aqui" />
          </label>
          <label className="flex items-center gap-2 text-rotulo">
            <input type="checkbox" checked={privado} onChange={(e) => setPrivado(e.target.checked)} /> <Lock className="h-3.5 w-3.5" /> Privado (só quem você escolher)
          </label>
          {privado && <EscolherPessoas equipe={equipe} marcadas={membros} alternar={(id) => setMembros((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))} />}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={botaoFantasma} onClick={() => setAberto(false)}>Cancelar</button>
          <button type="button" className={botaoPrimario} disabled={pendente || !nomeDeCanal(nome)} onClick={criar}>Criar canal</button>
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
    <div className="flex items-center gap-1">
      {privado && (
        <Dialog open={aberto} onOpenChange={(a) => { setAberto(a); if (a) setMarcadas(membros) }}>
          <DialogTrigger className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-rotulo text-texto-2 hover:bg-hover"><Users className="h-3.5 w-3.5" /> {membros.length}</DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Membros do canal</DialogTitle>
              <DialogDescription>{podeGerir ? 'Quem pode ler e escrever neste canal privado.' : 'Só quem criou o canal (ou o admin) muda os membros.'}</DialogDescription>
            </DialogHeader>
            <fieldset disabled={!podeGerir}>
              <EscolherPessoas equipe={equipe} marcadas={marcadas} alternar={(id) => setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))} />
            </fieldset>
            {podeGerir && (
              <div className="flex justify-end gap-2">
                <button type="button" className={botaoFantasma} onClick={() => setAberto(false)}>Cancelar</button>
                <button type="button" className={botaoPrimario} disabled={pendente} onClick={() => iniciar(async () => { if (avisar(await definirMembrosAcao(canalId, marcadas), true)) setAberto(false) })}>Salvar</button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      {podeGerir && <button type="button" onClick={arquivar} disabled={pendente} title="Arquivar canal" aria-label="Arquivar canal" className="rounded-md p-1.5 text-texto-3 hover:bg-hover hover:text-texto"><Archive className="h-4 w-4" /></button>}
    </div>
  )
}
