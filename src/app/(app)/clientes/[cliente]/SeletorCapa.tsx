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
      <DialogTrigger>
        <ImageIcon aria-hidden="true" /> {temCapa ? 'Alterar capa' : 'Escolher capa'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capa do cliente</DialogTitle>
          <DialogDescription>Busque uma foto no Unsplash ou envie uma imagem sua (JPG, PNG ou WebP, até 5 MB).</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void buscar()
          }}
        >
          <label>
            <span className="sr-only">Buscar foto</span>
            <Search aria-hidden="true" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar foto, ex.: clínica, restaurante…"
              autoComplete="off"
            />
          </label>
          <button disabled={buscando || !busca.trim()}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </form>

        {erroBusca && <p role="alert">{erroBusca}</p>}
        {fotos && fotos.length === 0 && !erroBusca && <p>Nenhuma foto encontrada. Tente outra palavra.</p>}
        {fotos && fotos.length > 0 && (
          <ul>
            {fotos.map((foto) => (
              <li key={foto.id}>
                <button
                  type="button"
                  disabled={pendente}
                  onClick={() => escolher(foto)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura externa do Unsplash */}
                  <img src={foto.miniatura} alt={foto.descricao} width={400} height={250} loading="lazy" />
                  <span>{foto.credito}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div>
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
          <button type="button" disabled={pendente} onClick={() => arquivo.current?.click()}>
            <Upload aria-hidden="true" /> {pendente ? 'Enviando…' : 'Enviar imagem'}
          </button>
          {temCapa && (
            <button type="button" disabled={pendente} onClick={remover}>
              <Trash2 aria-hidden="true" /> Remover capa
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
