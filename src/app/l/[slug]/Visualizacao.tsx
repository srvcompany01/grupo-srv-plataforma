'use client'

import { useEffect } from 'react'

/** Avisa o servidor que a página abriu de verdade (quem clica e desiste antes disso não conta como visualização). */
export function Visualizacao({ origem }: { origem: string }) {
  useEffect(() => {
    const url = `${location.pathname.replace(/\/$/, '')}/v?o=${encodeURIComponent(origem)}`
    if (!navigator.sendBeacon?.(url)) void fetch(url, { method: 'POST', keepalive: true }).catch(() => undefined)
  }, [origem])
  return null
}
