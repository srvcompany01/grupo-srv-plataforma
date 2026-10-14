'use client'

import { Monitor, Square, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DURACAO_MAX_GRAVACAO_S } from '@/dominio/anexos'
import { formatarRelogio } from '@/dominio/formatar'
import { escolherMime, MIMES_AUDIO, MIMES_VIDEO, nomeGravacao } from '@/dominio/gravacao'
import { botaoFantasma, botaoPrimario, botaoSecundario } from '@/lib/ui'

type Fase = 'escolha' | 'iniciando' | 'gravando' | 'previa'
type Fonte = 'tela' | 'camera'

const NEGADO = { audio: 'Permita o acesso ao microfone no navegador.', camera: 'Permita o acesso à câmera e ao microfone no navegador.', tela: 'Permita o acesso à tela no navegador.' }

export function Gravador({
  modo,
  aoConcluir,
  aoCancelar,
}: {
  modo: 'audio' | 'video'
  aoConcluir: (blob: Blob, nome: string) => void
  aoCancelar: () => void
}) {
  const [fase, setFase] = useState<Fase>(modo === 'audio' ? 'iniciando' : 'escolha')
  const [segundos, setSegundos] = useState(0)
  const [previa, setPrevia] = useState<{ blob: Blob; url: string; nome: string } | null>(null)
  const trilhas = useRef<MediaStreamTrack[]>([])
  const gravador = useRef<MediaRecorder | null>(null)
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelado = useRef(false)
  const urlPrevia = useRef<string | null>(null)

  function pararTrilhas() {
    trilhas.current.forEach((t) => t.stop())
    trilhas.current = []
    if (relogio.current) clearInterval(relogio.current)
    relogio.current = null
  }

  async function iniciar(fonte: 'audio' | Fonte) {
    const fontes: MediaStream[] = []
    try {
      if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices) throw Object.assign(new Error('suporte'), { name: 'NaoSuportado' })
      let stream: MediaStream
      if (fonte === 'audio') {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
        fontes.push(mic)
        stream = mic
      } else if (fonte === 'camera') {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        fontes.push(cam)
        stream = cam
      } else {
        const tela = await navigator.mediaDevices.getDisplayMedia({ video: true })
        fontes.push(tela)
        stream = new MediaStream(tela.getVideoTracks())
        // Microfone é opcional: sem permissão, grava só a tela.
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
          fontes.push(mic)
          mic.getAudioTracks().forEach((t) => stream.addTrack(t))
        } catch {
          /* segue sem áudio */
        }
      }
      const todas = fontes.flatMap((s) => s.getTracks())
      if (cancelado.current) {
        todas.forEach((t) => t.stop())
        return
      }
      trilhas.current = todas

      const mime = escolherMime(modo === 'audio' ? MIMES_AUDIO : MIMES_VIDEO, (m) => MediaRecorder.isTypeSupported(m))
      if (!mime) throw Object.assign(new Error('suporte'), { name: 'NaoSuportado' })
      const rec = new MediaRecorder(stream, { mimeType: mime })
      const partes: Blob[] = []
      rec.ondataavailable = (e) => e.data.size > 0 && partes.push(e.data)
      rec.onstop = () => {
        pararTrilhas()
        if (cancelado.current) return
        const blob = new Blob(partes, { type: mime })
        const url = URL.createObjectURL(blob)
        urlPrevia.current = url
        setPrevia({ blob, url, nome: nomeGravacao(modo, mime, new Date()) })
        setFase('previa')
      }
      gravador.current = rec
      // Compartilhamento encerrado pelo botão do navegador.
      stream.getVideoTracks()[0]?.addEventListener('ended', () => rec.state !== 'inactive' && rec.stop())
      rec.start(1000)
      const inicio = Date.now()
      setSegundos(0)
      setFase('gravando')
      relogio.current = setInterval(() => {
        const s = Math.floor((Date.now() - inicio) / 1000)
        setSegundos(s)
        if (s >= DURACAO_MAX_GRAVACAO_S && rec.state !== 'inactive') rec.stop()
      }, 1000)
    } catch (e) {
      fontes.flatMap((s) => s.getTracks()).forEach((t) => t.stop())
      pararTrilhas()
      if (cancelado.current) return
      const nome = (e as { name?: string }).name
      if (nome === 'NaoSuportado') toast.error('Seu navegador não permite gravar neste formato.')
      else if (nome === 'NotAllowedError' || nome === 'SecurityError') toast.error(NEGADO[fonte === 'audio' ? 'audio' : fonte])
      else if (nome === 'NotFoundError') toast.error('Nenhum microfone ou câmera encontrado.')
      else toast.error('Não foi possível iniciar a gravação.')
      aoCancelar()
    }
  }

  useEffect(() => {
    cancelado.current = false
    // Abrir o microfone é sincronizar com um sistema externo; os setState só rodam depois de awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (modo === 'audio') void iniciar('audio')
    return () => {
      cancelado.current = true
      if (gravador.current && gravador.current.state !== 'inactive') gravador.current.stop()
      pararTrilhas()
      if (urlPrevia.current) URL.revokeObjectURL(urlPrevia.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo])

  return (
    <div className="space-y-2 rounded-md border border-borda bg-white p-2 text-corpo">
      {fase === 'escolha' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-texto-2">Gravar:</span>
          <button type="button" onClick={() => {
              setFase('iniciando')
              void iniciar('tela')
            }} className={botaoSecundario}>
            <Monitor className="h-4 w-4" /> Tela
          </button>
          <button type="button" onClick={() => {
              setFase('iniciando')
              void iniciar('camera')
            }} className={botaoSecundario}>
            <Video className="h-4 w-4" /> Câmera
          </button>
          <button type="button" onClick={aoCancelar} className={botaoFantasma}>
            Cancelar
          </button>
        </div>
      )}
      {fase === 'iniciando' && <p className="text-texto-3">Aguardando permissão…</p>}
      {fase === 'gravando' && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-perigo" />
          <span className="font-mono tabular-nums">
            {formatarRelogio(segundos)} / {formatarRelogio(DURACAO_MAX_GRAVACAO_S)}
          </span>
          <button type="button" onClick={() => gravador.current?.stop()} className={`${botaoSecundario} ml-auto`}>
            <Square className="h-3.5 w-3.5" /> Parar
          </button>
        </div>
      )}
      {fase === 'previa' && previa && (
        <div className="space-y-2">
          {modo === 'audio' ? <audio src={previa.url} controls className="w-full" /> : <video src={previa.url} controls className="max-h-48 w-full rounded" />}
          <div className="flex gap-1">
            <button type="button" onClick={() => aoConcluir(previa.blob, previa.nome)} className={botaoPrimario}>
              Usar
            </button>
            <button type="button" onClick={aoCancelar} className={botaoFantasma}>
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
