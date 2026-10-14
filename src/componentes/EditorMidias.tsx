'use client'

import { useEffect, useRef, useState } from 'react'
import { acaoPedirUpload } from '@/app/admin/(protegido)/acoes'
import { TIPOS_ACEITOS } from '@/dominio/midias'
import type { MidiaEntrada, TipoMidia } from '@/dominio/tipos'
import { botaoFantasma } from '@/lib/ui'
import { Icone } from './Icone'

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
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-6 text-center text-corpo transition ${
          arrastando ? 'border-marca bg-marca-fundo text-marca' : 'border-borda-forte bg-fundo text-texto-2 hover:border-marca hover:text-marca'
        }`}
      >
        <Icone nome="upload" className="h-5 w-5" />
        <span>
          Solte os arquivos aqui ou <span className="font-medium text-marca">escolha no computador</span>
        </span>
        <span className="text-xs text-texto-3">1 vídeo, 1 imagem ou carrossel de até 20 imagens · até 1 GB</span>
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

      <ol className="divide-y divide-borda overflow-hidden rounded-lg border border-borda bg-white empty:hidden">
        {itens.map((item, i) => (
          <li key={item.id} className="flex items-center gap-3 px-2 py-2 hover:bg-hover">
            <span className="w-5 text-center text-xs text-texto-3">{i + 1}</span>
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-hover">
              {item.tipo === 'video' ? (
                <video src={item.preview} muted preload="metadata" className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.preview} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-corpo">
              <p className="truncate">{item.nome}</p>
              {item.erro ? (
                <p className="text-perigo">
                  {item.erro}{' '}
                  {item.arquivo && TIPOS_ACEITOS[item.arquivo.type] && (
                    <button type="button" className="underline" onClick={() => subir(item)}>
                      Tentar de novo
                    </button>
                  )}
                </p>
              ) : item.progresso < 1 ? (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hover">
                  <div className="h-full rounded-full bg-marca transition-all" style={{ width: `${item.progresso * 100}%` }} />
                </div>
              ) : (
                <p className="text-xs text-texto-3">{formatarTamanho(item.tamanhoBytes)}</p>
              )}
            </div>
            <div className="flex gap-0.5">
              <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)} className={`${botaoFantasma} w-8 px-0`}>
                ↑
              </button>
              <button
                type="button"
                aria-label="Descer"
                disabled={i === itens.length - 1}
                onClick={() => mover(i, 1)}
                className={`${botaoFantasma} w-8 px-0`}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label="Remover"
                onClick={() => setItens((atual) => atual.filter((x) => x.id !== item.id))}
                className={`${botaoFantasma} w-8 px-0`}
              >
                <Icone nome="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
