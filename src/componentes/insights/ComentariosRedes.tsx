'use client'

import { CircleCheck, EyeOff, Eye, Heart, MessageCircle, RefreshCw, Reply } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { atualizarComentariosAcao, ocultarComentarioAcao, resolverComentarioAcao, responderComentarioAcao } from '@/app/(app)/insights/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { ROTULO_TOM, type TomComentario } from '@/dominio/comentarios'
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
    <button type="button" disabled={pendente} onClick={() => iniciar(async () => { if (avisar(await atualizarComentariosAcao(clienteId), true)) router.refresh() })}>
      <RefreshCw /> {pendente ? 'Buscando na Meta…' : 'Atualizar agora'}
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
    <li id={`c-${c.plataforma}-${c.id}`}>
      <div>
        <span style={{ background: COR_REDE[c.plataforma] }}>{c.plataforma === 'instagram' ? 'IG' : 'FB'}</span>
        <span>{c.plataforma === 'instagram' ? '@' : ''}{c.autor || 'alguém'}</span>
        <span>{quando.format(new Date(c.criadoEm))} · <NomeCliente nome={c.clienteNome} href={`/clientes/${c.clienteId}`} /></span>
        <span>
          {c.tom !== 'neutro' && <SeloTom tom={TOM_SELO[c.tom]} rotulo={ROTULO_TOM[c.tom]} />}
          {c.respondidoEm && <SeloTom tom="bom" rotulo="Respondido" />}
          {c.oculto && <SeloTom tom="neutro" rotulo="Oculto" />}
        </span>
      </div>
      <p>{c.texto || <em>(sem texto: figurinha ou mídia)</em>}</p>
      {alerta && c.motivo && <p>Por que o alerta: {c.motivo}</p>}
      <p>
        {c.origem === 'anuncio' ? `Anúncio: ${c.anuncioNome || '—'}` : 'Post'}
        {c.postTexto && ` · “${c.postTexto.slice(0, 80)}${c.postTexto.length > 80 ? '…' : ''}”`}
        {c.postLink && <> · <a href={c.postLink} target="_blank" rel="noreferrer">ver na rede</a></>}
        {c.curtidas > 0 && <span><Heart />{c.curtidas}</span>}
      </p>
      {c.respostas.length > 0 && (
        <ul>
          {c.respostas.map((r, i) => (
            <li key={i}><span>{r.daMarca ? 'Marca' : r.autor}:</span> <span>{r.texto}</span></li>
          ))}
        </ul>
      )}
      {respondendo ? (
        <div>
          <textarea autoFocus rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} placeholder={`Responder ${c.plataforma === 'instagram' ? '@' : ''}${c.autor} como ${c.clienteNome}…`} />
          <div>
            <button type="button" disabled={pendente || !texto.trim()} onClick={() => rodar(() => responderComentarioAcao(c.plataforma, c.id, texto), () => { setRespondendo(false); setTexto('') })}><Reply /> Publicar resposta</button>
            <button type="button" onClick={() => setRespondendo(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div>
          <button type="button" onClick={() => setRespondendo(true)}><Reply /> Responder</button>
          <button type="button" disabled={pendente} onClick={() => rodar(() => ocultarComentarioAcao(c.plataforma, c.id, !c.oculto))}>{c.oculto ? <><Eye /> Mostrar</> : <><EyeOff /> Ocultar</>}</button>
          {alerta && <button type="button" disabled={pendente} onClick={() => rodar(() => resolverComentarioAcao(c.plataforma, c.id))}><CircleCheck /> Resolvido</button>}
        </div>
      )}
    </li>
  )
}

/** Lista de comentários com responder, ocultar e resolver. */
export function ListaComentarios({ comentarios }: { comentarios: Comentario[] }) {
  if (!comentarios.length) {
    return <p><MessageCircle />Nenhum comentário aqui. Clique em “Atualizar agora” para buscar os mais recentes.</p>
  }
  return <ul>{comentarios.map((c) => <Cartao key={`${c.plataforma}-${c.id}`} c={c} />)}</ul>
}
