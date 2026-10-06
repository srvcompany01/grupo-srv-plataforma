'use client'

import { Check, UserPlus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Avatar } from '@/componentes/Avatar'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/componentes/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import type { Pessoa } from '@/dominio/tarefas'
import { definirResponsaveisAcao } from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'
import { Pessoas } from './Pessoas'

/** Escolhe responsáveis; salva ao fechar. O banco recusa ficar sem nenhum. */
export function SeletorResponsaveis({ tarefaId, atuais, equipe }: { tarefaId: string; atuais: Pessoa[]; equipe: Pessoa[] }) {
  const [aberto, setAberto] = useState(false)
  const [marcados, setMarcados] = useState(() => new Set(atuais.map((p) => p.id)))
  const [pendente, iniciar] = useTransition()

  function alternar(id: string) {
    const novo = new Set(marcados)
    if (novo.has(id)) novo.delete(id)
    else novo.add(id)
    setMarcados(novo)
  }

  function mudarAberto(v: boolean) {
    setAberto(v)
    if (v) return setMarcados(new Set(atuais.map((p) => p.id)))
    const ids = [...marcados]
    const iguais = ids.length === atuais.length && atuais.every((p) => marcados.has(p.id))
    if (!iguais) iniciar(async () => void avisar(await definirResponsaveisAcao(tarefaId, ids)))
  }

  return (
    <Popover open={aberto} onOpenChange={mudarAberto}>
      <PopoverTrigger disabled={pendente} aria-label="Responsáveis" className="rounded-full hover:opacity-80">
        {atuais.length ? <Pessoas pessoas={atuais} /> : <UserPlus className="h-5 w-5 text-texto-3" />}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar pessoa…" />
          <CommandList>
            <CommandEmpty>Ninguém encontrado.</CommandEmpty>
            {equipe.map((p) => (
              <CommandItem key={p.id} value={p.nome} onSelect={() => alternar(p.id)}>
                <Avatar nome={p.nome || '?'} tamanho="h-5 w-5 text-[9px]" />
                <span className="flex-1">{p.nome}</span>
                {marcados.has(p.id) && <Check className="h-4 w-4 text-marca" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
