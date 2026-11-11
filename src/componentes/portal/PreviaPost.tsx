import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import { ROTULO_FORMATO, type Formato } from '@/dominio/conteudo'
import type { MidiaPortal } from '@/servicos/portal-conteudo'

/** Prévia do post como ele aparece no Instagram (fotos/vídeos deslizando para o lado e a legenda). */
export function PreviaPost({ nome, formato, midias, legenda, collabs = [] }: { nome: string; formato: Formato; midias: MidiaPortal[]; legenda: string; collabs?: string[] }) {
  const vertical = formato === 'reels' || formato === 'stories'
  return (
    <article>
      <header>
        <span><span>{nome.slice(0, 1).toUpperCase()}</span></span>
        <span>{nome}{collabs.length > 0 && <span> e {collabs.map((c) => `@${c}`).join(', ')}</span>}</span>
        <span>{ROTULO_FORMATO[formato]}</span>
      </header>
      <div>
        {midias.length === 0 && <p>Sem mídia ainda</p>}
        {midias.map((m, i) => (
          <div key={i}>
            {m.tipo === 'video' ? (
              <video src={m.url} controls playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
              <img src={m.url} alt="" />
            )}
            {midias.length > 1 && <span>{i + 1}/{midias.length}</span>}
          </div>
        ))}
      </div>
      {formato !== 'stories' && (
        <div>
          <div><Heart /><MessageCircle /><Send /><Bookmark /></div>
          {legenda && <p><strong>{nome}</strong> {legenda}</p>}
        </div>
      )}
    </article>
  )
}
