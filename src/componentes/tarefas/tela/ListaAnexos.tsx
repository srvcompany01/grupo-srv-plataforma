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
    <div>
      <div>
        {anexos
          .filter((a) => a.tipo === 'arquivo' && a.mime.startsWith('image/'))
          .map((a) => (
            <button key={a.id} type="button" onClick={() => setAmpliado(a)} aria-label={`Ampliar ${a.nome}`}>
              {/* URL assinada do R2: next/image exigiria configurar o domínio. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" decoding="async" src={a.url} alt={a.nome} />
            </button>
          ))}
      </div>
      {anexos.map((a) => {
        if (a.tipo === 'audio') {
          return (
            <audio key={a.id} controls preload="metadata" src={a.url} aria-label={a.nome}>
              <track kind="captions" />
            </audio>
          )
        }
        if (a.tipo === 'video') {
          return (
            <video key={a.id} controls preload="metadata" src={a.url} aria-label={a.nome}>
              <track kind="captions" />
            </video>
          )
        }
        if (a.mime.startsWith('image/')) return null
        return (
          <a key={a.id} href={a.url} download={a.nome} target="_blank" rel="noreferrer">
            <FileText />
            <span>{a.nome}</span>
            <span>{tamanhoLegivel(a.tamanho)}</span>
            <Download />
          </a>
        )
      })}
      <Dialog open={!!ampliado} onOpenChange={(aberto) => !aberto && setAmpliado(null)}>
        <DialogContent>
          <DialogTitle className="sr-only">{ampliado?.nome}</DialogTitle>
          <DialogDescription className="sr-only">Imagem ampliada</DialogDescription>
          {ampliado && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ampliado.url} alt={ampliado.nome} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
