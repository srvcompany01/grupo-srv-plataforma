'use client'

import { Check, PencilLine } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { responderPostAcao } from '@/app/cliente/[slug]/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'

const CHAVE_NOME = 'srv-cliente-nome'

/** Aprovar ou pedir ajuste (com o que mudar). Sem login: pede o nome de quem responde (fica lembrado no navegador). */
export function RespostaPost({ slug, tarefaId, quando }: { slug: string; tarefaId: string; quando: string | null }) {
  const [nome, setNome] = useState(() => {
    try {
      return typeof window === 'undefined' ? '' : (localStorage.getItem(CHAVE_NOME) ?? '')
    } catch {
      return ''
    }
  })
  const lembrar = (v: string) => {
    setNome(v)
    try {
      localStorage.setItem(CHAVE_NOME, v)
    } catch {}
  }
  const router = useRouter()
  const confirmar = useConfirmar()
  const [ajuste, setAjuste] = useState(false)
  const [texto, setTexto] = useState('')
  const [pendente, iniciar] = useTransition()
  const responder = (decisao: 'aprovado' | 'ajuste') => iniciar(async () => { if (avisar(await responderPostAcao(slug, tarefaId, decisao, texto, nome), true)) router.refresh() })
  const aprovar = async () => {
    if (!(await confirmar({ titulo: 'Aprovar este post?', descricao: quando ? `Ele será publicado ${quando}.` : 'A equipe vai publicar no dia combinado.', confirmar: 'Aprovar' }))) return
    responder('aprovado')
  }

  const campoNome = (
    <label>
      <span>Seu nome</span>
      <input value={nome} onChange={(e) => lembrar(e.target.value)} placeholder="Quem está respondendo" maxLength={80} suppressHydrationWarning />
    </label>
  )

  if (ajuste) {
    return (
      <div>
        {campoNome}
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} autoFocus placeholder="O que você quer mudar? (texto, imagem, horário…)" maxLength={2000} />
        <div>
          <button type="button" disabled={pendente || !texto.trim() || !nome.trim()} onClick={() => responder('ajuste')}><PencilLine /> Enviar pedido de ajuste</button>
          <button type="button" onClick={() => setAjuste(false)}>Voltar</button>
        </div>
      </div>
    )
  }
  return (
    <div>
    {campoNome}
    <div>
      <button type="button" disabled={pendente || !nome.trim()} onClick={aprovar}><Check /> Aprovar</button>
      <button type="button" disabled={pendente} onClick={() => setAjuste(true)}><PencilLine /> Pedir ajuste</button>
    </div>
    </div>
  )
}
