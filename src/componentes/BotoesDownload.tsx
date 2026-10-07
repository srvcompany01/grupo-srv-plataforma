'use client'

import { zipSync } from 'fflate'
import { useState } from 'react'
import { nomesNoZip } from '@/dominio/download'
import type { MidiaParaVer } from '@/lib/midias-view'
import { botaoSecundario } from '@/lib/ui'
import { Icone } from './Icone'

function salvar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: nome })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Arquivo único: link assinado com Content-Disposition (salva com o nome original).
 * Carrossel: o zip é montado no navegador, buscando as imagens direto do R2,
 * para não passar pelo limite de resposta das funções da Vercel.
 */
export function BotoesDownload({ midias, atual, nomeZip }: { midias: MidiaParaVer[]; atual: number; nomeZip: string }) {
  const [estado, setEstado] = useState<'parado' | 'montando' | 'erro'>('parado')
  if (midias.length === 0) return null

  async function baixarTodas() {
    setEstado('montando')
    try {
      const nomes = nomesNoZip(midias.map((m) => m.nome))
      const conteudos = await Promise.all(
        midias.map(async (m) => {
          // no-store: a cópia em cache veio da <img>, sem cabeçalho CORS, e o fetch falharia.
          const r = await fetch(m.url, { cache: 'no-store' })
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return new Uint8Array(await r.arrayBuffer())
        }),
      )
      // Monta na ordem do carrossel; level 0 porque imagens já são comprimidas.
      const arquivos = Object.fromEntries(nomes.map((n, i) => [n, conteudos[i]]))
      const zip = zipSync(arquivos, { level: 0 })
      salvar(new Blob([zip as BlobPart], { type: 'application/zip' }), nomeZip)
      setEstado('parado')
    } catch {
      setEstado('erro')
    }
  }

  if (midias.length === 1) {
    const unica = midias[0]
    return (
      <div className="flex justify-center">
        <a href={unica.urlDownload} className={botaoSecundario}>
          <Icone nome="baixar" className="h-3.5 w-3.5" />
          {unica.tipo === 'video' ? 'Baixar vídeo' : 'Baixar imagem'}
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap justify-center gap-2">
        <a href={midias[atual]?.urlDownload} className={botaoSecundario}>
          <Icone nome="baixar" className="h-3.5 w-3.5" />
          Baixar esta imagem
        </a>
        <button type="button" onClick={baixarTodas} disabled={estado === 'montando'} className={botaoSecundario}>
          <Icone nome="baixar" className="h-3.5 w-3.5" />
          {estado === 'montando' ? 'Preparando…' : `Baixar todas (.zip)`}
        </button>
      </div>
      {estado === 'erro' && (
        <p className="text-center text-xs text-perigo">Não foi possível montar o zip. Baixe as imagens uma a uma.</p>
      )}
    </div>
  )
}
