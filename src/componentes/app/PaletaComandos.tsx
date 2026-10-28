'use client'

import { Folder, Layers, ListTodo, Moon, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/componentes/ui/command'
import { itensDaNavegacao } from '@/dominio/paleta'
import type { Navegacao } from '@/dominio/arvore-espacos'
import { atalhosDoInicio } from './BarraLateral'
import { alternarTemaGlobal } from './tema-cliente'

/**
 * Paleta de comandos (⌘K / Ctrl+K): abre qualquer módulo, espaço ou lista digitando parte do nome, troca o tema,
 * mostra os atalhos e, com texto digitado, pesquisa tarefas (mesma busca do Painel de Gestão).
 */
export function PaletaComandos({ aberta, aoMudar, navegacao, papel, chatNaoLidas, aoAbrirAjuda }: { aberta: boolean; aoMudar: (aberta: boolean) => void; navegacao: Navegacao; papel: string; chatNaoLidas: number; aoAbrirAjuda: () => void }) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const modulos = useMemo(() => atalhosDoInicio(papel, chatNaoLidas), [papel, chatNaoLidas])
  const destinos = useMemo(() => itensDaNavegacao(navegacao), [navegacao])
  const ir = (href: string) => {
    aoMudar(false)
    router.push(href)
  }
  const fechando = (valor: boolean) => {
    if (!valor) setTexto('')
    aoMudar(valor)
  }
  return (
    <CommandDialog open={aberta} onOpenChange={fechando} title="Pesquisar" description="Abra um módulo, espaço ou lista, ou pesquise tarefas." className="sm:max-w-xl">
      <Command>
        <CommandInput value={texto} onValueChange={setTexto} placeholder="Pesquisar módulos, espaços, listas e tarefas…" />
        <CommandList className="max-h-96">
          <CommandEmpty>Nada encontrado. Pressione Enter para pesquisar tarefas.</CommandEmpty>
          {texto.trim() && (
            <CommandGroup heading="Tarefas">
              <CommandItem forceMount value={`pesquisar tarefas ${texto}`} onSelect={() => ir(`/painel-de-gestao?busca=${encodeURIComponent(texto.trim())}`)}>
                <Search /> Pesquisar tarefas por “{texto.trim()}”
              </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup heading="Ir para">
            {modulos.map(({ id, href, rotulo, Icone }) => (
              <CommandItem key={id} value={`ir ${rotulo}`} onSelect={() => ir(href)}><Icone /> {rotulo}</CommandItem>
            ))}
          </CommandGroup>
          {destinos.length > 0 && (
            <CommandGroup heading="Espaços e listas">
              {destinos.map((d) => (
                <CommandItem key={`${d.tipo}:${d.id}`} value={`${d.rotulo} ${d.contexto}`} onSelect={() => ir(d.href)}>
                  {d.tipo === 'espaco' ? <Layers /> : d.contexto.includes('/') ? <ListTodo /> : <Folder />}
                  <span className="truncate">{d.rotulo}</span>
                  {d.contexto && <span className="ml-auto truncate pl-3 text-legenda text-texto-3">{d.contexto}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading="Ações">
            <CommandItem value="alternar tema claro escuro noturno" onSelect={() => { alternarTemaGlobal(); aoMudar(false) }}><Moon /> Alternar tema claro/escuro</CommandItem>
            <CommandItem value="atalhos de teclado ajuda" onSelect={() => { aoMudar(false); aoAbrirAjuda() }}>Atalhos de teclado <CommandShortcut>?</CommandShortcut></CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
