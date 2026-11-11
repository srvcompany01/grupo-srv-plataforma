'use client'

import { Archive, ArchiveRestore, BookOpen, ChevronRight, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { atualizarDocumentoAcao, excluirDocumentoAcao, favoritarAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import type { PessoaDocumento, ResumoDocumento } from '@/dominio/documentos'
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
    <header>
      <Link href="/documentos">Documentos</Link>
      <ChevronRight />
      <input
        value={titulo}
        readOnly={!podeEditar}
        maxLength={200}
        onChange={(e) => setTitulo(e.target.value)}
        onBlur={salvarTitulo}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label="Título do documento"
      />
      {documento.wiki && <span><BookOpen /> Wiki</span>}
      {documento.arquivadoEm && <span>Arquivado</span>}
      <button type="button" aria-label={favorito ? 'Tirar dos favoritos' : 'Favoritar'} onClick={() => { setFavorito(!favorito); iniciar(async () => void avisar(await favoritarAcao(documento.id, !favorito))) }}>
        <Star />
      </button>
      <div>
        <VincularListas documentoId={documento.id} vinculadas={documento.listas} todas={listas} podeEditar={podeEditar} />
        <CompartilharDocumento documento={documento} pessoas={pessoas} equipe={equipe} clientes={clientes} euId={euId} podeGerir={podeGerir} />
        {podeEditar && (
          <button type="button" title={documento.arquivadoEm ? 'Restaurar' : 'Arquivar'} onClick={() => iniciar(async () => { if (avisar(await atualizarDocumentoAcao(documento.id, { arquivado: !documento.arquivadoEm }), true)) router.refresh() })}>
            {documento.arquivadoEm ? <ArchiveRestore /> : <Archive />}
          </button>
        )}
        {podeGerir && (
          <button
            type="button"
            title="Excluir documento"
            onClick={async () => {
              if (!(await confirmar({ titulo: `Excluir "${documento.titulo}"?`, descricao: 'O documento e todas as páginas são apagados para sempre.', confirmar: 'Excluir', perigo: true }))) return
              iniciar(async () => { if (avisar(await excluirDocumentoAcao(documento.id), true)) router.push('/documentos') })
            }}
          >
            <Trash2 />
          </button>
        )}
      </div>
    </header>
  )
}
