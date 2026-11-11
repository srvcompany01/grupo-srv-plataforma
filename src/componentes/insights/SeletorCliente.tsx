'use client'

import { useRouter } from 'next/navigation'

/** Escolhe entre o panorama (todos os clientes) e um cliente só; mantém o período escolhido. */
export function SeletorCliente({ base, clientes, atual, consultaPeriodo, social = false }: { social?: boolean; base: string; clientes: { id: string; nome: string }[]; atual: string | null; consultaPeriodo: string }) {
  const router = useRouter()
  const ir = (id: string) => {
    const q = [id ? `cliente=${id}` : '', consultaPeriodo].filter(Boolean).join('&')
    router.push(q ? `${base}${base.includes('?') ? '&' : '?'}${q}` : base)
  }
  return (
    <label>
      {!social && <span>Cliente</span>}
      <select value={atual ?? ''} onChange={(e) => ir(e.target.value)} aria-label="Cliente">
        <option value="">Todos os clientes (panorama)</option>
        {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
    </label>
  )
}
