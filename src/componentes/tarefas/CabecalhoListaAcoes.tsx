'use client'

import { Ic } from '@/componentes/app/Ic'
import { Copy, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOptimistic, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { duplicarListaNavegacao, excluirItemNavegacao, renomearItemNavegacao } from '@/app/(app)/acoes-navegacao'
import { favoritarListaAcao } from '@/app/(app)/listas/acoes-visao'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { avisar } from './avisar'


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
    >
      <Ic n="star" s={16} fill={exibida} style={{ color: exibida ? '#e0a100' : 'var(--text-3)' }} />
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
      <DropdownMenuTrigger aria-label="Ações da lista"><Ic n="keyboard_arrow_down" s={16} /></DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={renomear}>Renomear</DropdownMenuItem>
        <DropdownMenuItem onSelect={duplicar}>Duplicar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={excluir}><Trash2 /> Excluir</DropdownMenuItem>
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
      <DialogTrigger>
        <Ic n="share" s={16} /> Compartilhar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar {nome}</DialogTitle>
          <DialogDescription>Quem tem acesso ao espaço desta lista abre o link. Para convidar alguém novo, use Configurações → Usuários.</DialogDescription>
        </DialogHeader>
        <div>
          <input readOnly aria-label="Link da lista" value={typeof window === 'undefined' ? '' : window.location.href.split('?')[0]} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" onClick={copiar}><Copy /> Copiar link</button>
        </div>
        <div>
          <p><Users /> Quem tem acesso ({membros.length})</p>
          <ul>
            {membros.length === 0 && <li>Todos os administradores e gestores.</li>}
            {membros.map((m) => (
              <li key={m.id}><span>{m.nome}</span><span>{m.papel}</span></li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
