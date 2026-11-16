'use client'

import { Check, Copy, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'

/** Prepara um pedido para o fluxo de criação pela IA já usado pela agência. */
export function NovaCampanha({ clientes, clienteInicial }: { clientes: { id: string; nome: string }[]; clienteInicial: string | null }) {
  const [cliente, setCliente] = useState(clienteInicial ?? clientes[0]?.id ?? '')
  const [canal, setCanal] = useState('Meta Ads'), [objetivo, setObjetivo] = useState('Captação de leads')
  const [descricao, setDescricao] = useState(''), [copiado, setCopiado] = useState(false), [erro, setErro] = useState('')
  const pedido = `Prepare uma campanha de ${objetivo.toLowerCase()} no ${canal} para ${clientes.find(c => c.id === cliente)?.nome ?? ''} (cliente ${cliente}).\n${descricao.trim()}\nCrie a campanha pausada e envie uma proposta de ativação para aprovação na plataforma.`
  return <Dialog onOpenChange={() => { setCopiado(false); setErro('') }}><DialogTrigger asChild><button type="button" className="an-btn an-btn-primary" disabled={!clientes.length}><Sparkles />Nova campanha</button></DialogTrigger><DialogContent className="an-dialog"><DialogHeader><DialogTitle>Planejar nova campanha</DialogTitle><DialogDescription>Prepare o briefing para a IA que você já usa com a plataforma. A campanha nasce pausada e passa por aprovação.</DialogDescription></DialogHeader>
    <div className="an-brief-fields"><label>Cliente<select value={cliente} onChange={e => { setCliente(e.target.value); setCopiado(false) }}>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label><label>Canal<select value={canal} onChange={e => { setCanal(e.target.value); setCopiado(false) }}><option>Meta Ads</option><option>Google Ads</option></select></label><label>Objetivo<select value={objetivo} onChange={e => { setObjetivo(e.target.value); setCopiado(false) }}><option>Captação de leads</option><option>Vendas</option><option>Reconhecimento de marca</option><option>Tráfego para o site</option></select></label><label>O que vamos anunciar?<textarea value={descricao} maxLength={3000} rows={3} onChange={e => { setDescricao(e.target.value); setCopiado(false) }} placeholder="Oferta, público, região, orçamento desejado e criativos…" /></label><label>Pedido para a IA<textarea readOnly value={pedido} rows={5} /></label></div>
    {erro && <p role="alert">{erro}</p>}<button type="button" className="an-btn an-btn-primary" onClick={async () => { try { await navigator.clipboard.writeText(pedido); setCopiado(true); setErro('') } catch { setErro('Não foi possível copiar. Selecione e copie o pedido acima.') } }}>{copiado ? <Check /> : <Copy />}{copiado ? 'Briefing copiado' : 'Copiar briefing'}</button><p className="an-dialog-note" role="status">{copiado ? 'Cole o briefing na conversa com a IA conectada à plataforma.' : 'Copiar o briefing não cria nem ativa anúncios.'}</p>
  </DialogContent></Dialog>
}
