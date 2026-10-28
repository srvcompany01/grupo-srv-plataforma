import { ExternalLink, Megaphone } from 'lucide-react'
import { urlBibliotecaAnuncios } from '@/dominio/biblioteca-anuncios'

/** Cartão com o link público dos anúncios ativos do cliente na Biblioteca do Meta (abre em outra aba). */
export function BibliotecaAnuncios({ paginaId, semPagina }: { paginaId: string | null; semPagina?: string }) {
  if (!paginaId && !semPagina) return null
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-borda bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0866ff]/10 text-[#0866ff]"><Megaphone className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-corpo font-semibold text-texto">Anúncios no Meta</p>
        <p className="text-legenda text-texto-3">{paginaId ? 'Todos os anúncios ativos no Facebook e no Instagram, na Biblioteca de Anúncios (pública).' : semPagina}</p>
      </div>
      {paginaId && (
        <a href={urlBibliotecaAnuncios(paginaId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#0866ff] px-4 py-2 text-rotulo font-semibold text-claro transition hover:bg-[#0757d9]">
          Ver anúncios ativos <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}
