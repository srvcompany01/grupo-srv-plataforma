import { LogoRede } from '@/componentes/redes/LogoRede'
import type { SlugRede } from '@/dominio/redes-sociais'

const REDES_ORGANICO: { nome: string; situacao: string; slug?: SlugRede; cor: string; ativa?: boolean }[] = [
  { nome: 'Instagram', situacao: 'Ativo', slug: 'instagram', cor: '#e1306c', ativa: true },
  { nome: 'Google Meu Negócio', situacao: 'Aguardando o Google', slug: 'gmn', cor: '#1a73e8' },
  { nome: 'TikTok', situacao: 'Em breve', slug: 'tiktok', cor: '#111111' },
  { nome: 'YouTube', situacao: 'Em breve', slug: 'youtube', cor: '#ff0033' },
  { nome: 'Facebook', situacao: 'Em breve', cor: '#0866ff' },
  { nome: 'LinkedIn', situacao: 'Em breve', slug: 'linkedin', cor: '#0a66c2' },
]

/** Faixa centralizada de redes: logo redondo, nome e uma linha de apoio (seguidores do Instagram quando já carregou). A rede ativa fica destacada. */
export function RedesFaixa({ seguidoresInstagram }: { seguidoresInstagram?: string }) {
  return (
    <div className="ins-redes" role="list" aria-label="Redes sociais">
      {REDES_ORGANICO.map((r) => (
        <span key={r.nome} role="listitem" className="ins-rede" data-ativa={r.ativa || undefined} data-breve={!r.ativa || undefined}>
          <span className="ins-rede-logo">
            {r.slug ? <LogoRede slug={r.slug} tamanho={32} /> : <span style={{ background: r.cor }} className="flex h-8 w-8 items-center justify-center text-[15px] font-bold text-white">f</span>}
          </span>
          <span>
            <span className="block font-semibold">{r.nome}</span>
            <small>{r.ativa ? (seguidoresInstagram ?? r.situacao) : r.situacao}</small>
          </span>
        </span>
      ))}
    </div>
  )
}
