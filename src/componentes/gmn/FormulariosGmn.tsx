'use client'

import { Radar, Search, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { buscarLugaresAcao, definirLugarAcao, rodarGeogridAcao } from '@/app/(app)/gmn/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { GRADES } from '@/dominio/gmn'
import { botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import type { LugarResumo } from '@/servicos/places'

/** Procura o negócio do cliente no Google e liga o lugar certo ao cadastro. */
export function LigarLugar({ clienteId, sugestao }: { clienteId: string; sugestao: string }) {
  const [texto, setTexto] = useState(sugestao)
  const [lista, setLista] = useState<LugarResumo[] | null>(null)
  const [pendente, iniciar] = useTransition()
  const buscar = () => iniciar(async () => {
    const r = await buscarLugaresAcao(texto)
    if ('erro' in r) avisar(r)
    else setLista(r)
  })
  return (
    <div className="space-y-3">
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); buscar() }}>
        <input className={`${campo} min-w-60 flex-1`} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nome do negócio e cidade (ex.: Aurum Joalheria Belém)" aria-label="Buscar o negócio no Google" />
        <button type="submit" disabled={pendente} className={botaoPrimario}><Search className="h-4 w-4" /> {pendente ? 'Buscando…' : 'Buscar no Google'}</button>
      </form>
      {lista && (lista.length === 0 ? <p className="text-rotulo text-texto-3">Nada encontrado. Tente o nome como aparece no Maps e a cidade.</p> : (
        <ul className="divide-y divide-borda/60 rounded-lg border border-borda">
          {lista.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-rotulo">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-texto">{l.nome}</p>
                <p className="truncate text-legenda text-texto-3">{l.endereco}{l.categoria ? ` · ${l.categoria}` : ''}</p>
              </div>
              {l.nota !== null && <span className="inline-flex items-center gap-1 tabular-nums text-texto-2"><Star className="h-3.5 w-3.5 fill-[#eda100] text-[#eda100]" />{l.nota.toLocaleString('pt-BR')} ({l.avaliacoes})</span>}
              <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await definirLugarAcao(clienteId, l.id), true) })} className={botaoSecundario}>É este</button>
            </li>
          ))}
        </ul>
      ))}
    </div>
  )
}

/** Palavra-chave, tamanho da grade e raio: roda o geogrid e abre o resultado. */
export function NovaVarredura({ clienteId, base, palavraInicial }: { clienteId: string; base: string; palavraInicial: string }) {
  const router = useRouter()
  const [palavra, setPalavra] = useState(palavraInicial)
  const [grade, setGrade] = useState(5)
  const [raio, setRaio] = useState(3)
  const [pendente, iniciar] = useTransition()
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          const r = await rodarGeogridAcao(clienteId, palavra, grade, raio)
          if ('erro' in r) avisar(r)
          else router.push(`${base}&varredura=${r.id}`)
        })
      }}
    >
      <label className="block min-w-56 flex-1 space-y-1">
        <span className={rotulo}>Palavra-chave (como o cliente busca)</span>
        <input className={campo} value={palavra} onChange={(e) => setPalavra(e.target.value)} placeholder="ex.: joalheria, dentista perto de mim" maxLength={80} />
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>Grade</span>
        <select className={`${campo} w-28`} value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
          {GRADES.map((g) => <option key={g} value={g}>{g}×{g} ({g * g} pontos)</option>)}
        </select>
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>Raio</span>
        <select className={`${campo} w-28`} value={raio} onChange={(e) => setRaio(Number(e.target.value))}>
          {[0.5, 1, 2, 3, 5, 8, 10, 15, 20].map((r) => <option key={r} value={r}>{r.toLocaleString('pt-BR')} km</option>)}
        </select>
      </label>
      <button type="submit" disabled={pendente} className={botaoPrimario}><Radar className="h-4 w-4" /> {pendente ? `Varrendo ${grade * grade} pontos…` : 'Rodar geogrid'}</button>
    </form>
  )
}
