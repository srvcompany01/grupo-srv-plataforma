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
  if (campos.length === 0) return <p>Nenhum campo criado ainda. O administrador cria os campos em Configurações → Campos de cliente.</p>
  const mudou = campos.some((c) => (texto[c.id] ?? '') !== (valores[c.id] ?? ''))
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => void avisar(await salvarCamposClienteAcao(clienteId, Object.fromEntries(campos.map((c) => [c.id, texto[c.id] ?? '']))), true))
      }}
    >
      <div>
        {campos.map((c) => (
          <label key={c.id}>
            <span>
              {c.nome}
              {c.naCapa && <span>Na galeria</span>}
            </span>
            {c.tipo === 'selecao' ? (
              <select
                value={texto[c.id] ?? ''}
                onChange={(e) => setTexto({ ...texto, [c.id]: e.target.value })}
                disabled={!podeEditar}
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
            />
            )}
          </label>
        ))}
      </div>
      {podeEditar && (
        <button disabled={!mudou || pendente}>
          {pendente ? 'Salvando…' : 'Salvar informações'}
        </button>
      )}
    </form>
  )
}
