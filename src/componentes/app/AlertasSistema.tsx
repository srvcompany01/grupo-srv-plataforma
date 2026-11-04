'use client'

import { TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import type { AlertaSistema } from '@/servicos/alertas-sistema'

/** Ícone de atenção do topo: pendências do sistema (publicações que falharam ou atrasaram). Com alertas ganha um ponto laranja. */
export function AlertasSistema({ alertas }: { alertas: AlertaSistema[] }) {
  return (
    <Popover>
      <PopoverTrigger aria-label={alertas.length ? `${alertas.length} alertas do sistema` : 'Alertas do sistema'} title="Alertas do sistema" className="tb flex items-center justify-center" style={{ padding: 0, color: alertas.length > 0 ? '#e08a00' : undefined }}>
        <TriangleAlert size={18} strokeWidth={1.6} />
        {alertas.length > 0 && <span className="tb-ponto" />}
      </PopoverTrigger>
      <PopoverContent align="start" className="painel-alerta">
        <div className="pa-topo">
          <p className="pa-titulo">Alertas do sistema</p>
          {alertas.length > 0 && <span className="pa-s">{alertas.length}</span>}
        </div>
        {alertas.length === 0 ? (
          <p className="pa-vazio">Tudo certo: nenhuma publicação com problema.</p>
        ) : (
          <div className="pa-lista">
            {alertas.map((a) => (
              <Link key={a.id} href={a.href} className="pa-item" data-nova>
                <span className="pa-ico" data-erro><TriangleAlert size={18} strokeWidth={1.6} /></span>
                <span className="pa-corpo">
                  <span className="pa-t block">{a.texto}</span>
                  <span className="pa-s block truncate">{a.detalhe}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
