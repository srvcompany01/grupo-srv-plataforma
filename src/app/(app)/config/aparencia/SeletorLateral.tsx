'use client'

import { useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { CORES_LATERAL, COR_LATERAL_PADRAO, normalizarHex, variaveisLateral } from '@/dominio/tema-lateral'
import { salvarCorLateralAcao } from './acoes'

export function SeletorLateral({ atual }: { atual: string }) {
  const [texto, setTexto] = useState(atual)
  const [pendente, iniciar] = useTransition()
  const hex = normalizarHex(texto)
  const cor = hex ?? atual
  const mudou = hex !== null && hex !== atual

  const salvar = (valor: string | null) =>
    iniciar(async () => {
      if (avisar(await salvarCorLateralAcao(valor), true) && valor === null) setTexto(COR_LATERAL_PADRAO)
    })

  return (
    <section className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold">Cor da barra lateral</h2>
        <p className="mt-1 text-[12px] text-texto-2">Vale para este navegador. O texto muda para claro ou escuro conforme o fundo.</p>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold text-texto-2">Cores prontas</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CORES_LATERAL.map((c) => (
            <button
              key={c.hex}
              type="button"
              aria-pressed={hex === c.hex}
              onClick={() => setTexto(c.hex)}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/20 ${hex === c.hex ? 'border-marca bg-marca-fundo' : 'border-borda'}`}
            >
              <span className="h-5 w-5 shrink-0 rounded-md border border-black/15" style={{ background: c.hex }} />
              <span className="min-w-0 truncate">{c.nome}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-texto-2">Seletor</span>
          <input type="color" value={cor} onChange={(e) => setTexto(e.target.value.toUpperCase())} className="h-9 w-14 cursor-pointer rounded-md border border-borda bg-white p-1" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-texto-2">Código hex</span>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            maxLength={7}
            aria-invalid={hex === null}
            placeholder="#F6F6F7"
            className={`h-9 w-32 rounded-md border bg-white px-2.5 text-[13px] outline-none focus-visible:ring-3 focus-visible:ring-marca/20 ${hex === null ? 'border-rose-400' : 'border-borda focus-visible:border-marca'}`}
          />
        </label>
        {hex === null && <p className="pb-2 text-[11px] text-rose-600" role="alert">Use o formato #RRGGBB.</p>}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold text-texto-2">Prévia</p>
        <div className="w-60 rounded-xl border border-borda p-3" style={{ ...variaveisLateral(cor), background: 'var(--lat-bg)' } as React.CSSProperties}>
          <p className="text-[12px] font-bold tracking-[0.22em]" style={{ color: 'var(--lat-fg)' }}>Grupo SRV</p>
          <div className="mt-3 space-y-1 text-[11px]">
            <p className="rounded-md px-2 py-1.5 font-semibold" style={{ color: 'var(--lat-fg)', background: 'var(--lat-ativo)' }}>Minhas tarefas</p>
            <p className="px-2 py-1.5" style={{ color: 'var(--lat-2)' }}>Clientes</p>
            <p className="px-2 py-1.5" style={{ color: 'var(--lat-3)' }}>Configurações</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button disabled={!mudou || pendente} onClick={() => hex && salvar(hex)} className="h-9 rounded-lg bg-marca px-4 text-[12px] font-semibold text-white transition-colors hover:bg-marca-escura disabled:opacity-40">
          {pendente ? 'Salvando…' : 'Salvar cor'}
        </button>
        <button disabled={pendente} onClick={() => salvar(null)} className="h-9 rounded-lg border border-borda px-4 text-[12px] font-semibold text-texto-2 transition-colors hover:bg-hover">
          Restaurar padrão
        </button>
      </div>
    </section>
  )
}
