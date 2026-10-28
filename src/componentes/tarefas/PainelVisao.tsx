'use client'

import { Ic } from '@/componentes/app/Ic'
import { Check, EyeOff, Link2, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IconeVisao } from './IconesVisao'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/componentes/ui/sheet'
import { GrupoCampos, LinhaInterruptor } from '@/componentes/ui/linha-campo'
import { AGRUPAMENTOS_BASICOS, ROTULO_AGRUPAMENTO } from '@/dominio/agrupamento'
import type { Filtros } from '@/dominio/filtros'
import { enderecoDaVisao } from '@/dominio/visao-salva'

const NOME_VISAO: Record<Filtros['visao'], string> = { lista: 'Lista', kanban: 'Quadro', calendario: 'Calendário', tabela: 'Tabela', galeria: 'Galeria', cronograma: 'Linha do tempo', carga: 'Carga de trabalho', atividade: 'Atividade', painel: 'Painel', documentos: 'Documentos' }
const VISOES_COM_GRUPO: Filtros['visao'][] = ['lista', 'galeria']

/** Atalho "Modo eu": mostra só as tarefas em que a própria pessoa é responsável (liga e desliga o filtro de responsável). */
export function ModoEu({ caminho, filtros, euId }: { caminho: string; filtros: Filtros; euId: string }) {
  const router = useRouter()
  const ligado = filtros.responsaveis.length === 1 && filtros.responsaveis[0] === euId
  const alternar = () => router.push(enderecoDaVisao(caminho, { ...filtros, responsaveis: ligado ? [] : [euId] }), { scroll: false })
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={ligado}
      title="Mostrar só as minhas tarefas"
      className="b-ghost"
      style={ligado ? { background: 'var(--red-soft)', color: 'var(--red)' } : undefined}
    >
      <Ic n="person" s={16} /> Modo eu
    </button>
  )
}

/** Painel lateral "Personalizar visualização": liga/desliga opções da visualização atual e copia o link dela. Tudo vai para a URL (e "Salvar visualização" guarda). */
export function PainelVisao({ caminho, filtros, euId, camposAgrupaveis }: { caminho: string; filtros: Filtros; euId: string; camposAgrupaveis: { id: string; nome: string }[] }) {
  const router = useRouter()
  const [copiado, setCopiado] = useState(false)
  const aplicar = (mudanca: Partial<Filtros>) => router.push(enderecoDaVisao(caminho, { ...filtros, ...mudanca }), { scroll: false })
  const euLigado = filtros.responsaveis.length === 1 && filtros.responsaveis[0] === euId
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${enderecoDaVisao(caminho, filtros)}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copie o link:', `${window.location.origin}${enderecoDaVisao(caminho, filtros)}`)
    }
  }
  return (
    <Sheet>
      <SheetTrigger className="b-icon" aria-label="Personalizar visualização" title="Personalizar visualização">
        <Ic n="tune" s={16} />
      </SheetTrigger>
      <SheetContent side="right" className="w-80 gap-0 p-0 sm:max-w-xs">
        <SheetHeader className="border-b border-borda px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-destaque"><IconeVisao visao={filtros.visao} /> Personalizar visualização</SheetTitle>
          <SheetDescription className="text-rotulo">{NOME_VISAO[filtros.visao]}. As opções ficam na URL; use “Salvar visualização” para a lista abrir sempre assim.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          <GrupoCampos legenda="Tarefas">
            <LinhaInterruptor rotulo="Ocultar tarefas concluídas" marcado={filtros.semConcluidas} aoMudar={(v) => aplicar({ semConcluidas: v })} Icone={EyeOff} />
            <LinhaInterruptor rotulo="Modo eu (só minhas tarefas)" marcado={euLigado} aoMudar={(v) => aplicar({ responsaveis: v ? [euId] : [] })} Icone={UserCheck} />
          </GrupoCampos>
          {VISOES_COM_GRUPO.includes(filtros.visao) && (
            <GrupoCampos legenda="Agrupar por">
              <div className="px-3 pb-2">
                <select
                  aria-label="Agrupar por"
                  value={filtros.agrupamento}
                  onChange={(e) => aplicar({ agrupamento: e.target.value })}
                  className="h-8 w-full rounded-md border border-input bg-white px-2 text-destaque text-texto"
                >
                  {AGRUPAMENTOS_BASICOS.map((g) => <option key={g} value={g}>{ROTULO_AGRUPAMENTO[g]}</option>)}
                  {camposAgrupaveis.map((c) => <option key={c.id} value={`campo:${c.id}`}>{c.nome}</option>)}
                </select>
              </div>
            </GrupoCampos>
          )}
          <GrupoCampos legenda="Compartilhar">
            <button type="button" onClick={copiar} className="flex min-h-7 w-full items-center gap-3 rounded-[7px] px-3 py-1 text-left text-destaque text-texto transition-colors hover:bg-hover">
              {copiado ? <Check className="h-4 w-4 text-sucesso" /> : <Link2 className="h-4 w-4 text-texto-3" />}
              {copiado ? 'Link copiado' : 'Copiar link da visualização'}
            </button>
          </GrupoCampos>
        </div>
      </SheetContent>
    </Sheet>
  )
}
