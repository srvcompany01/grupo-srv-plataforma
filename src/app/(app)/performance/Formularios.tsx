'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { CopiarTexto } from '@/componentes/CopiarTexto'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import { configurarLinkBioAcao, confirmarLeadAcao, removerLeadAcao, salvarResultadoMesAcao } from './acoes'

const moeda = (n: number | null) => (n === null ? '' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

/** Faturamento, número de vendas e observação do mês (só a equipe lança). */
export function LancarMes({ clienteId, mes, faturamento, vendas, notas }: { clienteId: string; mes: string; faturamento: number | null; vendas: number | null; notas: string }) {
  const [v, setV] = useState({ faturamento: moeda(faturamento), vendas: vendas === null ? '' : String(vendas), notas })
  const [pendente, iniciar] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => { avisar(await salvarResultadoMesAcao(clienteId, mes, v), true) })
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className={rotulo}>Faturamento do mês (R$)</span>
          <input className={campo} inputMode="decimal" placeholder="25.000,00" value={v.faturamento} onChange={(e) => setV({ ...v, faturamento: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className={rotulo}>Número de vendas</span>
          <input className={campo} inputMode="numeric" placeholder="12" value={v.vendas} onChange={(e) => setV({ ...v, vendas: e.target.value })} />
        </label>
      </div>
      <label className="block space-y-1">
        <span className={rotulo}>Observação (opcional)</span>
        <textarea className={campo} rows={2} maxLength={500} placeholder="Ex.: promoção de aniversário, feriado, estoque baixo…" value={v.notas} onChange={(e) => setV({ ...v, notas: e.target.value })} />
      </label>
      <button type="submit" disabled={pendente} className={botaoPrimario}>Salvar o mês</button>
    </form>
  )
}

/** Link da bio da plataforma: conta o clique e abre o WhatsApp do cliente com a mensagem pronta. */
export function LinkBio({ clienteId, url, mensagem, whatsapp }: { clienteId: string; url: string | null; mensagem: string; whatsapp: string | null }) {
  const [texto, setTexto] = useState(mensagem)
  const [pendente, iniciar] = useTransition()
  if (!whatsapp) return <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">Cadastre o WhatsApp do cliente (página do cliente → Cadastro) para criar o link da bio.</p>
  return (
    <div className="space-y-3">
      {url && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-borda bg-fundo px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-rotulo font-semibold text-texto">{url}</code>
          <CopiarTexto texto={url} rotulo="Copiar link" />
        </div>
      )}
      <label className="block space-y-1">
        <span className={rotulo}>Mensagem que já chega escrita no WhatsApp ({whatsapp})</span>
        <input className={campo} maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>
      <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await configurarLinkBioAcao(clienteId, texto), true) })} className={url ? botaoSecundario : botaoPrimario}>
        {url ? 'Salvar mensagem' : 'Criar link da bio'}
      </button>
    </div>
  )
}

/** A equipe confirma cada conversa que chegou pelo link da bio (a mensagem pronta identifica a origem). */
export function ConfirmarLead({ clienteId, hoje }: { clienteId: string; hoje: string }) {
  const [dia, setDia] = useState(hoje)
  const [obs, setObs] = useState('')
  const [pendente, iniciar] = useTransition()
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => { if (avisar(await confirmarLeadAcao(clienteId, dia, obs), true)) setObs('') })
      }}
    >
      <label className="block space-y-1">
        <span className={rotulo}>Dia</span>
        <input type="date" className={`${campo} w-40`} max={hoje} value={dia} onChange={(e) => setDia(e.target.value)} />
      </label>
      <label className="block min-w-48 flex-1 space-y-1">
        <span className={rotulo}>Quem / observação</span>
        <input className={campo} maxLength={200} placeholder="Ex.: Maria, pediu orçamento de clareamento" value={obs} onChange={(e) => setObs(e.target.value)} />
      </label>
      <button type="submit" disabled={pendente} className={botaoPrimario}>Confirmar lead</button>
    </form>
  )
}

export function RemoverLead({ id }: { id: string }) {
  const [pendente, iniciar] = useTransition()
  return (
    <button type="button" disabled={pendente} aria-label="Remover lead" title="Remover lead" onClick={() => confirm('Remover este lead confirmado?') && iniciar(async () => { avisar(await removerLeadAcao(id), true) })} className={`${botaoFantasma} h-7 px-2`}>
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
