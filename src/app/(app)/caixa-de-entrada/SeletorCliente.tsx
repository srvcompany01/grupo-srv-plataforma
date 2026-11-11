'use client'

import { useRouter } from 'next/navigation'

/** Troca o cliente na URL (usado na tela de configurações). */
export function SeletorCliente({ clientes, atual, base = '/caixa-de-entrada' }: { clientes: { id: string; nome: string }[]; atual: string; base?: string }) {
  const router = useRouter()
  return (
    <select value={atual} onChange={(e) => router.push(`${base}?cliente=${e.target.value}`)} aria-label="Cliente">
      {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
    </select>
  )
}
