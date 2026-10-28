'use client'

import { Bell, Flag, Layers, ListFilter, Lock, Star } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/componentes/Avatar'
import { Button } from '@/componentes/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { Input } from '@/componentes/ui/input'
import { GrupoCampos, LinhaBotao, LinhaInterruptor } from '@/componentes/ui/linha-campo'

const CORES = [
  ['Fundo', 'bg-fundo'], ['Superfície', 'bg-white'], ['Hover', 'bg-hover'], ['Ação', 'bg-petroleo'], ['Destaque', 'bg-marca'], ['Perigo', 'bg-perigo'], ['Sucesso', 'bg-sucesso'], ['Aviso', 'bg-aviso'],
] as const
const TAMANHOS = [['micro', 'text-micro', '10'], ['legenda', 'text-legenda', '11'], ['rótulo', 'text-rotulo', '12'], ['corpo', 'text-corpo', '13'], ['destaque', 'text-destaque', '14']] as const

const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-borda bg-white p-4">
    <h2 className="mb-3 text-destaque font-semibold text-texto">{titulo}</h2>
    {children}
  </section>
)

/** Vitrine dos componentes de base. Troque o tema pelo botão sol/lua no pé da faixa lateral e confira os dois. */
export function Demonstracao() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <div className="space-y-4">
      <p className="text-corpo text-texto-3">Componentes de base do novo design (Fase 1). Use o botão sol/lua no pé da barra de ícones para ver o tema claro e o escuro.</p>
      <Secao titulo="Cores do tema">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {CORES.map(([nome, classe]) => (
            <div key={nome} className="text-center"><div className={`h-10 rounded-lg border border-borda ${classe}`} /><p className="mt-1 text-legenda text-texto-3">{nome}</p></div>
          ))}
        </div>
      </Secao>
      <Secao titulo="Tipografia (pilha de sistema)">
        <div className="space-y-1">
          {TAMANHOS.map(([nome, classe, px]) => <p key={nome} className={`${classe} text-texto`}>{nome} · {px}px — Plataforma Grupo SRV</p>)}
          <p className="page-title">Título de página</p>
        </div>
      </Secao>
      <Secao titulo="Botões (24 / 28 / 32px, raio 6)">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs">Pequeno</Button><Button size="sm">Médio</Button><Button>Padrão</Button>
          <Button variant="outline">Contorno</Button><Button variant="secondary">Secundário</Button><Button variant="ghost">Fantasma</Button><Button variant="destructive">Excluir</Button>
        </div>
      </Secao>
      <Secao titulo="Campo, menu e avatar">
        <div className="flex flex-wrap items-center gap-3">
          <Input className="w-56" placeholder="Pesquisar…" aria-label="Exemplo de campo" />
          <DropdownMenu>
            <DropdownMenuTrigger className="controle rounded-md border border-borda px-3 py-1.5 text-rotulo font-medium text-texto">Menu suspenso</DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem>Renomear</DropdownMenuItem><DropdownMenuItem>Duplicar</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem>Arquivar</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Avatar nome="Grupo SRV" tamanho="h-8 w-8 text-rotulo" />
        </div>
      </Secao>
      <Secao titulo="Painel lateral: grupo de linhas (interruptor 24×14, linha 28px)">
        <div className="w-80 rounded-xl border border-borda">
          <GrupoCampos legenda="Layout da página">
            <LinhaInterruptor rotulo="Mostrar status vazios" marcado={a} aoMudar={setA} />
            <LinhaInterruptor rotulo="Quebrar texto" marcado={b} aoMudar={setB} />
            <LinhaInterruptor rotulo="Visualização privada" marcado={false} aoMudar={() => {}} Icone={Lock} />
          </GrupoCampos>
          <GrupoCampos legenda="Configurações de visualização">
            <LinhaBotao rotulo="Campos" valor="3 exibido" Icone={Layers} />
            <LinhaBotao rotulo="Filtro" valor="Nenhum" Icone={ListFilter} />
            <LinhaBotao rotulo="Favorito" Icone={Star} />
          </GrupoCampos>
        </div>
      </Secao>
      <Secao titulo="Estados de aviso">
        <div className="flex flex-wrap gap-2 text-rotulo">
          <span className="rounded-md bg-sucesso-fundo px-2 py-1 text-sucesso-forte">Sucesso</span>
          <span className="rounded-md bg-aviso-fundo px-2 py-1 text-aviso-forte">Aviso</span>
          <span className="rounded-md bg-perigo-fundo px-2 py-1 text-perigo-forte">Perigo</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-azul-fundo px-2 py-1 text-azul"><Bell className="h-3.5 w-3.5" /> Informação</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-borda px-2 py-1 text-texto-2"><Flag className="h-3.5 w-3.5" /> Prioridade</span>
        </div>
      </Secao>
    </div>
  )
}
