'use client'

import { TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import type { AlertaSistema } from '@/servicos/alertas-sistema'

/** Ícone de atenção do topo: pendências do sistema (publicações que falharam ou atrasaram). Com alertas ganha um ponto laranja. */
export function AlertasSistema({ alertas }: { alertas: AlertaSistema[] }) {
  return (
    <Popover>
      <PopoverTrigger aria-label={alertas.length ? `${alertas.length} alertas do sistema` : 'Alertas do sistema'} title="Alertas do sistema" style={{ padding: 0, color: alertas.length > 0 ? '#e08a00' : undefined }}>
        <TriangleAlert size={18} strokeWidth={1.6} />
        {alertas.length > 0 && <span />}
      </PopoverTrigger>
      <PopoverContent align="start">
        <div>
          <p>Alertas do sistema</p>
          {alertas.length > 0 && <span>{alertas.length}</span>}
        </div>
        {alertas.length === 0 ? (
          <p>Tudo certo: nenhuma publicação com problema.</p>
        ) : (
          <div>
            {alertas.map((a) => (
              <Link key={a.id} href={a.href} data-nova>
                <span data-erro><TriangleAlert size={18} strokeWidth={1.6} /></span>
                <span>
                  <span>{a.texto}</span>
                  <span>{a.detalhe}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
