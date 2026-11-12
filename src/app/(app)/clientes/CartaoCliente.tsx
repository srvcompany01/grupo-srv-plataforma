import Link from 'next/link'
import { iniciais } from '@/dominio/clientes-galeria'
import { ROTULO_STATUS_CLIENTE, type Cliente } from '@/servicos/clientes-plataforma'
import type { Capa } from '@/servicos/clientes-galeria'
import { BotaoTrabalhado } from './BotaoTrabalhado'

export type InfoCartao = { id: string; nome: string; texto: string; cor?: string }

export function CartaoCliente({ cliente: c, capa, info, trabalhadoHoje = false }: { cliente: Pick<Cliente, 'id' | 'nome' | 'cor' | 'status' | 'interno'>; capa?: Capa; info: InfoCartao[]; trabalhadoHoje?: boolean }) {
  return (
    // O botão fica ao lado do link (não dentro dele), por cima da capa.
    <div className="cl-cartao">
    <BotaoTrabalhado clienteId={c.id} nome={c.nome} marcado={trabalhadoHoje} />
    <Link
      href={`/clientes/${c.id}`}
    >
      <div className="cl-capa" style={{ background: c.cor }}>
        {capa?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- origem externa (Unsplash) ou URL assinada do R2
          <img src={capa.url} alt="" width={640} height={360} loading="lazy" />
        ) : (
          <span>{iniciais(c.nome)}</span>
        )}
        {capa?.logo && (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
          <img src={capa.logo} alt={`Logo de ${c.nome}`} width={56} height={56} loading="lazy" className="cl-logo" />
        )}
        {capa?.credito && <span>{capa.credito}</span>}
      </div>
      <div className="cl-info">
        <div>
          <h2>{c.nome}</h2>
          {c.interno && <span>Interno</span>}
        </div>
        {/* Mesmo canto do cartão (arredondado, mais quadradinho que uma pílula). */}
        {c.status === 'ativo' ? (
          <span className="cl-status" data-ativo>
            <span aria-hidden="true">✅</span> Ativo
          </span>
        ) : (
          <span className="cl-status" title={ROTULO_STATUS_CLIENTE[c.status]}>
            <span aria-hidden="true">❌</span> Inativo
          </span>
        )}
        {info.length > 0 && (
          <dl>
            {info.map((i) => (
              <div key={i.id}>
                <dt>{i.nome}</dt>
                <dd title={i.texto}>
                  {i.cor ? <span style={{ background: `${i.cor}26`, color: i.cor }}>{i.texto}</span> : i.texto}
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
