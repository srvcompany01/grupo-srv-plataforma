'use client'

import { CalendarRange } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { consultaPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { botaoPrimario, campo } from '@/lib/ui'

const chipPadrao = (ativo: boolean) => `rounded-md px-2.5 py-1 text-rotulo font-semibold ${ativo ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`

/** Período dos resultados: hoje, ontem, esta semana, 7 e 30 dias ou datas escolhidas. */
export function SeletorPeriodo({ base, periodo, hoje, social = false }: { base: string; periodo: PeriodoAnuncios; hoje: string; /** Visual da página Social (Insights). */ social?: boolean }) {
  const chip = (ativo: boolean) => (social ? '' : chipPadrao(ativo))
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [de, setDe] = useState(periodo.de)
  const [ate, setAte] = useState(periodo.ate)
  // `base` pode já ter outros filtros (ex.: ?cliente=…): o período entra junto.
  const url = (p: PeriodoAnuncios) => (consultaPeriodo(p) ? `${base}${base.includes('?') ? '&' : '?'}${consultaPeriodo(p)}` : base)
  const selecionarHoje = () => {
    if (periodo.atalho === 'hoje') router.refresh()
    else router.push(url({ de: hoje, ate: hoje, atalho: 'hoje' }), { scroll: false })
  }
  const aplicar = () => {
    setAberto(false)
    router.push(url({ de, ate, atalho: null }), { scroll: false })
  }
  return (
    <div className="relative flex flex-wrap items-center gap-1">
      <nav className={social ? 'ins-seg' : 'flex gap-0.5 rounded-lg bg-fundo p-0.5'} aria-label="Período dos resultados">
        <button type="button" onClick={selecionarHoje} aria-pressed={periodo.atalho === 'hoje'} title={periodo.atalho === 'hoje' ? 'Atualizar dados de hoje' : 'Ver dados de hoje'} className={chip(periodo.atalho === 'hoje')}>Hoje</button>
        {([['ontem', 'Ontem'], ['semana', 'Esta semana']] as const).map(([a, r]) => <Link key={a} href={url({ de: '', ate: '', atalho: a })} scroll={false} className={chip(periodo.atalho === a)} data-on={periodo.atalho === a || undefined}>{r}</Link>)}
        {([7, 30] as const).map((d) => <Link key={d} href={url({ de: '', ate: '', atalho: d })} scroll={false} className={chip(periodo.atalho === d)} data-on={periodo.atalho === d || undefined}>{d} dias</Link>)}
        <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} aria-haspopup="dialog" data-on={!periodo.atalho || undefined} className={`${chip(!periodo.atalho)} inline-flex items-center gap-1`}>
          <CalendarRange className="h-3.5 w-3.5" /> {periodo.atalho ? 'Personalizado' : rotuloPeriodo(periodo)}
        </button>
      </nav>
      {aberto && (
        <div role="dialog" aria-label="Escolher período" className="absolute right-0 top-full z-30 mt-1 w-64 space-y-2 rounded-lg border border-borda bg-white p-3 shadow-flutuante">
          <label className="block space-y-1"><span className="text-legenda text-texto-3">De</span><input type="date" value={de} max={ate || hoje} onChange={(e) => setDe(e.target.value)} className={`${campo} h-9`} /></label>
          <label className="block space-y-1"><span className="text-legenda text-texto-3">Até</span><input type="date" value={ate} min={de} max={hoje} onChange={(e) => setAte(e.target.value)} className={`${campo} h-9`} /></label>
          <button type="button" onClick={aplicar} disabled={!de || !ate || de > ate} className={`${botaoPrimario} w-full`}>Aplicar</button>
        </div>
      )}
    </div>
  )
}
