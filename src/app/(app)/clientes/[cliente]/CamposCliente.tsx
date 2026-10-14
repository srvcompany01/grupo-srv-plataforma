'use client'

import { useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import type { OpcaoCampoCliente, TipoCampoCliente } from '@/dominio/clientes-galeria'
import { salvarCamposClienteAcao } from '../acoes-galeria'

type Campo = { id: string; nome: string; tipo: TipoCampoCliente; naCapa: boolean; opcoes: OpcaoCampoCliente[] }

const TIPO_INPUT: Record<TipoCampoCliente, string> = { texto: 'text', numero: 'text', data: 'date', link: 'url', selecao: 'text' }

export function CamposCliente({ clienteId, campos, valores, podeEditar }: { clienteId: string; campos: Campo[]; valores: Record<string, string>; podeEditar: boolean }) {
  const [texto, setTexto] = useState(valores)
  const [pendente, iniciar] = useTransition()
  if (campos.length === 0) return <p className="text-rotulo text-texto-3">Nenhum campo criado ainda. O administrador cria os campos em Configurações → Campos de cliente.</p>
  const mudou = campos.some((c) => (texto[c.id] ?? '') !== (valores[c.id] ?? ''))
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => void avisar(await salvarCamposClienteAcao(clienteId, Object.fromEntries(campos.map((c) => [c.id, texto[c.id] ?? '']))), true))
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {campos.map((c) => (
          <label key={c.id} className="block">
            <span className="mb-1 flex items-center gap-2 text-legenda font-semibold text-texto-2">
              {c.nome}
              {c.naCapa && <span className="rounded-full bg-marca-fundo px-1.5 py-0.5 text-legenda font-semibold text-marca">Na galeria</span>}
            </span>
            {c.tipo === 'selecao' ? (
              <select
                value={texto[c.id] ?? ''}
                onChange={(e) => setTexto({ ...texto, [c.id]: e.target.value })}
                disabled={!podeEditar}
                className="h-9 w-full rounded-lg border border-borda bg-white px-2 text-rotulo outline-none focus-visible:border-marca focus-visible:ring-3 focus-visible:ring-marca/20 disabled:bg-hover"
              >
                <option value="">— Sem informação</option>
                {c.opcoes.map((o) => <option key={o.nome} value={o.nome}>{o.nome}</option>)}
                {texto[c.id] && !c.opcoes.some((o) => o.nome === texto[c.id]) && <option value={texto[c.id]}>{texto[c.id]} (opção removida)</option>}
              </select>
            ) : (
            <input
                type={TIPO_INPUT[c.tipo]}
                inputMode={c.tipo === 'numero' ? 'decimal' : undefined}
                value={texto[c.id] ?? ''}
                onChange={(e) => setTexto({ ...texto, [c.id]: e.target.value })}
                disabled={!podeEditar}
                maxLength={500}
                autoComplete="off"
                spellCheck={false}
                className="h-9 w-full rounded-lg border border-borda bg-white px-3 text-rotulo outline-none focus-visible:border-marca focus-visible:ring-3 focus-visible:ring-marca/20 disabled:bg-hover"
            />
            )}
          </label>
        ))}
      </div>
      {podeEditar && (
        <button disabled={!mudou || pendente} className="h-9 rounded-lg bg-marca px-4 text-rotulo font-semibold text-white transition-colors hover:bg-marca-escura disabled:opacity-40">
          {pendente ? 'Salvando…' : 'Salvar informações'}
        </button>
      )}
    </form>
  )
}
