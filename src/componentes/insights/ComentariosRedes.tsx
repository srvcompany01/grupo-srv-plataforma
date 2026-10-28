'use client'

import { CircleCheck, EyeOff, Eye, Heart, MessageCircle, RefreshCw, Reply } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { atualizarComentariosAcao, ocultarComentarioAcao, resolverComentarioAcao, responderComentarioAcao } from '@/app/(app)/insights/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { ROTULO_TOM, type TomComentario } from '@/dominio/comentarios'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo } from '@/lib/ui'
import type { Comentario } from '@/servicos/comentarios-redes'
import { SeloTom } from './tom'
import { NomeCliente } from '@/componentes/NomeCliente'

const TOM_SELO: Record<TomComentario, 'bom' | 'neutro' | 'atencao' | 'ruim'> = { positivo: 'bom', neutro: 'neutro', negativo: 'atencao', agressivo: 'ruim' }
const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })
const COR_REDE = { instagram: 'linear-gradient(45deg, #f9a825, #e1306c 45%, #833ab4)', facebook: '#0866ff' }

/** Botão "Atualizar agora": busca os comentários novos na Meta. */
export function AtualizarComentarios({ clienteId }: { clienteId: string | null }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  return (
    <button type="button" disabled={pendente} onClick={() => iniciar(async () => { if (avisar(await atualizarComentariosAcao(clienteId), true)) router.refresh() })} className={botaoSecundario}>
      <RefreshCw className={`h-3.5 w-3.5 ${pendente ? 'animate-spin' : ''}`} /> {pendente ? 'Buscando na Meta…' : 'Atualizar agora'}
    </button>
  )
}

function Cartao({ c }: { c: Comentario }) {
  const router = useRouter()
  const [respondendo, setRespondendo] = useState(false)
  const [texto, setTexto] = useState('')
  const [pendente, iniciar] = useTransition()
  const rodar = (fn: () => Promise<{ ok?: string; erro?: string } | null>, depois?: () => void) =>
    iniciar(async () => {
      if (!avisar(await fn(), true)) return
      depois?.()
      router.refresh()
    })
  const alerta = (c.tom === 'negativo' || c.tom === 'agressivo') && !c.resolvidoEm
  return (
    <li id={`c-${c.plataforma}-${c.id}`} className={`space-y-2 rounded-xl border bg-white p-3 ${alerta ? (c.tom === 'agressivo' ? 'border-perigo/40 ring-1 ring-perigo/20' : 'border-aviso/50') : 'border-borda'} ${c.oculto ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-micro font-bold text-claro" style={{ background: COR_REDE[c.plataforma] }}>{c.plataforma === 'instagram' ? 'IG' : 'FB'}</span>
        <span className="text-rotulo font-semibold text-texto">{c.plataforma === 'instagram' ? '@' : ''}{c.autor || 'alguém'}</span>
        <span className="text-legenda text-texto-3">{quando.format(new Date(c.criadoEm))} · <NomeCliente nome={c.clienteNome} href={`/clientes/${c.clienteId}`} /></span>
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          {c.tom !== 'neutro' && <SeloTom tom={TOM_SELO[c.tom]} rotulo={ROTULO_TOM[c.tom]} />}
          {c.respondidoEm && <SeloTom tom="bom" rotulo="Respondido" />}
          {c.oculto && <SeloTom tom="neutro" rotulo="Oculto" />}
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words text-corpo text-texto">{c.texto || <em className="text-texto-3">(sem texto: figurinha ou mídia)</em>}</p>
      {alerta && c.motivo && <p className="text-legenda text-texto-2">Por que o alerta: {c.motivo}</p>}
      <p className="text-legenda text-texto-3">
        {c.origem === 'anuncio' ? `Anúncio: ${c.anuncioNome || '—'}` : 'Post'}
        {c.postTexto && ` · “${c.postTexto.slice(0, 80)}${c.postTexto.length > 80 ? '…' : ''}”`}
        {c.postLink && <> · <a href={c.postLink} target="_blank" rel="noreferrer" className="font-semibold text-petroleo hover:underline">ver na rede</a></>}
        {c.curtidas > 0 && <span className="ml-2 inline-flex items-center gap-0.5"><Heart className="h-3 w-3" />{c.curtidas}</span>}
      </p>
      {c.respostas.length > 0 && (
        <ul className="space-y-1 border-l-2 border-borda pl-3">
          {c.respostas.map((r, i) => (
            <li key={i} className="text-rotulo"><span className={`font-semibold ${r.daMarca ? 'text-petroleo' : 'text-texto'}`}>{r.daMarca ? 'Marca' : r.autor}:</span> <span className="text-texto-2">{r.texto}</span></li>
          ))}
        </ul>
      )}
      {respondendo ? (
        <div className="space-y-2">
          <textarea autoFocus rows={3} className={campo} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} placeholder={`Responder ${c.plataforma === 'instagram' ? '@' : ''}${c.autor} como ${c.clienteNome}…`} />
          <div className="flex gap-2">
            <button type="button" disabled={pendente || !texto.trim()} onClick={() => rodar(() => responderComentarioAcao(c.plataforma, c.id, texto), () => { setRespondendo(false); setTexto('') })} className={botaoPrimario}><Reply className="h-3.5 w-3.5" /> Publicar resposta</button>
            <button type="button" onClick={() => setRespondendo(false)} className={botaoFantasma}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => setRespondendo(true)} className={botaoFantasma}><Reply className="h-3.5 w-3.5" /> Responder</button>
          <button type="button" disabled={pendente} onClick={() => rodar(() => ocultarComentarioAcao(c.plataforma, c.id, !c.oculto))} className={botaoFantasma}>{c.oculto ? <><Eye className="h-3.5 w-3.5" /> Mostrar</> : <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>}</button>
          {alerta && <button type="button" disabled={pendente} onClick={() => rodar(() => resolverComentarioAcao(c.plataforma, c.id))} className={botaoFantasma}><CircleCheck className="h-3.5 w-3.5" /> Resolvido</button>}
        </div>
      )}
    </li>
  )
}

/** Lista de comentários com responder, ocultar e resolver. */
export function ListaComentarios({ comentarios }: { comentarios: Comentario[] }) {
  if (!comentarios.length) {
    return <p className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-borda py-10 text-center text-rotulo text-texto-3"><MessageCircle className="h-6 w-6" />Nenhum comentário aqui. Clique em “Atualizar agora” para buscar os mais recentes.</p>
  }
  return <ul className="space-y-2">{comentarios.map((c) => <Cartao key={`${c.plataforma}-${c.id}`} c={c} />)}</ul>
}
