import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import { ROTULO_FORMATO, type Formato } from '@/dominio/conteudo'
import type { MidiaPortal } from '@/servicos/portal-conteudo'

/** Prévia do post como ele aparece no Instagram (fotos/vídeos deslizando para o lado e a legenda). */
export function PreviaPost({ nome, formato, midias, legenda }: { nome: string; formato: Formato; midias: MidiaPortal[]; legenda: string }) {
  const vertical = formato === 'reels' || formato === 'stories'
  return (
    <article className="mx-auto w-full max-w-[420px] overflow-hidden rounded-xl border border-borda bg-white shadow-sm">
      <header className="flex items-center gap-2 px-3 py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]"><span className="flex h-full w-full items-center justify-center rounded-full bg-white text-legenda font-bold text-texto">{nome.slice(0, 1).toUpperCase()}</span></span>
        <span className="text-rotulo font-semibold text-texto">{nome}</span>
        <span className="ml-auto rounded-full bg-fundo px-2 py-0.5 text-micro font-semibold text-texto-2">{ROTULO_FORMATO[formato]}</span>
      </header>
      <div className={`flex snap-x snap-mandatory overflow-x-auto bg-black ${vertical ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}>
        {midias.length === 0 && <p className="m-auto text-rotulo text-white/70">Sem mídia ainda</p>}
        {midias.map((m, i) => (
          <div key={i} className="relative h-full w-full shrink-0 snap-center">
            {m.tipo === 'video' ? (
              <video src={m.url} controls playsInline className="h-full w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
              <img src={m.url} alt="" className="h-full w-full object-contain" />
            )}
            {midias.length > 1 && <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-micro font-semibold text-white">{i + 1}/{midias.length}</span>}
          </div>
        ))}
      </div>
      {formato !== 'stories' && (
        <div className="space-y-2 px-3 py-2.5">
          <div className="flex items-center gap-3 text-texto"><Heart className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><Send className="h-5 w-5" /><Bookmark className="ml-auto h-5 w-5" /></div>
          {legenda && <p className="whitespace-pre-wrap break-words text-rotulo text-texto"><strong>{nome}</strong> {legenda}</p>}
        </div>
      )}
    </article>
  )
}
