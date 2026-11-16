'use client'

import { CalendarDays, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { urlAnuncios, type AbaAnuncios, type CanalAnuncios } from '@/dominio/central-anuncios'
import { MAX_DIAS_PERIODO, type AtalhoPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'

export function FiltrosAnuncios({ clientes, cliente, periodo, hoje, canal, aba }: { clientes: { id: string; nome: string }[]; cliente: string | null; periodo: PeriodoAnuncios; hoje: string; canal: CanalAnuncios; aba: AbaAnuncios }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [personalizado, setPersonalizado] = useState(false)
  const [de, setDe] = useState(periodo.de), [ate, setAte] = useState(periodo.ate)
  const ir = (mudanca: { cliente?: string | null; periodo?: PeriodoAnuncios; canal?: CanalAnuncios }) => iniciar(() => router.push(urlAnuncios({ cliente, periodo, canal, aba, ...mudanca }), { scroll: false }))
  const tamanho = (Date.parse(ate) - Date.parse(de)) / 86_400_000 + 1
  return (
    <div className="an-toolbar" aria-busy={pendente}>
      <label className="an-filter"><Users aria-hidden /><select aria-label="Cliente dos anúncios" value={cliente ?? ''} disabled={pendente} onChange={e => ir({ cliente: e.target.value || null })}><option value="">Todos os clientes</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
      <div className="an-period">
        <label className="an-filter"><CalendarDays aria-hidden /><select aria-label="Período dos anúncios" value={personalizado ? 'personalizado' : String(periodo.atalho ?? 'personalizado')} disabled={pendente} onChange={e => {
          if (e.target.value === 'personalizado') { setDe(periodo.de); setAte(periodo.ate); setPersonalizado(true); return }
          setPersonalizado(false)
          const atalho = ['7', '30'].includes(e.target.value) ? Number(e.target.value) as 7 | 30 : e.target.value as AtalhoPeriodo
          ir({ periodo: { de: '', ate: '', atalho } })
        }}><option value="hoje">Hoje</option><option value="ontem">Ontem</option><option value="semana">Esta semana</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="personalizado">Período personalizado</option></select></label>
        {personalizado && <form className="an-dates" onSubmit={e => { e.preventDefault(); if (tamanho > 0 && tamanho <= MAX_DIAS_PERIODO && ate <= hoje) { ir({ periodo: { de, ate, atalho: null } }); setPersonalizado(false) } }}>
          <label>De<input type="date" required value={de} max={ate || hoje} onChange={e => setDe(e.target.value)} /></label><label>Até<input type="date" required value={ate} min={de} max={hoje} onChange={e => setAte(e.target.value)} /></label>
          {tamanho > MAX_DIAS_PERIODO && <p role="alert">Escolha até {MAX_DIAS_PERIODO} dias.</p>}
          <div><button className="an-btn" type="button" onClick={() => setPersonalizado(false)}>Cancelar</button><button className="an-btn an-btn-primary" disabled={pendente || !(tamanho > 0 && tamanho <= MAX_DIAS_PERIODO)} type="submit">Aplicar</button></div>
        </form>}
      </div>
      <div className="an-channel" role="group" aria-label="Canal dos anúncios">{([['todos', 'Todos'], ['meta', 'Meta'], ['google', 'Google Ads']] as const).map(([c, nome]) => <button type="button" key={c} aria-pressed={canal === c} disabled={pendente} onClick={() => ir({ canal: c })}>{nome}</button>)}</div>
      {pendente && <span className="an-updating" role="status">Atualizando…</span>}
    </div>
  )
}
