import Link from 'next/link'
import { iniciais } from '@/dominio/clientes-galeria'
import { ROTULO_STATUS_CLIENTE, type Cliente } from '@/servicos/clientes-plataforma'
import type { Capa } from '@/servicos/clientes-galeria'
import { BotaoTrabalhado } from './BotaoTrabalhado'

export type InfoCartao = { id: string; nome: string; texto: string; cor?: string }

export function CartaoCliente({ cliente: c, capa, info, trabalhadoHoje = false }: { cliente: Pick<Cliente, 'id' | 'nome' | 'cor' | 'status' | 'interno'>; capa?: Capa; info: InfoCartao[]; trabalhadoHoje?: boolean }) {
  return (
    // O botão fica ao lado do link (não dentro dele), por cima da capa.
    <div className="relative h-full">
    <BotaoTrabalhado clienteId={c.id} nome={c.nome} marcado={trabalhadoHoje} />
    <Link
      href={`/clientes/${c.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-borda bg-white transition-[border-color,transform] hover:-translate-y-0.5 hover:border-borda-forte focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/25"
    >
      <div className="relative aspect-[2/1] w-full overflow-hidden" style={{ background: c.cor }}>
        {capa?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- origem externa (Unsplash) ou URL assinada do R2
          <img src={capa.url} alt="" width={640} height={360} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[26px] font-bold tracking-rotulo text-claro/90">{iniciais(c.nome)}</span>
        )}
        {capa?.logo && (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
          <img src={capa.logo} alt={`Logo de ${c.nome}`} width={56} height={56} loading="lazy" className="absolute bottom-2 left-2 h-14 w-14 rounded-xl border-2 border-claro bg-white object-cover shadow-md" />
        )}
        {capa?.credito && <span className="absolute bottom-1 right-1.5 rounded bg-black/50 px-1.5 py-0.5 text-legenda text-claro/90">{capa.credito}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 break-words text-corpo font-semibold leading-snug">{c.nome}</h2>
          {c.interno && <span className="shrink-0 rounded-full bg-marca-fundo px-2 py-0.5 text-legenda font-semibold text-marca">Interno</span>}
        </div>
        {/* Mesmo canto do cartão (arredondado, mais quadradinho que uma pílula). */}
        {c.status === 'ativo' ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-lg border border-sucesso/60 bg-sucesso-fundo px-2 py-1 text-legenda font-semibold leading-none text-sucesso-forte">
            <span aria-hidden="true" className="text-[11px] leading-none">✅</span> Ativo
          </span>
        ) : (
          <span title={ROTULO_STATUS_CLIENTE[c.status]} className="inline-flex w-fit items-center gap-1 rounded-lg border border-perigo/60 bg-perigo-fundo px-2 py-1 text-legenda font-semibold leading-none text-perigo">
            <span aria-hidden="true" className="text-[11px] leading-none">❌</span> Inativo
          </span>
        )}
        {info.length > 0 && (
          <dl className="mt-1 space-y-1.5 border-t border-borda pt-2.5">
            {info.map((i) => (
              <div key={i.id} className="flex items-baseline justify-between gap-3 text-legenda">
                <dt className="shrink-0 text-texto-3">{i.nome}</dt>
                <dd className="min-w-0 truncate text-right font-medium" title={i.texto}>
                  {i.cor ? <span className="rounded-md px-1.5 py-0.5" style={{ background: `${i.cor}26`, color: i.cor }}>{i.texto}</span> : i.texto}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Link>
    </div>
  )
}
