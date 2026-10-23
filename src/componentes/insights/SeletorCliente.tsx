'use client'

import { useRouter } from 'next/navigation'
import { campo } from '@/lib/ui'

/** Escolhe entre o panorama (todos os clientes) e um cliente só; mantém o período escolhido. */
export function SeletorCliente({ base, clientes, atual, consultaPeriodo }: { base: string; clientes: { id: string; nome: string }[]; atual: string | null; consultaPeriodo: string }) {
  const router = useRouter()
  const ir = (id: string) => {
    const q = [id ? `cliente=${id}` : '', consultaPeriodo].filter(Boolean).join('&')
    router.push(q ? `${base}${base.includes('?') ? '&' : '?'}${q}` : base)
  }
  return (
    <label className="flex min-w-0 items-center gap-2">
      <span className="text-rotulo font-medium text-texto-2">Cliente</span>
      <select value={atual ?? ''} onChange={(e) => ir(e.target.value)} className={`${campo} h-9 w-64 max-w-full`}>
        <option value="">Todos os clientes (panorama)</option>
        {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
    </label>
  )
}
