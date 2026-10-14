'use client'

import { ImageIcon, Search, Trash2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { validarCapa } from '@/dominio/clientes-galeria'
import { escolherCapaUnsplashAcao, iniciarUploadCapaAcao, removerCapaAcao, salvarCapaEnviadaAcao } from '../acoes-galeria'

type Foto = { id: string; descricao: string; miniatura: string; url: string; credito: string; download: string }

export function SeletorCapa({ clienteId, temCapa }: { clienteId: string; temCapa: boolean }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [fotos, setFotos] = useState<Foto[] | null>(null)
  const [erroBusca, setErroBusca] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [pendente, iniciar] = useTransition()
  const arquivo = useRef<HTMLInputElement>(null)

  const concluir = () => {
    setAberto(false)
    router.refresh()
  }

  const buscar = async () => {
    if (!busca.trim()) return
    setBuscando(true)
    setErroBusca(null)
    try {
      const resp = await fetch(`/api/unsplash?q=${encodeURIComponent(busca.trim())}`)
      const corpo = (await resp.json()) as { fotos?: Foto[]; erro?: string }
      if (!resp.ok) setErroBusca(corpo.erro ?? 'Não foi possível buscar imagens.')
      else setFotos(corpo.fotos ?? [])
    } catch {
      setErroBusca('Não foi possível buscar imagens.')
    } finally {
      setBuscando(false)
    }
  }

  const escolher = (foto: Foto) =>
    iniciar(async () => {
      if (avisar(await escolherCapaUnsplashAcao(clienteId, { url: foto.url, credito: foto.credito, download: foto.download }), true)) concluir()
    })

  const enviar = (f: File) =>
    iniciar(async () => {
      const erro = validarCapa({ mime: f.type, tamanho: f.size })
      if (erro) return void avisar({ erro })
      const preparo = await iniciarUploadCapaAcao(clienteId, f.type, f.size)
      if ('erro' in preparo) return void avisar({ erro: preparo.erro })
      const resp = await fetch(preparo.url, { method: 'PUT', headers: { 'Content-Type': f.type }, body: f })
      if (!resp.ok) return void avisar({ erro: 'Falha ao enviar a imagem.' })
      if (avisar(await salvarCapaEnviadaAcao(clienteId, preparo.chave), true)) concluir()
    })

  const remover = () =>
    iniciar(async () => {
      if (avisar(await removerCapaAcao(clienteId), true)) concluir()
    })

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger className="inline-flex h-9 items-center gap-2 rounded-lg border border-borda bg-white px-3 text-rotulo font-semibold transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/25">
        <ImageIcon className="h-4 w-4" aria-hidden="true" /> {temCapa ? 'Alterar capa' : 'Escolher capa'}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Capa do cliente</DialogTitle>
          <DialogDescription>Busque uma foto no Unsplash ou envie uma imagem sua (JPG, PNG ou WebP, até 5 MB).</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void buscar()
          }}
          className="flex gap-2"
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Buscar foto</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-3" aria-hidden="true" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar foto, ex.: clínica, restaurante…"
              autoComplete="off"
              className="h-9 w-full rounded-lg border border-borda bg-white pl-9 pr-3 text-rotulo outline-none focus-visible:border-marca focus-visible:ring-3 focus-visible:ring-marca/20"
            />
          </label>
          <button disabled={buscando || !busca.trim()} className="h-9 rounded-lg bg-texto px-4 text-rotulo font-semibold text-white transition-colors hover:bg-carbon disabled:opacity-40">
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </form>

        {erroBusca && <p role="alert" className="text-rotulo text-perigo">{erroBusca}</p>}
        {fotos && fotos.length === 0 && !erroBusca && <p className="text-rotulo text-texto-3">Nenhuma foto encontrada. Tente outra palavra.</p>}
        {fotos && fotos.length > 0 && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {fotos.map((foto) => (
              <li key={foto.id}>
                <button
                  type="button"
                  disabled={pendente}
                  onClick={() => escolher(foto)}
                  className="group relative block aspect-[16/10] w-full overflow-hidden rounded-lg border border-borda focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/40 disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura externa do Unsplash */}
                  <img src={foto.miniatura} alt={foto.descricao} width={400} height={250} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-left text-legenda text-white">{foto.credito}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-borda pt-3">
          <input
            ref={arquivo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) enviar(f)
            }}
          />
          <button type="button" disabled={pendente} onClick={() => arquivo.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-borda px-3 text-rotulo font-semibold transition-colors hover:bg-hover disabled:opacity-50">
            <Upload className="h-4 w-4" aria-hidden="true" /> {pendente ? 'Enviando…' : 'Enviar imagem'}
          </button>
          {temCapa && (
            <button type="button" disabled={pendente} onClick={remover} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-rotulo font-semibold text-perigo-forte transition-colors hover:bg-perigo-fundo disabled:opacity-50">
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Remover capa
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
