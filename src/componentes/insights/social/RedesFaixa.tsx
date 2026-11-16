import { LogoRede } from '@/componentes/redes/LogoRede'
import type { SlugRede } from '@/dominio/redes-sociais'

const REDES_ORGANICO: { nome: string; situacao: string; slug?: SlugRede; cor: string; ativa?: boolean }[] = [
  { nome: 'Instagram', situacao: 'Ativo', slug: 'instagram', cor: '#e1306c', ativa: true },
  { nome: 'Facebook', situacao: 'Em breve', cor: '#0866ff' },
  { nome: 'TikTok', situacao: 'Em breve', slug: 'tiktok', cor: '#111111' },
  { nome: 'YouTube', situacao: 'Em breve', slug: 'youtube', cor: '#ff0033' },
  { nome: 'LinkedIn', situacao: 'Em breve', slug: 'linkedin', cor: '#0a66c2' },
  { nome: 'Google Meu Negócio', situacao: 'Aguardando o Google', slug: 'gmn', cor: '#1a73e8' },
]

/** Faixa de redes (pílulas do mesmo tamanho): logo, nome e uma linha de apoio. A rede ativa ganha o contorno preto. */
export function RedesFaixa({ seguidoresInstagram }: { seguidoresInstagram?: string }) {
  return (
    <div className="ins-redes" role="list" aria-label="Redes sociais">
      {REDES_ORGANICO.map((r) => (
        <span key={r.nome} role="listitem" className="ins-rede" data-ativa={r.ativa || undefined}>
          {r.slug ? <LogoRede slug={r.slug} tamanho={30} /> : <span style={{ background: r.cor, borderRadius: 7 }} className="flex h-[30px] w-[30px] flex-none items-center justify-center text-[16px] font-bold text-white">f</span>}
          <span className="min-w-0">
            <span className="block truncate font-semibold">{r.nome}</span>
            <small className="block truncate">{r.ativa ? (seguidoresInstagram ?? r.situacao) : r.situacao}</small>
          </span>
        </span>
      ))}
    </div>
  )
}
