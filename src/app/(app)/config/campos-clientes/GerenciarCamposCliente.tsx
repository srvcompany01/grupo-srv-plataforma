'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { TIPOS_CAMPO_CLIENTE } from '@/dominio/clientes-galeria'
import type { CampoCliente } from '@/servicos/clientes-galeria'
import { atualizarCampoClienteAcao, criarCampoClienteAcao, excluirCampoClienteAcao } from './acoes'

const rotuloTipo = (tipo: string) => TIPOS_CAMPO_CLIENTE.find((t) => t.tipo === tipo)?.rotulo ?? tipo

function LinhaCampo({ campo }: { campo: CampoCliente }) {
  const [nome, setNome] = useState(campo.nome)
  const [pendente, iniciar] = useTransition()
  const salvarNome = () => {
    if (nome.trim() === campo.nome) return
    iniciar(async () => void avisar(await atualizarCampoClienteAcao(campo.id, { nome }), true))
  }
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-borda px-3 py-2.5 first:border-t-0">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onBlur={salvarNome}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label={`Nome do campo ${campo.nome}`}
        maxLength={60}
        autoComplete="off"
        className="h-8 min-w-40 flex-1 rounded-md border border-transparent bg-transparent px-2 text-[13px] font-medium outline-none hover:border-borda focus-visible:border-marca focus-visible:ring-3 focus-visible:ring-marca/20"
      />
      <span className="rounded-full bg-hover px-2 py-0.5 text-[10px] text-texto-2">{rotuloTipo(campo.tipo)}</span>
      <label className="flex cursor-pointer items-center gap-2 text-[11px] text-texto-2">
        <input
          type="checkbox"
          checked={campo.naCapa}
          disabled={pendente}
          onChange={(e) => iniciar(async () => void avisar(await atualizarCampoClienteAcao(campo.id, { naCapa: e.target.checked }), true))}
          className="h-3.5 w-3.5 cursor-pointer accent-marca"
        />
        Mostrar na galeria
      </label>
      <button
        type="button"
        disabled={pendente}
        onClick={() => confirm(`Excluir o campo "${campo.nome}"? Os valores preenchidos nos clientes também serão apagados.`) && iniciar(async () => void avisar(await excluirCampoClienteAcao(campo.id), true))}
        aria-label={`Excluir campo ${campo.nome}`}
        className="rounded-md p-1.5 text-texto-3 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  )
}

export function GerenciarCamposCliente({ campos }: { campos: CampoCliente[] }) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('texto')
  const [naCapa, setNaCapa] = useState(true)
  const [pendente, iniciar] = useTransition()

  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold">Campos de cliente</h2>
        <p className="mt-1 text-[12px] text-texto-2">Crie os campos que quiser (por exemplo, Plano, Responsável ou Início do contrato). Os marcados aparecem no cartão de cada cliente na galeria. Os valores são preenchidos na página do cliente.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          iniciar(async () => {
            if (avisar(await criarCampoClienteAcao(nome, tipo, naCapa), true)) setNome('')
          })
        }}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-borda p-3"
      >
        <label className="block min-w-48 flex-1">
          <span className="mb-1 block text-[11px] font-semibold text-texto-2">Nome do campo</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} autoComplete="off" placeholder="Ex.: Plano contratado…" className="h-9 w-full rounded-lg border border-borda bg-white px-3 text-[12px] outline-none focus-visible:border-marca focus-visible:ring-3 focus-visible:ring-marca/20" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-texto-2">Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-9 rounded-lg border border-borda bg-white px-2 text-[12px] outline-none focus-visible:border-marca focus-visible:ring-3 focus-visible:ring-marca/20">
            {TIPOS_CAMPO_CLIENTE.map((t) => (
              <option key={t.tipo} value={t.tipo}>{t.rotulo}</option>
            ))}
          </select>
        </label>
        <label className="flex h-9 cursor-pointer items-center gap-2 text-[11px] text-texto-2">
          <input type="checkbox" checked={naCapa} onChange={(e) => setNaCapa(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-marca" />
          Mostrar na galeria
        </label>
        <button disabled={pendente || !nome.trim()} className="h-9 rounded-lg bg-marca px-4 text-[12px] font-semibold text-white transition-colors hover:bg-marca-escura disabled:opacity-40">
          {pendente ? 'Criando…' : 'Criar campo'}
        </button>
      </form>

      {campos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda px-4 py-8 text-center text-[12px] text-texto-3">Nenhum campo criado ainda.</p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-borda bg-white">
          {campos.map((c) => (
            <LinhaCampo key={c.id} campo={c} />
          ))}
        </ul>
      )}
    </section>
  )
}
