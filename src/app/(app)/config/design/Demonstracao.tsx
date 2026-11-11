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
  <section>
    <h2>{titulo}</h2>
    {children}
  </section>
)

/** Vitrine dos componentes de base. Troque o tema pelo botão sol/lua no pé da faixa lateral e confira os dois. */
export function Demonstracao() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <div>
      <p>Componentes de base do novo design (Fase 1). Use o botão sol/lua no pé da barra de ícones para ver o tema claro e o escuro.</p>
      <Secao titulo="Cores do tema">
        <div>
          {CORES.map(([nome, classe]) => (
            <div key={nome}><div /><p>{nome}</p></div>
          ))}
        </div>
      </Secao>
      <Secao titulo="Tipografia (pilha de sistema)">
        <div>
          {TAMANHOS.map(([nome, classe, px]) => <p key={nome}>{nome} · {px}px — Plataforma Grupo SRV</p>)}
          <p>Título de página</p>
        </div>
      </Secao>
      <Secao titulo="Botões (24 / 28 / 32px, raio 6)">
        <div>
          <Button size="xs">Pequeno</Button><Button size="sm">Médio</Button><Button>Padrão</Button>
          <Button variant="outline">Contorno</Button><Button variant="secondary">Secundário</Button><Button variant="ghost">Fantasma</Button><Button variant="destructive">Excluir</Button>
        </div>
      </Secao>
      <Secao titulo="Campo, menu e avatar">
        <div>
          <Input placeholder="Pesquisar…" aria-label="Exemplo de campo" />
          <DropdownMenu>
            <DropdownMenuTrigger>Menu suspenso</DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem>Renomear</DropdownMenuItem><DropdownMenuItem>Duplicar</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem>Arquivar</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Avatar nome="Grupo SRV" tamanho="h-8 w-8 text-rotulo" />
        </div>
      </Secao>
      <Secao titulo="Painel lateral: grupo de linhas (interruptor 24×14, linha 28px)">
        <div>
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
        <div>
          <span>Sucesso</span>
          <span>Aviso</span>
          <span>Perigo</span>
          <span><Bell /> Informação</span>
          <span><Flag /> Prioridade</span>
        </div>
      </Secao>
    </div>
  )
}
