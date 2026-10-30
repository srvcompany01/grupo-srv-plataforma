'use client'

import { useRef, useState } from 'react'
import type { Formato } from '@/dominio/tipos'
import type { MidiaParaVer } from '@/lib/midias-view'
import { BotoesDownload } from './BotoesDownload'

/** Moldura com a proporção do formato: Feed 4:5, os demais 9:16. */
export function VisualizadorMidia({
  midias,
  formato,
  nomeZip,
}: {
  midias: MidiaParaVer[]
  formato: Formato
  /** Com nome, mostra os botões de download abaixo da mídia. */
  nomeZip?: string
}) {
  const [atual, setAtual] = useState(0)
  const trilho = useRef<HTMLDivElement>(null)
  // max-w limita a altura a ~60% da tela, para os botões de resposta aparecerem sem rolar
  const proporcao =
    formato === 'feed' ? 'aspect-[4/5] mx-auto max-w-[calc(60vh*4/5)]' : 'aspect-[9/16] mx-auto max-w-[calc(60vh*9/16)]'

  function irPara(i: number) {
    const el = trilho.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  if (midias.length === 0) {
    return <div className={`${proporcao} w-full rounded-xl bg-hover`} />
  }

  return (
    <div className="space-y-2">
      <div className={`relative ${proporcao} w-full overflow-hidden rounded-xl bg-black ring-1 ring-borda`}>
        <div
          ref={trilho}
          onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
        >
          {midias.map((m, i) => (
            <div key={i} className="h-full w-full shrink-0 snap-center">
              {m.tipo === 'video' ? (
                <video src={m.url} controls playsInline preload="metadata" className="h-full w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={`Imagem ${i + 1}`} className="h-full w-full object-contain" />
              )}
            </div>
          ))}
        </div>
        {midias.length > 1 && (
          <>
            <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs text-claro">
              {atual + 1}/{midias.length}
            </span>
            {atual > 0 && (
              <button
                type="button"
                aria-label="Anterior"
                onClick={() => irPara(atual - 1)}
                className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-white/90 text-texto shadow sm:block"
              >
                ‹
              </button>
            )}
            {atual < midias.length - 1 && (
              <button
                type="button"
                aria-label="Próxima"
                onClick={() => irPara(atual + 1)}
                className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-white/90 text-texto shadow sm:block"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>
      {midias.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {midias.map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === atual ? 'bg-marca' : 'bg-borda-forte'}`} />
          ))}
        </div>
      )}
      {nomeZip && <BotoesDownload midias={midias} atual={atual} nomeZip={nomeZip} />}
    </div>
  )
}
