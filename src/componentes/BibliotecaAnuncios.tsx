import { ExternalLink, Megaphone } from 'lucide-react'
import { urlBibliotecaAnuncios } from '@/dominio/biblioteca-anuncios'

/** Cartão com o link público dos anúncios ativos do cliente na Biblioteca do Meta (abre em outra aba). */
export function BibliotecaAnuncios({ paginaId, semPagina }: { paginaId: string | null; semPagina?: string }) {
  if (!paginaId && !semPagina) return null
  return (
    <div>
      <span><Megaphone /></span>
      <div>
        <p>Anúncios no Meta</p>
        <p>{paginaId ? 'Todos os anúncios ativos no Facebook e no Instagram, na Biblioteca de Anúncios (pública).' : semPagina}</p>
      </div>
      {paginaId && (
        <a href={urlBibliotecaAnuncios(paginaId)} target="_blank" rel="noreferrer">
          Ver anúncios ativos <ExternalLink />
        </a>
      )}
    </div>
  )
}
