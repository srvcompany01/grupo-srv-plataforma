'use client'

import { BellRing, Radar, Search, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { buscarLugaresAcao, definirLugarAcao, monitorarAcao, rodarGeogridAcao } from '@/app/(app)/gmn/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { GRADES } from '@/dominio/gmn'
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
    <div>
      <form onSubmit={(e) => { e.preventDefault(); buscar() }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nome do negócio e cidade (ex.: Aurum Joalheria Belém)" aria-label="Buscar o negócio no Google" />
        <button type="submit" disabled={pendente}><Search /> {pendente ? 'Buscando…' : 'Buscar no Google'}</button>
      </form>
      {lista && (lista.length === 0 ? <p>Nada encontrado. Tente o nome como aparece no Maps e a cidade.</p> : (
        <ul>
          {lista.map((l) => (
            <li key={l.id}>
              <div>
                <p>{l.nome}</p>
                <p>{l.endereco}{l.categoria ? ` · ${l.categoria}` : ''}</p>
              </div>
              {l.nota !== null && <span><Star />{l.nota.toLocaleString('pt-BR')} ({l.avaliacoes})</span>}
              <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await definirLugarAcao(clienteId, l.id), true) })}>É este</button>
            </li>
          ))}
        </ul>
      ))}
    </div>
  )
}

/** Palavra-chave, tamanho da grade e raio: roda o geogrid e abre o resultado. */
export function NovaVarredura({ clienteId, base, palavraInicial, gradeInicial = 5, raioInicial = 3 }: { clienteId: string; base: string; palavraInicial: string; gradeInicial?: number; raioInicial?: number }) {
  const router = useRouter()
  const [palavra, setPalavra] = useState(palavraInicial)
  const [grade, setGrade] = useState(gradeInicial)
  const [raio, setRaio] = useState(raioInicial)
  const [pendente, iniciar] = useTransition()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          const r = await rodarGeogridAcao(clienteId, palavra, grade, raio)
          if ('erro' in r) avisar(r)
          else router.push(`${base}&varredura=${r.id}`)
        })
      }}
    >
      <label>
        <span>Palavra-chave (como o cliente busca)</span>
        <input value={palavra} onChange={(e) => setPalavra(e.target.value)} placeholder="ex.: joalheria, dentista perto de mim" maxLength={80} />
      </label>
      <label>
        <span>Grade</span>
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
          {GRADES.map((g) => <option key={g} value={g}>{g}×{g} ({g * g} pontos)</option>)}
        </select>
      </label>
      <label>
        <span>Raio</span>
        <select value={raio} onChange={(e) => setRaio(Number(e.target.value))}>
          {[...new Set([0.5, 1, 2, 3, 5, 8, 10, 15, 20, raioInicial])].sort((a, b) => a - b).map((r) => <option key={r} value={r}>{r.toLocaleString('pt-BR')} km</option>)}
        </select>
      </label>
      <button type="submit" disabled={pendente}><Radar /> {pendente ? `Varrendo ${grade * grade} pontos…` : 'Rodar geogrid'}</button>
    </form>
  )
}

/** Liga ou desliga o geogrid automático (toda segunda) de uma palavra. */
export function BotaoMonitor({ clienteId, palavra, grade, raioKm, ligado }: { clienteId: string; palavra: string; grade: number; raioKm: number; ligado: boolean }) {
  const [pendente, iniciar] = useTransition()
  return (
    <button type="button" disabled={pendente} onClick={() => iniciar(async () => { avisar(await monitorarAcao(clienteId, palavra, grade, raioKm, !ligado), true) })}>
      <BellRing /> {ligado ? 'Parar' : 'Acompanhar toda semana'}
    </button>
  )
}
