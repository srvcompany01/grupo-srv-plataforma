'use client'

import { useEffect } from 'react'
import { presencaAcao } from '@/app/(app)/time/acoes'
import { INTERVALO_PRESENCA_MS, OCIOSO_APOS_MS } from '@/dominio/time'

/** Avisa o servidor a cada minuto que o site está aberto e se a pessoa mexeu na tela (com a aba à vista) nos últimos 5 minutos. */
export function Presenca() {
  useEffect(() => {
    let ultimoMovimento = Date.now()
    const mexeu = () => { ultimoMovimento = Date.now() }
    const eventos = ['pointerdown', 'keydown', 'scroll', 'mousemove', 'touchstart'] as const
    eventos.forEach((e) => window.addEventListener(e, mexeu, { passive: true }))
    // Aba em segundo plano continua avisando (site aberto), mas não conta como ativo.
    const avisar = () => void presencaAcao(document.visibilityState === 'visible' && Date.now() - ultimoMovimento < OCIOSO_APOS_MS)
    avisar()
    const id = setInterval(avisar, INTERVALO_PRESENCA_MS)
    const aoVoltar = () => { if (document.visibilityState === 'visible') { mexeu(); avisar() } }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      clearInterval(id)
      eventos.forEach((e) => window.removeEventListener(e, mexeu))
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [])
  return null
}
