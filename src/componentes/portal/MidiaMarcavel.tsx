'use client'

import { Check, ImageOff, Pause, Play } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { formatarInstante, moverMira, retanguloDaMidia, type ComentarioNumerado, type Retangulo } from '@/dominio/prova-visual'
import type { MidiaPortal } from '@/servicos/portal-conteudo'

export type PontoMarcado = { midia: number; x: number | null; y: number | null; segundo: number | null }

type Props = {
  midias: MidiaPortal[]
  vertical: boolean
  /** Raízes visíveis (abertas, ou resolvidas na aba Resolvidos). */
  comentarios: ComentarioNumerado[]
  selecionadoId: string | null
  aoSelecionar: (id: string) => void
  /** Modo de marcação (só o cliente, versão ainda sem resposta). */
  marcando: boolean
  aoMarcar?: (p: PontoMarcado) => void
  /** Mídia à vista e vídeos, para o botão "Comentar em 0:12" e a navegação. */
  aoMudarAtiva?: (indice: number) => void
  videos?: React.MutableRefObject<Map<number, HTMLVideoElement>>
  /** Índice a mostrar (clicar num comentário da lista rola até a mídia dele). */
  irPara?: number | null
}

const MARCADOR = 'absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none'

/** Uma mídia com os marcadores dos comentários por cima, na posição em % da própria mídia (sem as faixas do letterbox). */
function Slide({ indice, midia, comentarios, selecionadoId, aoSelecionar, marcando, aoMarcar, videos, ativa }: { indice: number; midia: MidiaPortal; ativa: boolean } & Pick<Props, 'comentarios' | 'selecionadoId' | 'aoSelecionar' | 'marcando' | 'aoMarcar' | 'videos'>) {
  const caixa = useRef<HTMLDivElement>(null)
  const [tamanho, setTamanho] = useState({ largura: 0, altura: 0 })
  const [natural, setNatural] = useState<{ largura: number; altura: number } | null>(null)
  const [erro, setErro] = useState(false)
  const [mira, setMira] = useState({ x: 50, y: 50 })
  const [tocando, setTocando] = useState(false)
  const [instante, setInstante] = useState(0)
  const [duracao, setDuracao] = useState(0)
  const video = useRef<HTMLVideoElement | null>(null)

  useLayoutEffect(() => {
    const el = caixa.current
    if (!el) return
    const medir = () => setTamanho({ largura: el.clientWidth, altura: el.clientHeight })
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    const mapa = videos?.current
    if (video.current && mapa) mapa.set(indice, video.current)
    return () => {
      mapa?.delete(indice)
    }
  }, [indice, videos, midia.url])
  useEffect(() => {
    if (!ativa) video.current?.pause()
  }, [ativa])

  const ret: Retangulo = retanguloDaMidia(tamanho, natural)
  const daqui = comentarios.filter((c) => c.midia === indice)
  const comPonto = daqui.filter((c) => c.x !== null && c.y !== null)
  const noVideo = daqui.filter((c) => c.segundo !== null)

  function marcar(x: number, y: number) {
    aoMarcar?.({ midia: indice, x, y, segundo: video.current ? video.current.currentTime : null })
  }
  function aoToque(e: React.PointerEvent<HTMLDivElement>) {
    if (!marcando) return
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    marcar(Math.round(((e.clientX - r.left) / r.width) * 10000) / 100, Math.round(((e.clientY - r.top) / r.height) * 10000) / 100)
  }
  function aoTeclar(e: React.KeyboardEvent) {
    if (!marcando) return
    if (e.key === 'Enter') {
      e.preventDefault()
      marcar(mira.x, mira.y)
    } else if (e.key.startsWith('Arrow')) {
      e.preventDefault()
      setMira((m) => moverMira(m, e.key, e.shiftKey))
    }
  }

  const ehVideo = midia.tipo === 'video'
  return (
    <div className="relative flex h-full w-full shrink-0 snap-center flex-col">
      <div ref={caixa} className="relative min-h-0 flex-1">
        {erro ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-hover text-texto-2">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
            <p className="text-rotulo">Não foi possível carregar a imagem</p>
            <button type="button" className="rounded-md border border-borda bg-white px-3 py-1 text-rotulo font-semibold" onClick={() => setErro(false)}>Recarregar</button>
          </div>
        ) : ehVideo ? (
          <video
            ref={video}
            src={midia.url}
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
            onLoadedMetadata={(e) => { setNatural({ largura: e.currentTarget.videoWidth, altura: e.currentTarget.videoHeight }); setDuracao(e.currentTarget.duration || 0) }}
            onTimeUpdate={(e) => setInstante(e.currentTarget.currentTime)}
            onPlay={() => setTocando(true)}
            onPause={() => setTocando(false)}
            onError={() => setErro(true)}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
          <img src={midia.url} alt="" className="h-full w-full object-contain" onLoad={(e) => setNatural({ largura: e.currentTarget.naturalWidth, altura: e.currentTarget.naturalHeight })} onError={() => setErro(true)} />
        )}
        {/* Camada com o tamanho exato da mídia: o toque aqui já vira % da mídia. Os marcadores só aparecem depois de medir a mídia. */}
        {!erro && natural && (
          <div
            data-marcacao={marcando ? 'ativa' : undefined}
            role={marcando && ativa ? 'application' : undefined}
            aria-label={marcando && ativa ? 'Escolha o ponto: use as setas e Enter' : undefined}
            tabIndex={marcando && ativa ? 0 : -1}
            onPointerDown={aoToque}
            onKeyDown={aoTeclar}
            className={`absolute focus-visible:outline-2 focus-visible:outline-[var(--focus)] ${marcando ? 'cursor-crosshair touch-none' : 'pointer-events-none'}`}
            style={{ left: ret.x, top: ret.y, width: ret.largura, height: ret.altura }}
          >
            {comPonto.map((c) => {
              const resolvido = !!c.resolvidoEm
              const selecionado = c.id === selecionadoId
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`Comentário ${c.numero}, ${resolvido ? 'resolvido' : 'aberto'}: ${c.texto.slice(0, 60)}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => aoSelecionar(c.id)}
                  className={`${MARCADOR} pointer-events-auto`}
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-legenda font-semibold text-white ring-2 transition-transform duration-[120ms] motion-reduce:transition-none ${resolvido ? 'bg-sucesso-forte ring-white' : 'bg-[var(--red)] ring-white shadow-[var(--shadow-pop)]'} ${selecionado ? 'scale-[1.15] !ring-[var(--focus)]' : ''}`}>
                    {resolvido ? <Check className="h-3 w-3" aria-hidden="true" /> : c.numero}
                  </span>
                </button>
              )
            })}
            {marcando && ativa && (
              <span aria-hidden="true" className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--red)]/40" style={{ left: `${mira.x}%`, top: `${mira.y}%` }} />
            )}
          </div>
        )}
      </div>
      {ehVideo && !erro && (
        <div className="flex items-center gap-2 bg-black/80 px-2 py-1.5 text-claro">
          <button type="button" aria-label={tocando ? 'Pausar' : 'Reproduzir'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10" onClick={() => (tocando ? video.current?.pause() : void video.current?.play())}>
            {tocando ? <Pause className="h-4 w-4 fill-current" aria-hidden="true" /> : <Play className="h-4 w-4 fill-current" aria-hidden="true" />}
          </button>
          <div className="relative min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={duracao || 1}
              step={0.1}
              value={Math.min(instante, duracao || 1)}
              aria-label="Linha do tempo"
              aria-valuetext={`${formatarInstante(instante)} de ${formatarInstante(duracao)}`}
              onChange={(e) => { if (video.current) video.current.currentTime = Number(e.target.value) }}
              className="h-11 w-full"
            />
            {noVideo.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-label={`Comentário ${c.numero} em ${formatarInstante(c.segundo!)}`}
                onClick={() => { if (video.current) { video.current.pause(); video.current.currentTime = c.segundo! } aoSelecionar(c.id) }}
                className="absolute top-0 flex h-4 w-6 -translate-x-1/2 items-start justify-center"
                style={{ left: `${duracao ? (c.segundo! / duracao) * 100 : 0}%` }}
              >
                <span className={`h-2 w-2 rounded-full ${c.resolvidoEm ? 'bg-sucesso' : 'bg-[var(--red)]'}`} />
              </button>
            ))}
          </div>
          <span className="shrink-0 text-legenda tabular-nums">{formatarInstante(instante)} / {formatarInstante(duracao)}</span>
        </div>
      )}
    </div>
  )
}

export function MidiaMarcavel(p: Props) {
  const trilho = useRef<HTMLDivElement>(null)
  const [ativa, setAtiva] = useState(0)
  const mudar = useCallback((i: number) => { setAtiva(i); p.aoMudarAtiva?.(i) }, [p])
  useEffect(() => {
    if (p.irPara == null || !trilho.current) return
    trilho.current.scrollTo({ left: p.irPara * trilho.current.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [p.irPara])

  if (p.midias.length === 0) {
    return <div className={`flex items-center justify-center bg-black ${p.vertical ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}><p className="text-rotulo text-claro/70">Sem mídia ainda</p></div>
  }
  return (
    <div>
      <div
        ref={trilho}
        // Na marcação a rolagem lateral trava: o toque é para marcar, não para arrastar o carrossel.
        className={`flex bg-black ${p.marcando ? 'snap-none overflow-x-hidden' : 'snap-x snap-mandatory overflow-x-auto'} ${p.vertical ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}
        onScroll={(e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth)); if (i !== ativa) mudar(i) }}
      >
        {p.midias.map((m, i) => (
          <Slide key={i} indice={i} midia={m} ativa={i === ativa} comentarios={p.comentarios} selecionadoId={p.selecionadoId} aoSelecionar={p.aoSelecionar} marcando={p.marcando} aoMarcar={p.aoMarcar} videos={p.videos} />
        ))}
      </div>
      {p.midias.length > 1 && <p className="py-1 text-center text-legenda text-texto-2" aria-live="polite">{p.midias[ativa]?.tipo === 'video' ? 'Vídeo' : 'Imagem'} {ativa + 1} de {p.midias.length}</p>}
    </div>
  )
}
