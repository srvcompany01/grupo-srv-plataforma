'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const FUSO = 'America/Belem'

/** Cartão preto: saudação, hora exata com segundos, data e as colunas de tarefas (atrasadas, hoje, 7 dias). Só mostra a hora depois de montar, para não divergir do servidor. */
export function BoasVindas({ nome, atrasadas, hoje, semana }: { nome: string; atrasadas: number; hoje: number; semana: number }) {
  const [agora, setAgora] = useState<Date | null>(null)
  useEffect(() => {
    const tique = () => setAgora(new Date())
    const inicio = setTimeout(tique, 0)
    const t = setInterval(tique, 1000)
    return () => { clearTimeout(inicio); clearInterval(t) }
  }, [])
  const hora = agora ? Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hour12: false, timeZone: FUSO }).format(agora)) % 24 : 0
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const [hm, seg] = (agora?.toLocaleTimeString('pt-BR', { timeZone: FUSO }) ?? '--:--:--').split(/:(?=\d\d$)/)
  const data = agora?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: FUSO })
  const maior = Math.max(1, atrasadas, hoje, semana)
  const colunas = [
    { rotulo: 'Atrasadas', n: atrasadas, cor: '#e5484d', letra: '#fff' },
    { rotulo: 'Hoje', n: hoje, cor: '#fff', letra: '#202020' },
    { rotulo: '7 dias', n: semana, cor: '#b38cff', letra: '#202020' },
  ]
  return (
    <section className="flex h-full min-h-72 flex-col justify-between rounded-[32px] bg-[var(--h-escuro)] p-6 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.375rem] font-medium leading-tight">{agora ? saudacao : 'Bem-vindo'}, {nome.split(' ')[0]}</h1>
          <p className="min-h-5 text-rotulo capitalize text-white/50">{data ?? ' '}</p>
        </div>
        <Link href="/inicio" className="rounded-full border border-white/20 px-4 py-1.5 text-rotulo text-white/80 transition hover:bg-white/10">Minhas tarefas</Link>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-rotulo text-white/60">Agora <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--h-acento)] text-white"><ArrowUpRight className="h-3 w-3" /></span></p>
          <p className="text-[3.25rem] font-medium leading-none tabular-nums" aria-live="off">{hm}<span className="text-2xl text-white/40">{seg ? `:${seg}` : ''}</span></p>
        </div>
        <div className="flex items-end gap-2" aria-label="Tarefas por prazo">
          {colunas.map((c) => (
            <div key={c.rotulo} className="w-[4.5rem]">
              <p className="mb-1 text-center text-legenda text-white/60">{c.rotulo}</p>
              <div className="flex h-24 items-end rounded-t-[14px] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.1)_0_1px,transparent_1px_5px)]">
                <div className="flex w-full items-center justify-center rounded-[14px] text-lg font-medium" style={{ color: c.letra, background: c.cor, height: `${Math.max(22, (c.n / maior) * 100)}%` }}>{c.n}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
