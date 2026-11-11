'use client'

import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { salvarEstrategiaAcao } from '@/app/(app)/estrategia/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import type { DadosEstrategia, Metodo } from '@/dominio/estrategia'

/**
 * Edição "no próprio desenho": cada pedaço do quadro é um campo que se edita clicando nele, e o documento
 * se salva sozinho ~0,7 s depois da última alteração. Com `leitura`, os mesmos componentes só mostram o conteúdo.
 */

type Mudar = (fn: (d: DadosEstrategia) => DadosEstrategia) => void
type Ctx = { d: DadosEstrategia; leitura: boolean; mudar: Mudar }
const Contexto = createContext<Ctx>({ d: { textos: {}, listas: {}, marcados: [] }, leitura: true, mudar: () => {} })
export const useEstrategia = () => useContext(Contexto)

export function Editor({ clienteId, metodo, inicial, leitura = false, children }: { clienteId: string; metodo: Metodo; inicial: DadosEstrategia; leitura?: boolean; children: ReactNode }) {
  const [d, setD] = useState(inicial)
  const [estado, setEstado] = useState<'salvo' | 'salvando' | 'erro' | null>(null)
  const pendente = useRef<DadosEstrategia | null>(null)

  const salvar = useCallback(async () => {
    const dados = pendente.current
    if (!dados) return
    pendente.current = null
    const r = await salvarEstrategiaAcao(clienteId, metodo, dados)
    setEstado(r?.erro ? 'erro' : 'salvo')
    if (r?.erro) avisar(r)
  }, [clienteId, metodo])

  useEffect(() => {
    if (d === inicial) return
    pendente.current = d
    const t = setTimeout(salvar, 700)
    return () => clearTimeout(t)
  }, [d, inicial, salvar])
  // Saiu da página antes do salvamento: grava na hora.
  useEffect(() => () => void salvar(), [salvar])

  const mudar: Mudar = (fn) => {
    setEstado('salvando')
    setD(fn)
  }
  return (
    <Contexto.Provider value={{ d, leitura, mudar }}>
      {!leitura && (
        <p aria-live="polite" data-estado={estado ?? 'salvo'}>
          {estado === 'salvando' ? 'Salvando…' : estado === 'erro' ? 'Não salvou: tente de novo' : 'Tudo salvo · clique em qualquer parte do quadro para escrever'}
        </p>
      )}
      {children}
    </Contexto.Provider>
  )
}

/** Texto livre de uma chave. `id` permite focar o campo de fora (ex.: clicando no desenho). */
export function Texto({ k, ph = 'Clique para escrever…', className = '', id }: { k: string; ph?: string; className?: string; id?: string }) {
  const { d, leitura, mudar } = useEstrategia()
  const v = d.textos[k] ?? ''
  if (leitura) return <p>{v || '—'}</p>
  return <textarea id={id} value={v} rows={1} maxLength={4000} placeholder={ph} aria-label={ph} onChange={(e) => { const t = e.target.value; mudar((x) => ({ ...x, textos: { ...x.textos, [k]: t } })) }} />
}

/** Lista de itens de uma chave: Enter adiciona, item vazio some ao sair dele. `chips` mostra como etiquetas. */
export function Lista({ k, ph: phDado, cor, chips = false, riscado = false }: { k: string; ph?: string; cor?: string; chips?: boolean; riscado?: boolean }) {
  const { d, leitura, mudar } = useEstrategia()
  const ph = phDado ?? (chips ? '+ adicionar' : 'Adicionar e apertar Enter')
  const itens = d.listas[k] ?? []
  const [novo, setNovo] = useState('')
  const definir = (fn: (l: string[]) => string[]) => mudar((x) => ({ ...x, listas: { ...x.listas, [k]: fn(x.listas[k] ?? []) } }))
  const adicionar = () => {
    if (!novo.trim()) return
    const t = novo.trim()
    definir((l) => [...l, t])
    setNovo('')
  }
  const ponto = <i style={cor ? { background: cor } : undefined} />

  if (chips) {
    return (
      <div>
        {itens.map((t, i) => (
          <span key={`${i}-${t}`} style={cor ? { ['--c' as string]: cor } : undefined}>
            {t}
            {!leitura && <button type="button" aria-label={`Remover ${t}`} onClick={() => definir((l) => l.filter((_, j) => j !== i))}><X /></button>}
          </span>
        ))}
        {leitura && !itens.length && <span>—</span>}
        {!leitura && <input value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }} onBlur={adicionar} maxLength={500} placeholder={ph} aria-label={ph} />}
      </div>
    )
  }

  return (
    <ul>
      {itens.map((t, i) => (
        <li key={i}>
          {ponto}
          {leitura ? (
            <span>{t}</span>
          ) : (
            <>
              <textarea value={t} rows={1} maxLength={500} aria-label="Item" onChange={(e) => { const v = e.target.value; definir((l) => l.map((x, j) => (j === i ? v : x))) }} onBlur={() => !t.trim() && definir((l) => l.filter((_, j) => j !== i))} />
              <button type="button" aria-label="Remover item" onClick={() => definir((l) => l.filter((_, j) => j !== i))}><X /></button>
            </>
          )}
        </li>
      ))}
      {leitura && !itens.length && <li>—</li>}
      {!leitura && (
        <li>
          <span>+</span>
          <textarea value={novo} rows={1} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); adicionar() } }} onBlur={adicionar} maxLength={500} placeholder={ph} aria-label={ph} />
        </li>
      )}
    </ul>
  )
}

/** Escala de 5 pontos entre dois extremos (tom de voz). Guarda 0–4 como texto. */
export function Escala({ k, esq, dir }: { k: string; esq: string; dir: string }) {
  const { d, leitura, mudar } = useEstrategia()
  const v = d.textos[k]
  return (
    <div>
      <span>{esq}</span>
      <div role="radiogroup" aria-label={`${esq} ou ${dir}`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={v === String(i)} aria-label={`${i + 1} de 5`} disabled={leitura} onClick={() => mudar((x) => ({ ...x, textos: { ...x.textos, [k]: x.textos[k] === String(i) ? '' : String(i) } }))} />
        ))}
      </div>
      <span>{dir}</span>
    </div>
  )
}

/** Itens marcados (checklist, arquétipos). */
export function useMarcados() {
  const { d, leitura, mudar } = useEstrategia()
  const tem = (id: string) => d.marcados.includes(id)
  const definir = (fn: (m: string[]) => string[]) => mudar((x) => ({ ...x, marcados: fn(x.marcados) }))
  return { tem, leitura, definir, alternar: (id: string) => definir((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id])) }
}
