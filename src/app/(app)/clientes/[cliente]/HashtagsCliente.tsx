'use client'

import { useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { lerHashtags, PLATAFORMAS_HASHTAGS, type PlataformaHashtags } from '@/dominio/hashtags'
import { salvarHashtagsClienteAcao } from '../acoes'

/** Hashtags fixas do cliente, uma aba por plataforma. Todo post do cliente publicado nela recebe essas hashtags sozinho. */
export function HashtagsCliente({ clienteId, iniciais }: { clienteId: string; iniciais: Record<PlataformaHashtags, string> }) {
  const [plataforma, setPlataforma] = useState<PlataformaHashtags>(PLATAFORMAS_HASHTAGS[0].id)
  const [textos, setTextos] = useState(iniciais)
  const [pendente, iniciar] = useTransition()
  const atual = PLATAFORMAS_HASHTAGS.find((p) => p.id === plataforma)!
  const lista = lerHashtags(textos[plataforma], atual.limite)
  return (
    <div>
      <div role="tablist">
        {PLATAFORMAS_HASHTAGS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={plataforma === p.id} onClick={() => setPlataforma(p.id)} style={{ height: 28, padding: '0 10px' }}>{p.rotulo}</button>
        ))}
        <span>TikTok, YouTube e outras entram aqui quando forem conectadas</span>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); iniciar(async () => void avisar(await salvarHashtagsClienteAcao(clienteId, plataforma, textos[plataforma]), true)) }}>
        <label>
          <span>Hashtags fixas do {atual.rotulo}</span>
          <textarea value={textos[plataforma]} onChange={(e) => setTextos((t) => ({ ...t, [plataforma]: e.target.value }))} maxLength={2000} placeholder="#marca #cidade #nicho (separe por espaço, vírgula ou linha)" />
        </label>
        <p>{lista.length} de {atual.limite} hashtags. Ao publicar no {atual.rotulo}, as que ainda não estão na legenda são acrescentadas no fim, depois de uma linha em branco. As que você já escreveu na legenda não se repetem.</p>
        {lista.length > 0 && <p>{lista.map((h) => <span key={h}>{h}</span>)}</p>}
        <button disabled={pendente}>{pendente ? 'Salvando…' : 'Salvar hashtags'}</button>
      </form>
    </div>
  )
}
