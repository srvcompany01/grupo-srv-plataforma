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
    <nav aria-label="Páginas do documento">
      {podeEditar && (
        <button type="button" onClick={() => criar(null)}>
          <FilePlus2 /> Adicionar página
        </button>
      )}
      {itens.map((p) => (
        <div key={p.id} style={{ paddingLeft: 4 + p.nivel * 14 }}>
          <Link href={`/documentos/${documentoId}?p=${p.id}`}>
            <FileText />
            <span>{p.titulo || 'Sem título'}</span>
          </Link>
          {podeEditar && (
            <span className="hidden">
              <button type="button" title="Adicionar subpágina" aria-label="Adicionar subpágina" onClick={() => criar(p.id)}><Plus /></button>
              {paginas.length > 1 && <button type="button" title="Excluir página" aria-label="Excluir página" onClick={() => excluir(p)}><Trash2 /></button>}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
