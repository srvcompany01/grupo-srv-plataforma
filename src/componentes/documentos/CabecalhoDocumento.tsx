'use client'

import { Archive, ArchiveRestore, BookOpen, ChevronRight, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { atualizarDocumentoAcao, excluirDocumentoAcao, favoritarAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import type { PessoaDocumento, ResumoDocumento } from '@/dominio/documentos'
import { botaoFantasma } from '@/lib/ui'
import { CompartilharDocumento } from './CompartilharDocumento'
import { VincularListas, type ListaEscolha } from './VincularListas'

export function CabecalhoDocumento({ documento, pessoas, equipe, clientes, listas, euId, podeEditar, podeGerir }: { documento: ResumoDocumento; pessoas: PessoaDocumento[]; equipe: { id: string; nome: string }[]; clientes: { id: string; nome: string }[]; listas: ListaEscolha[]; euId: string; podeEditar: boolean; podeGerir: boolean }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [titulo, setTitulo] = useState(documento.titulo)
  const [favorito, setFavorito] = useState(documento.favorito)
  const [, iniciar] = useTransition()

  const salvarTitulo = () => {
    if (titulo.trim() === documento.titulo) return
    if (!titulo.trim()) return setTitulo(documento.titulo)
    iniciar(async () => {
      if (avisar(await atualizarDocumentoAcao(documento.id, { titulo }))) router.refresh()
    })
  }

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-borda bg-white px-4 py-2 md:px-5">
      <Link href="/documentos" className="text-rotulo text-texto-3 hover:text-texto">Documentos</Link>
      <ChevronRight className="h-3.5 w-3.5 text-texto-3" />
      <input
        value={titulo}
        readOnly={!podeEditar}
        maxLength={200}
        onChange={(e) => setTitulo(e.target.value)}
        onBlur={salvarTitulo}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label="Título do documento"
        className="min-w-0 max-w-md flex-1 rounded-md bg-transparent px-1.5 py-1 text-destaque font-bold text-texto outline-none hover:bg-hover focus:bg-hover"
      />
      {documento.wiki && <span className="inline-flex items-center gap-1 rounded-full bg-aviso-fundo px-2 py-0.5 text-legenda font-medium text-aviso-forte"><BookOpen className="h-3 w-3" /> Wiki</span>}
      {documento.arquivadoEm && <span className="rounded-full bg-fundo px-2 py-0.5 text-legenda text-texto-3 ring-1 ring-borda">Arquivado</span>}
      <button type="button" aria-label={favorito ? 'Tirar dos favoritos' : 'Favoritar'} onClick={() => { setFavorito(!favorito); iniciar(async () => void avisar(await favoritarAcao(documento.id, !favorito))) }} className="rounded p-1 hover:bg-hover">
        <Star className={`h-4 w-4 ${favorito ? 'fill-aviso text-aviso' : 'text-texto-3'}`} />
      </button>
      <div className="ml-auto flex flex-wrap items-center gap-1">
        <VincularListas documentoId={documento.id} vinculadas={documento.listas} todas={listas} podeEditar={podeEditar} />
        <CompartilharDocumento documento={documento} pessoas={pessoas} equipe={equipe} clientes={clientes} euId={euId} podeGerir={podeGerir} />
        {podeEditar && (
          <button type="button" className={botaoFantasma} title={documento.arquivadoEm ? 'Restaurar' : 'Arquivar'} onClick={() => iniciar(async () => { if (avisar(await atualizarDocumentoAcao(documento.id, { arquivado: !documento.arquivadoEm }), true)) router.refresh() })}>
            {documento.arquivadoEm ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </button>
        )}
        {podeGerir && (
          <button
            type="button"
            className={`${botaoFantasma} text-perigo`}
            title="Excluir documento"
            onClick={async () => {
              if (!(await confirmar({ titulo: `Excluir "${documento.titulo}"?`, descricao: 'O documento e todas as páginas são apagados para sempre.', confirmar: 'Excluir', perigo: true }))) return
              iniciar(async () => { if (avisar(await excluirDocumentoAcao(documento.id), true)) router.push('/documentos') })
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </header>
  )
}
