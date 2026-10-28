'use client'

import { TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import type { AlertaSistema } from '@/servicos/alertas-sistema'

/** Ícone âmbar do topo: pendências do sistema (publicações que falharam ou atrasaram). Com alertas ganha um ponto vermelho. */
export function AlertasSistema({ alertas }: { alertas: AlertaSistema[] }) {
  return (
    <Popover>
      <PopoverTrigger aria-label={alertas.length ? `${alertas.length} alertas do sistema` : 'Alertas do sistema'} title="Alertas do sistema" className="relative flex h-7 w-7 items-center justify-center rounded-md text-[#e08a00] transition-colors hover:bg-hover">
        <TriangleAlert className="h-4 w-4" />
        {alertas.length > 0 && <span className="absolute right-1 top-1 h-[7px] w-[7px] rounded-full bg-[#d80d12] ring-2 ring-[var(--bg-frame)]" />}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] p-0">
        <p className="flex h-10 items-center border-b border-borda-fraca px-3 text-corpo font-semibold">Alertas do sistema</p>
        {alertas.length === 0 ? (
          <p className="px-3 py-6 text-center text-corpo text-texto-3">Tudo certo: nenhuma publicação com problema.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {alertas.map((a) => (
              <li key={a.id}>
                <Link href={a.href} className="block border-b border-borda-fraca px-3 py-2 last:border-b-0 hover:bg-hover">
                  <span className="block text-rotulo font-semibold text-[var(--red)]">{a.texto}</span>
                  <span className="block truncate text-corpo">{a.detalhe}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
