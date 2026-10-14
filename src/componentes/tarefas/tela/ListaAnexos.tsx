'use client'

import { Download, FileText } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/componentes/ui/dialog'
import type { AnexoComentario } from '@/servicos/comentarios'

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

export function ListaAnexos({ anexos }: { anexos: AnexoComentario[] }) {
  const [ampliado, setAmpliado] = useState<AnexoComentario | null>(null)
  if (anexos.length === 0) return null
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {anexos
          .filter((a) => a.tipo === 'arquivo' && a.mime.startsWith('image/'))
          .map((a) => (
            <button key={a.id} type="button" onClick={() => setAmpliado(a)} aria-label={`Ampliar ${a.nome}`} className="overflow-hidden rounded-md border border-borda">
              {/* URL assinada do R2: next/image exigiria configurar o domínio. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.nome} className="h-[120px] w-auto max-w-[200px] object-cover" />
            </button>
          ))}
      </div>
      {anexos.map((a) => {
        if (a.tipo === 'audio') {
          return (
            <audio key={a.id} controls preload="metadata" src={a.url} aria-label={a.nome} className="h-9 w-full max-w-xs">
              <track kind="captions" />
            </audio>
          )
        }
        if (a.tipo === 'video') {
          return (
            <video key={a.id} controls preload="metadata" src={a.url} aria-label={a.nome} className="max-h-[320px] max-w-full rounded-md bg-black">
              <track kind="captions" />
            </video>
          )
        }
        if (a.mime.startsWith('image/')) return null
        return (
          <a key={a.id} href={a.url} download={a.nome} target="_blank" rel="noreferrer" className="controle flex items-center gap-2 rounded-md border border-borda bg-white px-2 py-1.5 text-rotulo hover:bg-hover">
            <FileText className="h-4 w-4 shrink-0 text-texto-3" />
            <span className="min-w-0 flex-1 truncate">{a.nome}</span>
            <span className="shrink-0 text-texto-3">{tamanhoLegivel(a.tamanho)}</span>
            <Download className="h-3.5 w-3.5 shrink-0 text-texto-3" />
          </a>
        )
      })}
      <Dialog open={!!ampliado} onOpenChange={(aberto) => !aberto && setAmpliado(null)}>
        <DialogContent className="max-h-[90dvh] w-fit max-w-[calc(100vw-2rem)] overflow-auto p-2 sm:max-w-[90vw]">
          <DialogTitle className="sr-only">{ampliado?.nome}</DialogTitle>
          <DialogDescription className="sr-only">Imagem ampliada</DialogDescription>
          {ampliado && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ampliado.url} alt={ampliado.nome} className="max-h-[85dvh] w-auto max-w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
