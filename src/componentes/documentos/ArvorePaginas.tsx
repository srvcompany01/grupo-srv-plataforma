'use client'

import { FilePlus2, FileText, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { criarPaginaAcao, excluirPaginaAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { arvoreDePaginas, type PaginaDocumento } from '@/dominio/documentos'

/** Páginas do documento em árvore (como no ClickUp): "+" cria subpágina, "Adicionar página" cria na raiz. */
export function ArvorePaginas({ documentoId, paginas, atualId, podeEditar }: { documentoId: string; paginas: PaginaDocumento[]; atualId: string; podeEditar: boolean }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [, iniciar] = useTransition()
  const itens = arvoreDePaginas(paginas)

  const criar = (paiId: string | null) =>
    iniciar(async () => {
      const r = await criarPaginaAcao(documentoId, paiId)
      if (avisar(r) && r?.id) router.push(`/documentos/${documentoId}?p=${r.id}`)
    })

  const excluir = async (p: PaginaDocumento) => {
    if (!(await confirmar({ titulo: `Excluir "${p.titulo || 'Sem título'}"?`, descricao: 'A página e as subpáginas dela são apagadas.', confirmar: 'Excluir', perigo: true }))) return
    iniciar(async () => {
      if (!avisar(await excluirPaginaAcao(p.id), true)) return
      if (p.id === atualId) router.push(`/documentos/${documentoId}`)
      else router.refresh()
    })
  }

  return (
    <nav className="w-56 shrink-0 overflow-y-auto border-r border-borda bg-fundo/40 p-2" aria-label="Páginas do documento">
      {podeEditar && (
        <button type="button" onClick={() => criar(null)} className="mb-2 flex w-full items-center gap-1.5 rounded-md border border-borda bg-white px-2 py-1.5 text-rotulo font-medium text-texto-2 hover:bg-hover">
          <FilePlus2 className="h-3.5 w-3.5" /> Adicionar página
        </button>
      )}
      {itens.map((p) => (
        <div key={p.id} className={`group flex items-center rounded-md ${p.id === atualId ? 'bg-white shadow-sm ring-1 ring-borda' : 'hover:bg-hover'}`} style={{ paddingLeft: 4 + p.nivel * 14 }}>
          <Link href={`/documentos/${documentoId}?p=${p.id}`} className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 pr-1 text-rotulo text-texto-2">
            <FileText className="h-3.5 w-3.5 shrink-0 text-texto-3" />
            <span className="truncate">{p.titulo || 'Sem título'}</span>
          </Link>
          {podeEditar && (
            <span className="mr-1 hidden items-center gap-0.5 group-hover:flex">
              <button type="button" title="Adicionar subpágina" aria-label="Adicionar subpágina" onClick={() => criar(p.id)} className="rounded p-1 text-texto-3 hover:bg-fundo"><Plus className="h-3 w-3" /></button>
              {paginas.length > 1 && <button type="button" title="Excluir página" aria-label="Excluir página" onClick={() => excluir(p)} className="rounded p-1 text-texto-3 hover:bg-fundo"><Trash2 className="h-3 w-3" /></button>}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
