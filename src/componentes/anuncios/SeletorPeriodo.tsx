'use client'

import { CalendarRange } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { consultaPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'

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
    <div>
      <nav aria-label="Período dos resultados">
        <button type="button" onClick={selecionarHoje} aria-pressed={periodo.atalho === 'hoje'} title={periodo.atalho === 'hoje' ? 'Atualizar dados de hoje' : 'Ver dados de hoje'}>Hoje</button>
        {([['ontem', 'Ontem'], ['semana', 'Esta semana']] as const).map(([a, r]) => <Link key={a} href={url({ de: '', ate: '', atalho: a })} scroll={false} data-on={periodo.atalho === a || undefined}>{r}</Link>)}
        {([7, 30] as const).map((d) => <Link key={d} href={url({ de: '', ate: '', atalho: d })} scroll={false} data-on={periodo.atalho === d || undefined}>{d} dias</Link>)}
        <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} aria-haspopup="dialog" data-on={!periodo.atalho || undefined}>
          <CalendarRange /> {periodo.atalho ? 'Personalizado' : rotuloPeriodo(periodo)}
        </button>
      </nav>
      {aberto && (
        <div role="dialog" aria-label="Escolher período">
          <label><span>De</span><input type="date" value={de} max={ate || hoje} onChange={(e) => setDe(e.target.value)} /></label>
          <label><span>Até</span><input type="date" value={ate} min={de} max={hoje} onChange={(e) => setAte(e.target.value)} /></label>
          <button type="button" onClick={aplicar} disabled={!de || !ate || de > ate}>Aplicar</button>
        </div>
      )}
    </div>
  )
}
