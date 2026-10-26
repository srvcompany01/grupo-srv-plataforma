'use client'

import { ImagePlus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { validarCapa } from '@/dominio/clientes-galeria'
import { iniciarUploadLogoAcao, salvarLogoAcao } from '../acoes-galeria'

const botao = 'inline-flex h-9 items-center gap-2 rounded-lg border border-borda bg-white px-3 text-rotulo font-semibold transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/25 disabled:opacity-60'

/** Logo do cliente: quadradinha com cantos arredondados na galeria e no topo da página dele (e na página da bio). */
export function SeletorLogo({ clienteId, temLogo }: { clienteId: string; temLogo: boolean }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const arquivo = useRef<HTMLInputElement>(null)

  const enviar = (f: File) =>
    iniciar(async () => {
      const erro = validarCapa({ mime: f.type, tamanho: f.size })
      if (erro) return void avisar({ erro })
      const preparo = await iniciarUploadLogoAcao(clienteId, f.type, f.size)
      if ('erro' in preparo) return void avisar({ erro: preparo.erro })
      const resp = await fetch(preparo.url, { method: 'PUT', headers: { 'Content-Type': f.type }, body: f })
      if (!resp.ok) return void avisar({ erro: 'Falha ao enviar a imagem.' })
      if (avisar(await salvarLogoAcao(clienteId, preparo.chave), true)) router.refresh()
    })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pendente} onClick={() => arquivo.current?.click()} className={botao}>
        <ImagePlus className="h-4 w-4" aria-hidden="true" /> {temLogo ? 'Trocar logo' : 'Enviar logo'}
      </button>
      {temLogo && (
        <button type="button" disabled={pendente} onClick={() => iniciar(async () => { if (avisar(await salvarLogoAcao(clienteId, null), true)) router.refresh() })} className={botao}>
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Remover logo
        </button>
      )}
      <input ref={arquivo} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) enviar(f); e.target.value = '' }} />
    </div>
  )
}
