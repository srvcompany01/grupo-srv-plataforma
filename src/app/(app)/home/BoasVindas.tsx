'use client'

import { useEffect, useState } from 'react'

const FUSO = 'America/Belem'

/** Saudação, hora exata (com segundos) e data por extenso, no fuso da agência. Só aparece depois de montar, para não divergir do servidor. */
export function BoasVindas({ nome }: { nome: string }) {
  const [agora, setAgora] = useState<Date | null>(null)
  useEffect(() => {
    const tique = () => setAgora(new Date())
    const inicio = setTimeout(tique, 0)
    const t = setInterval(tique, 1000)
    return () => { clearTimeout(inicio); clearInterval(t) }
  }, [])
  const hora = agora ? Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hour12: false, timeZone: FUSO }).format(agora)) % 24 : 0
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const relogio = agora?.toLocaleTimeString('pt-BR', { timeZone: FUSO })
  const data = agora?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: FUSO })
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="eyebrow">{agora ? saudacao : 'Bem-vindo'}</p>
        <h1 className="page-title mt-1">{nome.split(' ')[0]}, que bom te ver por aqui</h1>
      </div>
      <div className="text-right" aria-live="off">
        <p className="min-h-9 text-3xl font-bold tabular-nums text-texto">{relogio ?? ' '}</p>
        <p className="min-h-5 text-rotulo capitalize text-texto-3">{data ?? ' '}</p>
      </div>
    </header>
  )
}
