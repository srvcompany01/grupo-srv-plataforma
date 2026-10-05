'use client'

import { useEffect, useRef, useState } from 'react'
import { acaoPedirUpload } from '@/app/admin/(protegido)/acoes'
import { TIPOS_ACEITOS } from '@/dominio/midias'
import type { MidiaEntrada, TipoMidia } from '@/dominio/tipos'
import { botaoSecundario } from '@/lib/ui'

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export type MidiaInicial = MidiaEntrada & { urlPreview: string }

interface Item {
  id: string
  nome: string
  tipo: TipoMidia
  tamanhoBytes: number
  preview: string
  chave?: string
  progresso: number
  erro?: string
  arquivo?: File
}

function enviarArquivo(url: string, arquivo: File, aoProgredir: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', arquivo.type)
    xhr.upload.onprogress = (e) => e.lengthComputable && aoProgredir(e.loaded / e.total)
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('rede'))
    xhr.send(arquivo)
  })
}

export function EditorMidias({
  postId,
  iniciais,
  onChange,
}: {
  postId: string
  iniciais: MidiaInicial[]
  onChange: (midias: MidiaEntrada[], pendentes: boolean) => void
}) {
  const [itens, setItens] = useState<Item[]>(() =>
    iniciais.map((m) => ({
      id: m.chave,
      nome: m.nomeOriginal,
      tipo: m.tipo,
      tamanhoBytes: m.tamanhoBytes,
      preview: m.urlPreview,
      chave: m.chave,
      progresso: 1,
    })),
  )
  const [arrastando, setArrastando] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const prontos = itens.filter((i) => i.chave && !i.erro && i.progresso === 1)
    onChange(
      prontos.map((i) => ({ chave: i.chave!, tipo: i.tipo, nomeOriginal: i.nome, tamanhoBytes: i.tamanhoBytes })),
      prontos.length !== itens.length,
    )
  }, [itens, onChange])

  const atualizar = (id: string, mudanca: Partial<Item>) =>
    setItens((atual) => atual.map((i) => (i.id === id ? { ...i, ...mudanca } : i)))

  async function subir(item: Item) {
    const arquivo = item.arquivo!
    atualizar(item.id, { erro: undefined, progresso: 0 })
    const r = await acaoPedirUpload(postId, { nome: arquivo.name, tipoMime: arquivo.type, tamanhoBytes: arquivo.size })
    if ('erro' in r) return atualizar(item.id, { erro: r.erro })
    try {
      await enviarArquivo(r.url, arquivo, (p) => atualizar(item.id, { progresso: Math.min(p, 0.99) }))
      atualizar(item.id, { chave: r.chave, progresso: 1 })
    } catch {
      atualizar(item.id, { erro: 'Falha no envio.' })
    }
  }

  function adicionar(lista: FileList | null) {
    if (!lista) return
    const novos: Item[] = Array.from(lista).map((arquivo) => {
      const tipo = TIPOS_ACEITOS[arquivo.type]
      return {
        id: crypto.randomUUID(),
        nome: arquivo.name,
        tipo: tipo ?? 'imagem',
        tamanhoBytes: arquivo.size,
        preview: URL.createObjectURL(arquivo),
        progresso: 0,
        arquivo,
        erro: tipo ? undefined : 'Formato não aceito. Use JPG, PNG, WEBP, MP4 ou MOV.',
      }
    })
    setItens((atual) => [...atual, ...novos])
    for (const n of novos) if (!n.erro) void subir(n)
  }

  function mover(indice: number, delta: number) {
    setItens((atual) => {
      const copia = [...atual]
      const [item] = copia.splice(indice, 1)
      copia.splice(indice + delta, 0, item)
      return copia
    })
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          adicionar(e.dataTransfer.files)
        }}
        onClick={() => entrada.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center text-sm ${
          arrastando ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-300 bg-white'
        }`}
      >
        Arraste fotos ou vídeo aqui, ou clique para escolher
        <p className="mt-1 text-xs text-neutral-500">1 vídeo, 1 imagem ou carrossel de até 20 imagens · até 1 GB</p>
        <input
          ref={entrada}
          type="file"
          multiple
          accept={Object.keys(TIPOS_ACEITOS).join(',')}
          className="hidden"
          onChange={(e) => {
            adicionar(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <ol className="space-y-2">
        {itens.map((item, i) => (
          <li key={item.id} className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm">
            <span className="w-5 text-center text-xs text-neutral-500">{i + 1}</span>
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {item.tipo === 'video' ? (
                <video src={item.preview} muted preload="metadata" className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.preview} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate">{item.nome}</p>
              {item.erro ? (
                <p className="text-rose-700">
                  {item.erro}{' '}
                  {item.arquivo && TIPOS_ACEITOS[item.arquivo.type] && (
                    <button type="button" className="underline" onClick={() => subir(item)}>
                      Tentar de novo
                    </button>
                  )}
                </p>
              ) : item.progresso < 1 ? (
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-neutral-200">
                  <div className="h-full bg-neutral-900 transition-all" style={{ width: `${item.progresso * 100}%` }} />
                </div>
              ) : (
                <p className="text-neutral-500">{formatarTamanho(item.tamanhoBytes)}</p>
              )}
            </div>
            <div className="flex gap-1">
              <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)} className={botaoSecundario}>
                ↑
              </button>
              <button
                type="button"
                aria-label="Descer"
                disabled={i === itens.length - 1}
                onClick={() => mover(i, 1)}
                className={botaoSecundario}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label="Remover"
                onClick={() => setItens((atual) => atual.filter((x) => x.id !== item.id))}
                className={botaoSecundario}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
