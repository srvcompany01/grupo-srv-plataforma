import Link from 'next/link'
import { iniciais } from '@/dominio/clientes-galeria'
import { ROTULO_STATUS_CLIENTE, type Cliente } from '@/servicos/clientes-plataforma'
import type { Capa } from '@/servicos/clientes-galeria'

export type InfoCartao = { id: string; nome: string; texto: string }

export function CartaoCliente({ cliente: c, capa, info }: { cliente: Pick<Cliente, 'id' | 'nome' | 'cor' | 'status' | 'interno'>; capa?: Capa; info: InfoCartao[] }) {
  return (
    <Link
      href={`/clientes/${c.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-borda bg-white transition-[border-color,transform] hover:-translate-y-0.5 hover:border-borda-forte focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/25"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ background: c.cor }}>
        {capa?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- origem externa (Unsplash) ou URL assinada do R2
          <img src={capa.url} alt="" width={640} height={360} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[32px] font-bold tracking-[0.08em] text-white/90">{iniciais(c.nome)}</span>
        )}
        {capa?.credito && <span className="absolute bottom-1 right-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[8px] text-white/90">{capa.credito}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-snug">{c.nome}</h2>
          {c.interno && <span className="shrink-0 rounded-full bg-marca-fundo px-2 py-0.5 text-[9px] font-semibold text-marca">Interno</span>}
        </div>
        <p className="text-[10px] text-texto-3">{ROTULO_STATUS_CLIENTE[c.status]}</p>
        {info.length > 0 && (
          <dl className="mt-1 space-y-1.5 border-t border-borda pt-2.5">
            {info.map((i) => (
              <div key={i.id} className="flex items-baseline justify-between gap-3 text-[11px]">
                <dt className="shrink-0 text-texto-3">{i.nome}</dt>
                <dd className="min-w-0 truncate text-right font-medium" title={i.texto}>{i.texto}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Link>
  )
}
