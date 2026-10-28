'use client'

import { ChevronDown, Copy, Link2, Star, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOptimistic, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { duplicarListaNavegacao, excluirItemNavegacao, renomearItemNavegacao } from '@/app/(app)/acoes-navegacao'
import { favoritarListaAcao } from '@/app/(app)/listas/acoes-visao'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { botaoSecundario, campo } from '@/lib/ui'
import { avisar } from './avisar'

const botaoIcone = 'inline-flex h-6 w-6 items-center justify-center rounded-md text-texto-3 transition-colors hover:bg-hover hover:text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca'

/** Estrela ao lado do nome da lista: favorita da pessoa. */
export function EstrelaLista({ listaId, favorita }: { listaId: string; favorita: boolean }) {
  const [exibida, definir] = useOptimistic(favorita)
  const [, iniciar] = useTransition()
  return (
    <button
      type="button"
      aria-label={exibida ? 'Tirar dos favoritos' : 'Adicionar aos favoritos'}
      title={exibida ? 'Tirar dos favoritos' : 'Adicionar aos favoritos'}
      onClick={() => iniciar(async () => { definir(!exibida); avisar(await favoritarListaAcao(listaId, !exibida)) })}
      className={botaoIcone}
    >
      <Star className={`h-3.5 w-3.5 ${exibida ? 'fill-aviso text-aviso' : ''}`} />
    </button>
  )
}

/** Seta ao lado do nome da lista: renomear, duplicar e excluir (arquiva). Cor e ícone ficam no ⋯ da barra lateral. */
export function MenuLista({ listaId, nome, podeGerir }: { listaId: string; nome: string; podeGerir: boolean }) {
  const router = useRouter()
  const [, iniciar] = useTransition()
  if (!podeGerir) return null
  const renomear = () => {
    const novo = window.prompt('Novo nome da lista', nome)?.trim()
    if (!novo || novo === nome) return
    iniciar(async () => { if (avisar(await renomearItemNavegacao({ tipo: 'list', id: listaId, nome: novo }), true)) router.refresh() })
  }
  const duplicar = () =>
    iniciar(async () => {
      const r = await duplicarListaNavegacao(listaId)
      if (avisar(r, true) && r?.id) router.push(`/listas/${r.id}`)
    })
  const excluir = () => {
    if (!window.confirm(`Excluir a lista "${nome}"? Ela será arquivada.`)) return
    iniciar(async () => { if (avisar(await excluirItemNavegacao({ tipo: 'list', id: listaId }), true)) router.push('/home') })
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Ações da lista" className={botaoIcone}><ChevronDown className="h-3.5 w-3.5" /></DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onSelect={renomear}>Renomear</DropdownMenuItem>
        <DropdownMenuItem onSelect={duplicar}>Duplicar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={excluir} className="text-perigo"><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "Compartilhar": copia o link e mostra quem já tem acesso (membros do espaço). O acesso é gerido em Configurações → Usuários. */
export function CompartilharDialog({ nome, membros }: { nome: string; membros: { id: string; nome: string; papel: string }[] }) {
  const [aberto, setAberto] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split('?')[0])
      toast.success('Link da lista copiado.')
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-rotulo font-medium text-texto-2 transition hover:bg-hover hover:text-texto">
        <Link2 className="h-3.5 w-3.5" /> Compartilhar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar {nome}</DialogTitle>
          <DialogDescription>Quem tem acesso ao espaço desta lista abre o link. Para convidar alguém novo, use Configurações → Usuários.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <input readOnly aria-label="Link da lista" value={typeof window === 'undefined' ? '' : window.location.href.split('?')[0]} className={`${campo} h-8 flex-1 py-0`} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" onClick={copiar} className={`${botaoSecundario} gap-1.5`}><Copy className="h-3.5 w-3.5" /> Copiar link</button>
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-rotulo font-semibold text-texto-2"><Users className="h-3.5 w-3.5" /> Quem tem acesso ({membros.length})</p>
          <ul className="max-h-56 divide-y divide-borda overflow-y-auto rounded-md border border-borda">
            {membros.length === 0 && <li className="px-3 py-2 text-rotulo text-texto-3">Todos os administradores e gestores.</li>}
            {membros.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-3 py-1.5 text-rotulo"><span className="truncate">{m.nome}</span><span className="text-legenda capitalize text-texto-3">{m.papel}</span></li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
