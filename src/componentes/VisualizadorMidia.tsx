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

  function irPara(i: number) {
    const el = trilho.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  if (midias.length === 0) {
    return <div />
  }

  return (
    <div>
      <div>
        <div
          ref={trilho}
          onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {midias.map((m, i) => (
            <div key={i}>
              {m.tipo === 'video' ? (
                <video src={m.url} controls playsInline preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={`Imagem ${i + 1}`} />
              )}
            </div>
          ))}
        </div>
        {midias.length > 1 && (
          <>
            <span>
              {atual + 1}/{midias.length}
            </span>
            {atual > 0 && (
              <button
                type="button"
                aria-label="Anterior"
                onClick={() => irPara(atual - 1)}
                className="hidden"
              >
                ‹
              </button>
            )}
            {atual < midias.length - 1 && (
              <button
                type="button"
                aria-label="Próxima"
                onClick={() => irPara(atual + 1)}
                className="hidden"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>
      {midias.length > 1 && (
        <div>
          {midias.map((_, i) => (
            <span key={i} />
          ))}
        </div>
      )}
      {nomeZip && <BotoesDownload midias={midias} atual={atual} nomeZip={nomeZip} />}
    </div>
  )
}
