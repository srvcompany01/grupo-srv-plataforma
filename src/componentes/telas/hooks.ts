'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { salvarTelaAcao } from '@/app/(app)/telas/acoes'
import { CAMERA_INICIAL, telaParaMundo, zoomNoPonto, type Camera } from '@/dominio/tela'
import type { TipoTela } from '@/servicos/telas'

/** Câmera da tela infinita: rolar o mouse/trackpad move, Ctrl/⌘ + rolar (ou pinça) dá zoom no ponto do cursor. */
export function useCamera(inicial: Camera = CAMERA_INICIAL) {
  const area = useRef<HTMLDivElement>(null)
  const [camera, setCamera] = useState(inicial)
  const atual = useRef(camera)
  useEffect(() => {
    atual.current = camera
  })

  useEffect(() => {
    const el = area.current
    if (!el) return
    const aoRolar = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) setCamera((c) => zoomNoPonto(c, e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.01)))
      else setCamera((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }))
    }
    el.addEventListener('wheel', aoRolar, { passive: false })
    return () => el.removeEventListener('wheel', aoRolar)
  }, [])

  const aproximar = useCallback(
    (fator: number) => {
      const r = area.current?.getBoundingClientRect()
      setCamera((c) => zoomNoPonto(c, (r?.width ?? 0) / 2, (r?.height ?? 0) / 2, fator))
    },
    [],
  )
  /** Ponto da janela (clientX/Y) em coordenadas do mundo, com a câmera de agora. */
  const paraMundo = useCallback(
    (clientX: number, clientY: number) => {
      const r = area.current?.getBoundingClientRect()
      return telaParaMundo(atual.current, clientX - (r?.left ?? 0), clientY - (r?.top ?? 0))
    },
    [],
  )
  const tamanho = useCallback(() => {
    const r = area.current?.getBoundingClientRect()
    return { largura: r?.width ?? 0, altura: r?.height ?? 0 }
  }, [area])
  return { area, camera, setCamera, aproximar, paraMundo, tamanho }
}

/** Acompanha um arrasto fora do elemento (pointermove/up na janela). `mover` recebe o deslocamento em pixels da tela. */
export function arrastar(evento: { clientX: number; clientY: number }, mover: (dx: number, dy: number, e: PointerEvent) => void, fim?: (moveu: boolean, e: PointerEvent) => void) {
  const x0 = evento.clientX
  const y0 = evento.clientY
  let moveu = false
  const aoMover = (e: PointerEvent) => {
    const dx = e.clientX - x0
    const dy = e.clientY - y0
    if (!moveu && Math.hypot(dx, dy) < 3) return
    moveu = true
    mover(dx, dy, e)
  }
  const aoSoltar = (e: PointerEvent) => {
    window.removeEventListener('pointermove', aoMover)
    window.removeEventListener('pointerup', aoSoltar)
    window.removeEventListener('pointercancel', aoSoltar)
    fim?.(moveu, e)
  }
  window.addEventListener('pointermove', aoMover)
  window.addEventListener('pointerup', aoSoltar)
  window.addEventListener('pointercancel', aoSoltar)
}

export type SituacaoSalvamento = 'salvo' | 'pendente' | 'salvando' | 'erro'

/** Salva sozinho 1,2 s depois da última alteração, uma gravação por vez, e avisa se sair com algo por salvar. */
export function useAutosave(tipo: TipoTela, id: string, dados: unknown, mudou: boolean) {
  const [estado, setEstado] = useState<'ocioso' | 'salvando' | 'erro'>('ocioso')
  const [salvoCom, setSalvoCom] = useState(dados)
  const ultimo = useRef(dados)
  const sujo = useRef(false)
  const gravando = useRef(false)
  useEffect(() => {
    ultimo.current = dados
  })

  const gravar = useCallback(async () => {
    if (gravando.current) return
    gravando.current = true
    try {
      while (sujo.current) {
        sujo.current = false
        const copia = ultimo.current
        setEstado('salvando')
        const r = await salvarTelaAcao(tipo, id, copia)
        if (r?.erro) {
          sujo.current = true
          setEstado('erro')
          return
        }
        setSalvoCom(copia)
      }
      setEstado('ocioso')
    } finally {
      gravando.current = false
    }
  }, [tipo, id])

  useEffect(() => {
    if (!mudou) return
    sujo.current = true
    const t = setTimeout(gravar, 1200)
    return () => clearTimeout(t)
  }, [dados, mudou, gravar])

  // Ao sair da página com algo por salvar, grava na hora (a ação segue no servidor mesmo com a página trocando).
  useEffect(
    () => () => {
      if (sujo.current && !gravando.current) void gravar()
    },
    [gravar],
  )
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (sujo.current || gravando.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [])
  const situacao: SituacaoSalvamento = estado === 'salvando' ? 'salvando' : estado === 'erro' ? 'erro' : dados !== salvoCom ? 'pendente' : 'salvo'
  return { situacao, salvarAgora: gravar }
}
